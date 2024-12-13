export class HashingUtility {
  static async generateHash(data: object): Promise<string> {
    const keys = Object.keys(data);
    const uniqueString = keys  // use only the values
      .map((key) => JSON.stringify((data as any)[key]) || '')
      .join('|');

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(uniqueString);

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedData);

    return Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
}