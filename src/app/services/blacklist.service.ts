import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BlacklistService {
  private readonly CACHE_KEY_PREFIX = 'blacklist_';
  private readonly CACHE_TIMESTAMP_PREFIX = 'blacklist_timestamp_';
  private readonly CACHE_VALIDITY_HOURS = 24;

  constructor() { }

  async fetchList(sourceUrl: string, listName: string): Promise<string[]> {
    const now = Date.now();
    const cacheKey = this.CACHE_KEY_PREFIX + listName;
    const cacheTimestampKey = this.CACHE_TIMESTAMP_PREFIX + listName;
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTimestamp = localStorage.getItem(cacheTimestampKey);

    if (cachedData && cachedTimestamp) { // check cache validity
      const cacheAge = (now - parseInt(cachedTimestamp, 10)) / (1000 * 60 * 60);
      if (cacheAge < this.CACHE_VALIDITY_HOURS) {
        console.log(`Using cached data for ${listName}`);
        return JSON.parse(cachedData);
      }
    }

    // fetch new data
    console.log(`Fetching newdata for ${listName}...`);
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${listName}: ${response.statusText}`);
      }

      const data = await response.json();

      // cache the fetched data and timestamp
      localStorage.setItem(cacheKey, JSON.stringify(data.blacklist || []));
      localStorage.setItem(cacheTimestampKey, now.toString());

      return data.blacklist || [];
    } catch (error) {
      console.error(`Error fetching ${listName}:`, error);

      // use stale cached data as a fallback
      if (cachedData) {
        console.warn(`Using stale cached data for ${listName} due to fetch error`);
        return JSON.parse(cachedData);
      }

      throw error;
    }
  }

  async isBlacklisted(sourceUrl: string, listName: string, value: string): Promise<boolean> {
    const list = await this.fetchList(sourceUrl, listName);
    return list.includes(value.toLowerCase());
  }
}
