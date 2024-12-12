import { Injectable } from '@angular/core';

export enum ListType {
  domain = 'domain',
  TLD = 'tld',
}

export enum ApiUrl {
  DomainBlacklist = 'https://raw.githubusercontent.com/phishfort/phishfort-lists/refs/heads/master/blacklists/domains.json',
  TLDBlacklist = 'https://raw.githubusercontent.com/stamparm/maltrail/refs/heads/master/trails/static/suspicious/domain.txt',
}

@Injectable({
  providedIn: 'root'
})
export class InitializationService {
  private readonly CACHE_KEY_PREFIX = 'blacklist_';
  private readonly CACHE_TIMESTAMP_PREFIX = 'blacklist_timestamp_';
  private readonly CACHE_VALIDITY_HOURS = 1;

  async fetchAndCacheAll(): Promise<void> {
    console.log('Fetching initial data for all lists...');
    await Promise.all([
      this.fetchAndCache(ApiUrl.DomainBlacklist, ListType.domain),
      this.fetchAndCache(ApiUrl.TLDBlacklist, ListType.TLD),
    ]);
  }

  async getCachedList(listName: ListType): Promise<string[]> {
    const cacheKey = this.getCacheKey(listName);
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    } else {
      console.warn(`Cache for ${listName} not found. Fetching fresh data.`);
      await this.fetchAndCacheByType(listName);
      return JSON.parse(localStorage.getItem(cacheKey) || '[]');
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
    const cacheTimestampKey = this.getCacheTimestampKey(listName);
    const cachedTimestamp = localStorage.getItem(cacheTimestampKey);

    if (!cachedTimestamp) {
      return false;
    }

    const cacheAge = (Date.now() - parseInt(cachedTimestamp, 10)) / (1000 * 60 * 60);
    return cacheAge < this.CACHE_VALIDITY_HOURS;
  }

  private async fetchAndCacheByType(listName: ListType): Promise<void> {
    switch (listName) {
      case ListType.domain:
        await this.fetchAndCache(ApiUrl.DomainBlacklist, ListType.domain);
        break;
      case ListType.TLD:
        await this.fetchAndCache(ApiUrl.TLDBlacklist, ListType.TLD);
        break;
    }
  }

  private getCacheKey(listName: ListType): string {
    return `${this.CACHE_KEY_PREFIX}${listName}`;
  }

  private getCacheTimestampKey(listName: ListType): string {
    return `${this.CACHE_TIMESTAMP_PREFIX}${listName}`;
  }

}
