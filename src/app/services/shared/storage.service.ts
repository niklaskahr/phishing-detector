import { Injectable } from '@angular/core';
import { ExtractedData } from '../../shared/interfaces/extracted-data.interface';
import { RiskAssessment } from '../../shared/interfaces/risk-assessment.interface';
import { HashingUtility } from '../../shared/utils/hashing-utility.utility';
import { EmailData } from '../../shared/interfaces/email-data.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private dataHashes: Set<string> = new Set(); // Store unique hashes
  private dataStore: Map<string, EmailData> = new Map(); // Store the actual data

  // Store combined email and assessment data
  storeCombinedData(data: EmailData): void {
    const hash = HashingUtility.generateHash(data); // Generate hash for combined object

    if (!this.dataHashes.has(hash)) {
      this.dataHashes.add(hash); // Add hash to the set
      this.dataStore.set(hash, data); // Store data with hash as the key
      console.log('Stored combined data:', data);
    } else {
      console.warn('Duplicate combined data detected. Skipping storage.', data);
    }
  }

  getCombinedData(): EmailData[] {
    return Array.from(this.dataStore.values());
  }

  // Retrieve a specific combined data item by hash
  getCombinedDataByHash(hash: string): EmailData | undefined {
    return this.dataStore.get(hash);
  }
}