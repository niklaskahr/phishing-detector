import { ExtractedData } from '../shared/interfaces/extracted-data.interface';
import { RiskAssessment, RiskLevel } from '../shared/interfaces/risk-assessment.interface';
import { BlacklistService } from './blacklist.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RiskAssessmentService { // TODO Class/Service

  constructor(private blacklistService: BlacklistService,) { }

  // TODO: check for attachment (e.g., name, size), keywords in subject/body, email file size
  assessRisk(data: ExtractedData): RiskAssessment {
    let score = 0;
    let level: RiskLevel = RiskLevel.Low;

    // Increase risk score based on suspicious domains or sender
    if (data.sender.endsWith('.xyz') || data.sender.endsWith('.ru')) {
      score += 50;
    }

    if (data.domains.some((domain) => domain.endsWith('.phishingsite.com'))) {
      score += 100;
    }

    // Check items against blacklist
    const blacklistResults = this.checkAgainstBlacklist(data);
    console.log('Blacklist Results:', blacklistResults);

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

