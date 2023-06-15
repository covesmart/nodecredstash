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
var _KeyService_kms, _KeyService_keyId, _KeyService_encryptionContext;
import { GenerateDataKeyCommand, DecryptCommand, InvalidCiphertextException, NotFoundException, } from '@aws-sdk/client-kms';
import { DEFAULT_KMS_KEY } from '../defaults';
export class KeyService {
    constructor(kms, keyId = DEFAULT_KMS_KEY, encryptionContext = undefined) {
        _KeyService_kms.set(this, void 0);
        _KeyService_keyId.set(this, void 0);
        _KeyService_encryptionContext.set(this, void 0);
        __classPrivateFieldSet(this, _KeyService_kms, kms, "f");
        __classPrivateFieldSet(this, _KeyService_keyId, keyId, "f");
        __classPrivateFieldSet(this, _KeyService_encryptionContext, encryptionContext, "f");
    }
    async generateDataKey(NumberOfBytes) {
        try {
            const result = await __classPrivateFieldGet(this, _KeyService_kms, "f").send(new GenerateDataKeyCommand({
                KeyId: __classPrivateFieldGet(this, _KeyService_keyId, "f"),
                EncryptionContext: __classPrivateFieldGet(this, _KeyService_encryptionContext, "f"),
                NumberOfBytes,
            }));
            return {
                key: result.Plaintext,
                encodedKey: result.CiphertextBlob,
            };
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new Error(`Could not generate key using KMS key ${__classPrivateFieldGet(this, _KeyService_keyId, "f")} (Details: ${JSON.stringify(error, null, 2)})`);
        }
    }
    async decrypt(ciphertext) {
        try {
            const response = await __classPrivateFieldGet(this, _KeyService_kms, "f").send(new DecryptCommand({
                CiphertextBlob: Buffer.from(ciphertext, 'base64'),
                EncryptionContext: __classPrivateFieldGet(this, _KeyService_encryptionContext, "f"),
            }));
            return response.Plaintext;
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            let msg = `Decryption error: ${JSON.stringify(error, null, 2)}`;
            if (error instanceof InvalidCiphertextException) {
                if (__classPrivateFieldGet(this, _KeyService_encryptionContext, "f")) {
                    msg = 'Could not decrypt hmac key with KMS. The encryption '
                        + 'context provided may not match the one used when the '
                        + 'credential was stored.';
                }
                else {
                    msg = 'Could not decrypt hmac key with KMS. The credential may '
                        + 'require that an encryption context be provided to decrypt '
                        + 'it.';
                }
            }
            throw new Error(msg);
        }
    }
}
_KeyService_kms = new WeakMap(), _KeyService_keyId = new WeakMap(), _KeyService_encryptionContext = new WeakMap();
