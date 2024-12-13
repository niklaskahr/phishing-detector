import { Injectable } from '@angular/core';
import { HashingUtility } from '../../shared/utils/hashing-utility.utility';
import { EmailData } from '../../shared/interfaces/email-data.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private dataHashes: Set<string> = new Set();
  private dataStore: Map<string, EmailData> = new Map();

  async storeData(data: EmailData): Promise<void> {
    const hash = await HashingUtility.generateHash(data);

    if (!this.dataHashes.has(hash)) {
      this.dataHashes.add(hash);
      this.dataStore.set(hash, data);
      console.log('Stored combined data:', data);
    } else {
      console.warn('Duplicate combined data detected. Skipping storage.', data);
    }
  }

  getData(): EmailData[] {
    return Array.from(this.dataStore.values());
  }

  getDataByHash(hash: string): EmailData | undefined {
    return this.dataStore.get(hash);
  }
}