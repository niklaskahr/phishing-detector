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

  async storeData(data: EmailData): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) return false;

    const hash = await HashingUtil.generateHash(data.email);

    if (!this.emailHashes.has(hash)) {
      this.emailHashes.add(hash);
      this.dataStore.set(hash, data);
      this.saveToLocalStorage();
      this.eventService.notifyAnalysisStored(data);
      return true;
    } else {
      const existingData = this.dataStore.get(hash);
      if (existingData) {
        this.eventService.notifyAnalysisStored(existingData);
      }
      return false;
    }
  }

  getData(): EmailData[] {
    return Array.from(this.dataStore.values());
  }

  private saveToLocalStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const serializedData = JSON.stringify(Array.from(this.dataStore.entries()));
    localStorage.setItem(this.LOCAL_STORAGE_KEY, serializedData);
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

  async removeData(email: EmailData): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const hash = await HashingUtil.generateHash(email.email);
    if (this.emailHashes.has(hash)) {
      this.emailHashes.delete(hash);
      this.dataStore.delete(hash);
      this.saveToLocalStorage();
    }
  }
}