var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CredStash_kmsClient, _CredStash_ddb;
import { KMSClient } from '@aws-sdk/client-kms';
import { ConditionalCheckFailedException, DynamoDBClient, } from '@aws-sdk/client-dynamodb';
import debugFn from 'debug';
import { DynamoDB } from './lib/dynamoDb';
import { paddedInt, sanitizeVersion, sortSecrets } from './lib/utils';
import { KeyService } from './lib/keyService';
import { sealAesCtrLegacy, openAesCtrLegacy } from './lib/aesCredstash';
const debug = debugFn('credStash');
export class CredStash {
    constructor({ kmsOpts = {}, dynamoOpts = {}, } = {}) {
        _CredStash_kmsClient.set(this, void 0);
        _CredStash_ddb.set(this, void 0);
        this.paddedInt = paddedInt;
        __classPrivateFieldSet(this, _CredStash_kmsClient, new KMSClient(kmsOpts), "f");
        __classPrivateFieldSet(this, _CredStash_ddb, new DynamoDB(new DynamoDBClient(dynamoOpts)), "f");
        const credStash = this;
        Object.getOwnPropertyNames(CredStash.prototype).forEach((key) => {
            const method = credStash[key];
            credStash[key] = (...args) => {
                const lastArg = args.slice(-1)[0];
                let cb;
                if (typeof lastArg === 'function') {
                    cb = args.pop();
                }
                return method.apply(credStash, args)
                    .then((res) => {
                    if (cb) {
                        return cb(undefined, res);
                    }
                    return res;
                })
                    .catch((err) => {
                    if (cb) {
                        return cb(err);
                    }
                    throw err;
                });
            };
        });
    }
    async getHighestVersion(opts) {
        const { Items = [] } = await __classPrivateFieldGet(this, _CredStash_ddb, "f").getLatestVersion(opts);
        const [{ version = paddedInt(0) } = {}] = Items;
        return version;
    }
    async incrementVersion(opts) {
        const rawVersion = await this.getHighestVersion(opts);
        if (`${rawVersion}`.match(/^[0-9]+$/)) {
            const version = Number.parseInt(rawVersion, 10) + 1;
            return paddedInt(version);
        }
        throw new Error(`Can not autoincrement version. The current version: ${rawVersion} is not an int`);
    }
    async putSecret({ name, version: origVersion, secret, context, digest, kmsKey, tableName, }) {
        const version = sanitizeVersion(origVersion, 1);
        const keyService = new KeyService(new KMSClient({}), kmsKey, context);
        const sealed = await sealAesCtrLegacy(keyService, secret, digest);
        const data = Object.assign({ name, version }, sealed);
        try {
            const result = await __classPrivateFieldGet(this, _CredStash_ddb, "f").createSecret(data, tableName);
            return result;
        }
        catch (err) {
            if (err instanceof ConditionalCheckFailedException) {
                throw new Error(`${name} version ${version} is already in the credential store.`);
            }
            throw err;
        }
    }
    async getAllVersions({ name, context, limit, kmsKey, tableName, }) {
        const keyService = new KeyService(__classPrivateFieldGet(this, _CredStash_kmsClient, "f"), kmsKey, context);
        const { Items = [] } = await __classPrivateFieldGet(this, _CredStash_ddb, "f").getAllVersions({ name, tableName, limit });
        return Promise.all(Items.map(async (record) => ({
            version: record.version,
            secret: await openAesCtrLegacy(keyService, record),
        })));
    }
    async getSecret({ name, context, version: origVersion, kmsKey, tableName, }) {
        const version = sanitizeVersion(origVersion);
        const keyService = new KeyService(new KMSClient({}), kmsKey, context);
        let record;
        if (version) {
            ({ Item: record } = await __classPrivateFieldGet(this, _CredStash_ddb, "f").getByVersion({ name, version, tableName }));
        }
        else {
            ({ Items: [record] } = await __classPrivateFieldGet(this, _CredStash_ddb, "f").getLatestVersion({ name, tableName }));
        }
        if (!record || !record.key) {
            throw new Error(`Item {'name': '${name}'} could not be found.`);
        }
        const decrypted = await openAesCtrLegacy(keyService, record);
        return decrypted;
    }
    async deleteSecrets(opts) {
        const { Items = [] } = await __classPrivateFieldGet(this, _CredStash_ddb, "f").getAllVersions(opts);
        const results = [];
        for (const secret of Items) {
            const result = await this.deleteSecret({ name: opts.name, version: secret.version });
            results.push(result);
        }
        return results;
    }
    async deleteSecret({ version: origVersion, name, ...opts }) {
        const version = sanitizeVersion(origVersion);
        if (!version) {
            throw new Error('version is a required parameter');
        }
        debug(`Deleting ${name} -- version ${version}`);
        return __classPrivateFieldGet(this, _CredStash_ddb, "f").deleteSecret({ ...opts, name, version });
    }
    async listSecrets(opts) {
        const { Items = [] } = await __classPrivateFieldGet(this, _CredStash_ddb, "f").getAllSecretsAndVersions(opts);
        return Items.sort(sortSecrets);
    }
    async getAllSecrets({ version, startsWith, ...opts } = {}) {
        const unOrdered = {};
        const secrets = await this.listSecrets(opts);
        const position = {};
        const ordered = {};
        const filtered = [];
        secrets
            .filter((secret) => secret.version === (version || secret.version))
            .filter((secret) => !startsWith || secret.name.startsWith(startsWith))
            .forEach((next) => {
            position[next.name] = position[next.name]
                ? position[next.name] : filtered.push(next);
        });
        for (const secret of filtered) {
            try {
                unOrdered[secret.name] = await this.getSecret({
                    name: secret.name,
                    version: secret.version,
                    ...opts,
                });
            }
            catch (e) {
                debug(`Ran into some issue ${JSON.stringify(e)}`);
            }
        }
        Object.keys(unOrdered).sort().forEach((key) => {
            ordered[key] = unOrdered[key];
        });
        return ordered;
    }
    createDdbTable(opts) {
        return __classPrivateFieldGet(this, _CredStash_ddb, "f").createTable(opts);
    }
}
_CredStash_kmsClient = new WeakMap(), _CredStash_ddb = new WeakMap();
