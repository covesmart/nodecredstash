import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { NameAndVersionOpts, NameOpts, Opts, QueryOpts, SecretRecord } from '../types';
export declare class DynamoDB {
    #private;
    constructor(ddb: DynamoDBClient);
    getAllVersions(opts: QueryOpts & NameOpts): Promise<{
        Items: SecretRecord[];
    }>;
    getAllSecretsAndVersions({ limit, tableName }?: QueryOpts): Promise<{
        Items: SecretRecord[];
    }>;
    getLatestVersion(opts: NameOpts): Promise<{
        Items: SecretRecord[];
    }>;
    getByVersion({ name, version, tableName }: NameAndVersionOpts): Promise<{
        Item: SecretRecord;
    }>;
    createSecret(item: SecretRecord, tableName?: string): Promise<import("@aws-sdk/lib-dynamodb").PutCommandOutput>;
    deleteSecret({ tableName, name, version }: NameAndVersionOpts): Promise<import("@aws-sdk/lib-dynamodb").DeleteCommandOutput>;
    createTable({ tableName: TableName }?: Opts): Promise<void>;
}
