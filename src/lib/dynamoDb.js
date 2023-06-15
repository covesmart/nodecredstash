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
var _DynamoDB_docClient, _DynamoDB_ddb;
import { DescribeTableCommand, CreateTableCommand, waitUntilTableExists, ResourceNotFoundException, } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, ScanCommand, QueryCommand, GetCommand, } from '@aws-sdk/lib-dynamodb';
import debugFn from 'debug';
import { pause } from './utils';
import { DEFAULT_TABLE } from '../defaults';
const debug = debugFn('credStash');
const createTableQuery = (TableName) => new CreateTableCommand({
    TableName,
    KeySchema: [
        {
            AttributeName: 'name',
            KeyType: 'HASH',
        },
        {
            AttributeName: 'version',
            KeyType: 'RANGE',
        },
    ],
    AttributeDefinitions: [
        {
            AttributeName: 'name',
            AttributeType: 'S',
        },
        {
            AttributeName: 'version',
            AttributeType: 'S',
        },
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
    },
});
const combineResults = (curr, next) => {
    if (!curr) {
        return next;
    }
    return Object.assign({}, next, {
        Items: curr.Items.concat(next.Items),
        Count: curr.Count + next.Count,
    });
};
const createAllVersionsQuery = ({ limit, name, tableName = DEFAULT_TABLE }) => {
    const params = {
        TableName: tableName,
        ConsistentRead: true,
        ScanIndexForward: false,
        KeyConditionExpression: '#name = :name',
        ExpressionAttributeNames: {
            '#name': 'name',
        },
        Limit: limit,
        ExpressionAttributeValues: {
            ':name': name,
        },
    };
    return params;
};
export class DynamoDB {
    constructor(ddb) {
        _DynamoDB_docClient.set(this, void 0);
        _DynamoDB_ddb.set(this, void 0);
        __classPrivateFieldSet(this, _DynamoDB_ddb, ddb, "f");
        __classPrivateFieldSet(this, _DynamoDB_docClient, DynamoDBDocumentClient.from(__classPrivateFieldGet(this, _DynamoDB_ddb, "f")), "f");
    }
    async getAllVersions(opts) {
        let LastEvaluatedKey;
        let curr;
        do {
            const params = createAllVersionsQuery(opts);
            const next = await __classPrivateFieldGet(this, _DynamoDB_docClient, "f").send(new QueryCommand({
                ...params,
                ExclusiveStartKey: LastEvaluatedKey,
            }));
            curr = combineResults(curr, next);
            ({ LastEvaluatedKey } = next);
        } while (LastEvaluatedKey);
        return curr;
    }
    async getAllSecretsAndVersions({ limit, tableName = DEFAULT_TABLE } = {}) {
        let LastEvaluatedKey;
        let curr;
        do {
            const cmd = new ScanCommand({
                TableName: tableName,
                Limit: limit,
                ProjectionExpression: '#name, #version',
                ExclusiveStartKey: LastEvaluatedKey,
                ExpressionAttributeNames: {
                    '#name': 'name',
                    '#version': 'version',
                },
            });
            const next = await __classPrivateFieldGet(this, _DynamoDB_docClient, "f").send(cmd);
            curr = combineResults(curr, next);
            ({ LastEvaluatedKey } = next);
        } while (LastEvaluatedKey);
        return curr;
    }
    getLatestVersion(opts) {
        const params = createAllVersionsQuery({ ...opts, limit: 1 });
        return __classPrivateFieldGet(this, _DynamoDB_docClient, "f").send(new QueryCommand(params));
    }
    getByVersion({ name, version, tableName = DEFAULT_TABLE }) {
        const params = {
            TableName: tableName,
            Key: { name, version },
        };
        return __classPrivateFieldGet(this, _DynamoDB_docClient, "f").send(new GetCommand(params));
    }
    async createSecret(item, tableName = DEFAULT_TABLE) {
        const params = {
            Item: item,
            ConditionExpression: 'attribute_not_exists(#name)',
            TableName: tableName,
            ExpressionAttributeNames: {
                '#name': 'name',
            },
        };
        const result = await __classPrivateFieldGet(this, _DynamoDB_docClient, "f").send(new PutCommand(params));
        return result;
    }
    deleteSecret({ tableName = DEFAULT_TABLE, name, version }) {
        const params = {
            TableName: tableName,
            Key: { name, version },
        };
        return __classPrivateFieldGet(this, _DynamoDB_docClient, "f").send(new DeleteCommand(params));
    }
    async createTable({ tableName: TableName = DEFAULT_TABLE } = {}) {
        try {
            await __classPrivateFieldGet(this, _DynamoDB_ddb, "f").send(new DescribeTableCommand({ TableName }));
            debug('Credential Store table already exists');
        }
        catch (err) {
            if (!(err instanceof ResourceNotFoundException)) {
                throw err;
            }
            debug('Creating table...');
            await __classPrivateFieldGet(this, _DynamoDB_ddb, "f").send(createTableQuery(TableName));
            debug('Waiting for table to be created...');
            await pause(2e3);
            await waitUntilTableExists({
                client: __classPrivateFieldGet(this, _DynamoDB_ddb, "f"),
                maxWaitTime: 900,
            }, { TableName });
            debug('Table has been created');
            debug('Please go to the README to learn how to create your KMS key');
        }
    }
}
_DynamoDB_docClient = new WeakMap(), _DynamoDB_ddb = new WeakMap();
