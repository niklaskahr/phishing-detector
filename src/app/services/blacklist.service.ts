import { Injectable } from '@angular/core';
import { InitializationService } from './initialization.service';

@Injectable({
  providedIn: 'root'
})
export class BlacklistService {

  constructor(private initService: InitializationService) { }

  async isBlacklistedDomain(domain: string): Promise<boolean> {
    const domainBlacklist = await this.initService.getCachedList('domain');
    return domainBlacklist.includes(domain.toLowerCase());
  }

  async isBlacklistedTLD(tld: string): Promise<boolean> {
    const tldBlacklist = await this.initService.getCachedList('tld');
    return tldBlacklist.includes(tld.toLowerCase());
  }

}
