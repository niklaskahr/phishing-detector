import { Injectable } from '@angular/core';
import { HashingUtil } from '../../shared/utils/hashing.util';
import { EmailData } from '../../shared/interfaces/email-data.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private emailHashes: Set<string> = new Set();
  private dataStore: Map<string, EmailData> = new Map(); // also store raw email body in EmailData?

  async storeData(data: EmailData): Promise<void> {
    const hash = await HashingUtil.generateHash(data.email);

    if (!this.emailHashes.has(hash)) {
      this.emailHashes.add(hash);
      this.dataStore.set(hash, data);
    } else {
      console.warn('Duplicate data detected. Skipping storage.', data);
    }
  }

  getData(): EmailData[] {
    return Array.from(this.dataStore.values());
  }

  getDataByHash(hash: string): EmailData | undefined {
    return this.dataStore.get(hash);
  }
}