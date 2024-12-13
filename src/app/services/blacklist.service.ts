import { Injectable } from '@angular/core';
import { CacheService } from './shared/cache.service';
import { ListType } from '../shared/enums/list-type.enum';

@Injectable({
  providedIn: 'root'
})
export class BlacklistService {
  private domainBlacklist: string[] = [];
  private tldBlacklist: string[] = [];

  constructor(private cacheService: CacheService) {}

  async ensureCacheValid(): Promise<void> {
    this.domainBlacklist = await this.cacheService.getCachedList(ListType.Domain);
    this.tldBlacklist = await this.cacheService.getCachedList(ListType.TLD);
  }

  isCachedDomainBlacklisted(domain: string): boolean {
    return this.domainBlacklist.includes(domain.toLowerCase());
  }

  isCachedTLDBlacklisted(tld: string): boolean {
    return this.tldBlacklist.includes(tld.toLowerCase());
  }
}