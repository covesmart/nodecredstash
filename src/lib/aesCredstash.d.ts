import { KeyService } from "./keyService";
import { SecretRecord } from "../types";
/**
 * Encrypts `secret` using the key service.
 * You can decrypt with the companion method `open_aes_ctr_legacy`.
 * generate a 64 byte key.
 * Half will be for data encryption, the other half for HMAC
 * @param keyService
 * @param secret
 * @param digest
 */
export declare const sealAesCtrLegacy: (keyService: KeyService, secret: string, digest?: string) => Promise<{
    key: string;
    contents: string;
    hmac: string;
    digest: string;
}>;
/**
 * Decrypts secrets stored by `seal_aes_ctr_legacy`.
 * Assumes that the plaintext is unicode (non-binary).
 */
export declare const openAesCtrLegacy: (keyService: KeyService, record: SecretRecord) => Promise<string>;
