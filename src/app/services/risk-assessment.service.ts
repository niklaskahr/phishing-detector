import { ExtractedData } from '../shared/interfaces/extracted-data.interface';
import { RiskAssessment, RiskLevel } from '../shared/interfaces/risk-assessment.interface';
import { BlacklistService } from './blacklist.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RiskAssessmentService {
  constructor(private blacklistService: BlacklistService,) { }

  assessRisk(data: ExtractedData): RiskAssessment {
    let score = 0;
    let level: RiskLevel = RiskLevel.Low;

    // increase risk score based on suspicious domains or sender
    if (data.sender.endsWith('.xyz') || data.sender.endsWith('.ru')) {
      score += 50;
    }

    if (data.domains.some((domain) => domain.endsWith('.phishingsite.com'))) {
      score += 100;
    }

    // check items against blacklist
    const blacklistResults = this.checkAgainstBlacklist(data);

    // fileSize: emails < 5 KB or > 50 KB are worth a closer look

    return {
      riskScore: score,
      riskLevel: level,
      isBlacklisted: false,
      findings: [],
    };
  }

  private checkAgainstBlacklist(data: ExtractedData) {
    const itemsToCheck = [
      data.sender,
      data.replyTo,
      data.returnPath,
      ...data.domains,
    ]
      .filter((item): item is string => Boolean(item))
      .map((item) => item.toLowerCase());

    return itemsToCheck.map((item) => {
      const isBlacklistedDomain = this.blacklistService.isCachedDomainBlacklisted(item);
      const tld = item.split('.').pop();
      const isBlacklistedTLD = tld ? this.blacklistService.isCachedTLDBlacklisted(tld) : false;

      return { item, isBlacklistedDomain, isBlacklistedTLD };
    });
  }
}

