import { DeleteItemCommandOutput } from "@aws-sdk/client-dynamodb";
import { PutCommandOutput } from "@aws-sdk/lib-dynamodb";
import { Configuration, GetAllSecrets, GetAllVersions, GetHighestVersionResponse, GetSecret, NameAndVersionOpts, NameOpts, Opts, PutSecret, QueryOpts } from "./types";
export declare class CredStash {
    #private;
    readonly paddedInt: (i: number) => string;
    constructor({ kmsOpts, dynamoOpts }?: Configuration);
    /**
     * Retrieve the highest version of `name` in the table
     */
    getHighestVersion(opts: NameOpts): Promise<string>;
    getHighestVersion(opts: NameOpts, cb: (e: any | Error, version: string) => void): void;
    incrementVersion(opts: NameOpts): Promise<string>;
    incrementVersion(opts: NameOpts, cb: (e: any | Error, version: string) => void): void;
    putSecret(opts: PutSecret): Promise<PutCommandOutput>;
    putSecret(opts: PutSecret, cb: (e: any | Error) => PutCommandOutput): void;
    getAllVersions(opts: GetAllVersions): Promise<GetHighestVersionResponse[]>;
    getAllVersions(opts: GetAllVersions, cb: (e: any | Error, data: GetHighestVersionResponse[]) => void): void;
    getSecret(opts: GetSecret, cb: (e: any | Error, data: string) => void): void;
    getSecret(opts: GetSecret): Promise<string>;
    deleteSecrets(opts: NameOpts): Promise<DeleteItemCommandOutput[]>;
    deleteSecrets(opts: NameOpts, cb: (e: any | Error, data: DeleteItemCommandOutput[]) => void): void;
    deleteSecret(opts: NameAndVersionOpts): Promise<DeleteItemCommandOutput>;
    deleteSecret(opts: NameAndVersionOpts, cb: (e: any | Error, data: DeleteItemCommandOutput) => void): void;
    listSecrets(opts?: QueryOpts): Promise<{
        name: string;
        version: string;
    }[]>;
    listSecrets(opts: QueryOpts, cb: (e: any | Error, data: {
        name: string;
        version: string;
    }[]) => void): void;
    listSecrets(cb: (e: any | Error, data: {
        name: string;
        version: string;
    }[]) => void): void;
    getAllSecrets(opts?: GetAllSecrets): Promise<Record<string, string>>;
    getAllSecrets(opts: GetAllSecrets, cb: (e: any | Error, data: Record<string, string>) => void): void;
    getAllSecrets(cb: (e: any | Error, data: Record<string, string>) => void): void;
    createDdbTable(opts: Opts, cb: (e: any | Error, data: void) => void): void;
    createDdbTable(cb: (e: any | Error, data: void) => void): void;
    createDdbTable(opts?: Opts): Promise<void>;
}
