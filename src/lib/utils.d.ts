export declare const paddedInt: (i: number) => string;
export declare const pause: (timeout: number) => Promise<unknown>;
export declare const sanitizeVersion: (version?: number | string, defaultVersion?: 0 | 1 | boolean) => string;
export interface SortableSecret {
    name: string;
    version: string;
}
export declare const sortSecrets: (a: SortableSecret, b: SortableSecret) => number;
