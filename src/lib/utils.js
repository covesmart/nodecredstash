import { PAD_LEN } from '../defaults';
export const paddedInt = (i) => `${i}`.padStart(PAD_LEN, '0');
export const pause = (timeout) => new Promise((resolve) => {
    setTimeout(resolve, timeout, undefined);
});
export const sanitizeVersion = (version, defaultVersion) => {
    let sanitized = version;
    if (defaultVersion && !sanitized) {
        sanitized = sanitized || 1;
    }
    if (typeof sanitized == 'number') {
        sanitized = paddedInt(sanitized);
    }
    sanitized = (sanitized === undefined) ? sanitized : `${sanitized}`;
    return sanitized;
};
export const sortSecrets = (a, b) => {
    const nameDiff = a.name.localeCompare(b.name);
    return nameDiff || b.version.localeCompare(a.version);
};
