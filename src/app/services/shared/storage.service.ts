import { Injectable } from '@angular/core';
import { HashingUtility } from '../../shared/utils/hashing-utility.utility';
import { EmailData } from '../../shared/interfaces/email-data.interface';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private emailHashes: Set<string> = new Set();
  private dataStore: Map<string, EmailData> = new Map(); // also store raw email body in EmailData?

  constructor(private loaderService: LoaderService) { }

  async storeData(data: EmailData): Promise<void> {
    const hash = await HashingUtility.generateHash(data.email);

    if (!this.emailHashes.has(hash)) {
      this.emailHashes.add(hash);
      this.dataStore.set(hash, data);
    } else {
      ///console.warn('Duplicate data detected. Skipping storage.', data);
    }
    this.loaderService.hide();
  }

  getData(): EmailData[] {
    return Array.from(this.dataStore.values());
  }

  getDataByHash(hash: string): EmailData | undefined {
    return this.dataStore.get(hash);
  }
}