import { createCipheriv, createDecipheriv, createHmac } from "crypto";
import { DEFAULT_DIGEST } from "../defaults";
const LEGACY_NONCE = Buffer.from([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
]);
const getHmacKey = (key, ciphertext, digestMethod) => createHmac(digestMethod, key).update(ciphertext).digest().toString("hex");
const halveKey = (key) => {
    const half = Math.floor(key.length / 2);
    return {
        dataKey: key.slice(0, half),
        hmacKey: key.slice(half),
    };
};
const sealAesCtr = (plaintext, key, nonce, digest) => {
    const { dataKey, hmacKey } = halveKey(key);
    const bits = dataKey.length * 8;
    const encryptor = createCipheriv(`aes-${bits}-ctr`, dataKey, nonce);
    const ciphertext = Buffer.concat([
        encryptor.update(plaintext),
        encryptor.final(),
    ]);
    return {
        ciphertext,
        hmac: getHmacKey(hmacKey, ciphertext, digest),
    };
};
const openAesCtr = (key, nonce, ciphertext, expectedHmac, digestMethod, name) => {
    const { dataKey, hmacKey } = halveKey(key);
    const bits = dataKey.length * 8;
    const hmac = getHmacKey(hmacKey, ciphertext, digestMethod);
    if (hmac !== expectedHmac) {
        throw new Error(`Computed HMAC on ${name} does not match stored HMAC`);
    }
    const decryptor = createDecipheriv(`aes-${bits}-ctr`, dataKey, nonce);
    const buffer = Buffer.concat([
        decryptor.update(ciphertext),
        decryptor.final(),
    ]);
    return buffer.toString("utf-8");
};
/**
 * Encrypts `secret` using the key service.
 * You can decrypt with the companion method `open_aes_ctr_legacy`.
 * generate a 64 byte key.
 * Half will be for data encryption, the other half for HMAC
 * @param keyService
 * @param secret
 * @param digest
 */
export const sealAesCtrLegacy = async (keyService, secret, digest = DEFAULT_DIGEST) => {
    const { key, encodedKey } = await keyService.generateDataKey(64);
    const { ciphertext, hmac } = sealAesCtr(secret, key, LEGACY_NONCE, digest);
    return {
        key: Buffer.from(encodedKey).toString("base64"),
        contents: ciphertext.toString("base64"),
        hmac,
        digest,
    };
};
/**
 * Decrypts secrets stored by `seal_aes_ctr_legacy`.
 * Assumes that the plaintext is unicode (non-binary).
 */
export const openAesCtrLegacy = async (keyService, record) => {
    var _a;
    const key = await keyService.decrypt(record.key);
    const digestMethod = record.digest || DEFAULT_DIGEST;
    const ciphertext = Buffer.from(record.contents, "base64");
    const hmac = (_a = record.hmac.value) !== null && _a !== void 0 ? _a : record.hmac;
    const expectedHmac = hmac instanceof Uint8Array
        ? Buffer.from(hmac).toString("ascii")
        : hmac;
    return openAesCtr(key, LEGACY_NONCE, ciphertext, expectedHmac, digestMethod, record.name);
};
