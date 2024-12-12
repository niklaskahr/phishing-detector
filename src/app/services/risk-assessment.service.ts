import { Injectable } from '@angular/core';
import { ExtractedEmailData } from '../shared/enums/interfaces/extracted-email-data.interface';
import { RiskAssessment } from '../shared/enums/interfaces/risk-assessment.interface';

@Injectable({
  providedIn: 'root'
})
export class RiskAssessmentService {
  blacklistService: any;
  assessRisk(data: ExtractedEmailData): RiskAssessment {
    let score = 0;

    // Increase risk score based on suspicious domains or sender
    if (data.sender.endsWith('.xyz') || data.sender.endsWith('.ru')) {
      score += 50;
    }

    if (data.domains.some((domain) => domain.endsWith('.phishingsite.com'))) {
      score += 100;
    }

    return {
      score,
      isHighRisk: score > 75,
      warnings: score > 0 ? ['Suspicious sender or domain detected'] : [],
    };
  }

  // // Check items against blacklist
    // const blacklistResults = this.checkAgainstBlacklist(extractedData);
    // console.log('Blacklist Results:', blacklistResults);
 
  
  // blacklistResults.forEach(({ item, isBlacklistedDomain, isBlacklistedTLD }) => {
//     if (isBlacklistedDomain && isBlacklistedTLD) {
//       // "EmailAssessmentService"
//       console.log(`"${item}" is blacklisted in both domain and TLD lists.`);
//     } else if (isBlacklistedDomain) {
//       console.log(`"${item}" is blacklisted in the domain list.`);
//     } else if (isBlacklistedTLD) {
//       console.log(`"${item}" has a blacklisted TLD.`);
//     } else {
//       console.log(`"${item}" is not blacklisted.`);
//     }
//   });

//   console.log(fileContent);
// };

  private checkAgainstBlacklist(data: ExtractedEmailData) {
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

