import * as crypto from 'crypto';

export class HashingUtility {
    static generateHash<T extends object>(data: T): string {
        // Extract all keys from the object
        const keys = Object.keys(data) as (keyof T)[];

        // Construct a unique string using only the values
        const uniqueString = keys
            .map((key) => JSON.stringify(data[key]) || '') // Use only the values
            .join('|'); // Combine values with a separator

        // Generate and return the hash
        return crypto.createHash('sha256').update(uniqueString).digest('hex');
    }
}