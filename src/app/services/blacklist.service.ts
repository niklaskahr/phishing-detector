import { Injectable } from '@angular/core';
import { CacheService } from './shared/cache.service';
import { ListType } from '../shared/enums/list-type.enum';
import { LoaderService } from './shared/loader.service';

@Injectable({
  providedIn: 'root'
})
export class BlacklistService {
  private domainBlacklist: string[] = [];
  private tldBlacklist: string[] = [];

  constructor(
    private cacheService: CacheService,
    private loaderService: LoaderService
  ) { }

  async ensureCacheValid(): Promise<void> {
    this.domainBlacklist = await this.cacheService.getCachedList(ListType.Domain);
    this.tldBlacklist = await this.cacheService.getCachedList(ListType.TLD);
    this.loaderService.hide();
  }

  isCachedDomainBlacklisted(domain: string): boolean {
    return this.domainBlacklist.includes(domain.toLowerCase());
  }

  isCachedTLDBlacklisted(tld: string): boolean {
    return this.tldBlacklist.includes(tld.toLowerCase());
  }
}