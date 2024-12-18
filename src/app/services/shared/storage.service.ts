import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HashingUtil } from '../../shared/utils/hashing.util';
import { EmailData } from '../../shared/interfaces/email-data.interface';
import { isPlatformBrowser } from '@angular/common';
import { EventService } from './event.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly LOCAL_STORAGE_KEY = 'emailAnalyses';
  private emailHashes: Set<string> = new Set();
  private dataStore: Map<string, EmailData> = new Map();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private eventService: EventService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromLocalStorage();
    }
  }

  async storeData(data: EmailData): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const hash = await HashingUtil.generateHash(data.email); // generate a hash to detect duplicates

    if (!this.emailHashes.has(hash)) {
      this.emailHashes.add(hash);
      this.dataStore.set(hash, data);
      this.saveToLocalStorage();
      this.eventService.notifyAnalysisStored(data);
    } else {
      console.warn('Duplicate email detected. Skipping storage.'); // display analysis of that already existing email
    }
  }

  getData(): EmailData[] {
    return Array.from(this.dataStore.values());
  }

  // getDataByHash(hash: string): EmailData | undefined {
  //   return this.dataStore.get(hash);
  // }

  private saveToLocalStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const serializedData = JSON.stringify(Array.from(this.dataStore.entries()));
    // localStorage.setItem(this.LOCAL_STORAGE_KEY, serializedData);
  }

  private loadFromLocalStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const savedData = localStorage.getItem(this.LOCAL_STORAGE_KEY);
    if (savedData) {
      const parsedEntries: [string, EmailData][] = JSON.parse(savedData);
      this.dataStore = new Map(parsedEntries);
      this.emailHashes = new Set(parsedEntries.map(([hash]) => hash));
    }
  }
}