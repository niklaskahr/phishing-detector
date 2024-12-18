import { Injectable } from '@angular/core';
import { ApiUrl } from '../../shared/enums/api-url.enum';
import { ListType } from '../../shared/enums/list-type.enum';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly CACHE_KEY_PREFIX = 'blacklist_';
  private readonly CACHE_TIMESTAMP_PREFIX = 'blacklist_timestamp_';
  private readonly CACHE_VALIDITY_HOURS = 1;

  constructor(private loaderService: LoaderService) { }

  async fetchAndCacheAll(): Promise<void> {
    await Promise.all([
      this.checkAndFetch(ApiUrl.DomainBlacklist, ListType.Domain),
      this.checkAndFetch(ApiUrl.TLDBlacklist, ListType.TLD),
    ]);
    this.loaderService.hide();
  }

  async getCachedList(listName: ListType): Promise<string[]> {
    const cacheKey = this.getCacheKey(listName);

    if (this.isCacheValid(listName)) {
      return JSON.parse(localStorage.getItem(cacheKey) || '[]');
    }

    this.loaderService.show();

    await this.fetchAndCacheByType(listName);
    return JSON.parse(localStorage.getItem(cacheKey) || '[]');
  }

  private async checkAndFetch(sourceUrl: string, listName: ListType): Promise<void> {
    if (!this.isCacheValid(listName)) {
      this.loaderService.show();
      await this.fetchAndCache(sourceUrl, listName);
    }
  }

  private async fetchAndCacheByType(listName: ListType): Promise<void> {
    switch (listName) {
      case ListType.Domain:
        await this.fetchAndCache(ApiUrl.DomainBlacklist, ListType.Domain);
        break;
      case ListType.TLD:
        await this.fetchAndCache(ApiUrl.TLDBlacklist, ListType.TLD);
        break;
    }
  }

  private async fetchAndCache(sourceUrl: string, listName: ListType): Promise<void> {
    const now = Date.now();
    const cacheKey = this.getCacheKey(listName);
    const cacheTimestampKey = this.getCacheTimestampKey(listName);

    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${listName}: ${response.statusText}`);
      }

      const data = await response.text();
      const parsedData = this.parseFetchedData(data);

      localStorage.setItem(cacheKey, JSON.stringify(parsedData));
      localStorage.setItem(cacheTimestampKey, now.toString());
    } catch (error) {
      console.error(`Error fetching ${listName}:`, error);
    }
  }

  private parseFetchedData(data: string): string[] {
    return data
      .split('\n')
      .map(line => line.trim().toLowerCase())
      .filter(line => line && !line.startsWith('#'));
  }

  private isCacheValid(listName: ListType): boolean {
    const cacheKey = this.getCacheKey(listName);
    const cacheTimestampKey = this.getCacheTimestampKey(listName);

    const cachedData = localStorage.getItem(cacheKey);
    const cachedTimestamp = localStorage.getItem(cacheTimestampKey);

    if (!cachedData || !cachedTimestamp) {
      return false;
    }

    const cacheAge = (Date.now() - parseInt(cachedTimestamp, 10)) / (1000 * 60 * 60);
    return cacheAge < this.CACHE_VALIDITY_HOURS;
  }

  private getCacheKey(listName: ListType): string {
    return `${this.CACHE_KEY_PREFIX}${listName}`;
  }

  private getCacheTimestampKey(listName: ListType): string {
    return `${this.CACHE_TIMESTAMP_PREFIX}${listName}`;
  }
}