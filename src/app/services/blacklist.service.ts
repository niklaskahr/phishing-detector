import { Injectable } from '@angular/core';
import { InitializationService } from './initialization.service';
import { ListType } from '../shared/enums/list-type.enum';

@Injectable({
  providedIn: 'root'
})
export class BlacklistService {

  constructor(private initService: InitializationService) { }

  async isBlacklistedDomain(domain: string): Promise<boolean> {
    const domainBlacklist = await this.initService.getCachedList(ListType.Domain);
    return domainBlacklist.includes(domain.toLowerCase());
  }

  async isBlacklistedTLD(tld: string): Promise<boolean> {
    const tldBlacklist = await this.initService.getCachedList(ListType.TLD);
    return tldBlacklist.includes(tld.toLowerCase());
  }

}
