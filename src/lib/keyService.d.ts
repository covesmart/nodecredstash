import { KMSClient } from '@aws-sdk/client-kms';
export declare class KeyService {
    #private;
    constructor(kms: KMSClient, keyId?: string, encryptionContext?: Record<string, string>);
    generateDataKey(NumberOfBytes: 16 | 24 | 32 | 64): Promise<{
        key: Uint8Array;
        encodedKey: Uint8Array;
    }>;
    decrypt(ciphertext: string): Promise<Uint8Array>;
}
