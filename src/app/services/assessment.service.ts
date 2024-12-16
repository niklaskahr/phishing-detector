import { UNSAFE_FILE_EXTENSIONS } from '../shared/constants/unsafe-file-extensions.constant';
import { ExtractedData } from '../shared/interfaces/extracted-data.interface';
import { Assessment } from '../shared/interfaces/assessment.interface';
import { BlacklistService } from './blacklist.service';
import { Injectable } from '@angular/core';
import { RiskLevel } from '../shared/enums/risk-level.enum';
import { BlacklistResults } from '../shared/interfaces/blacklist-details.interface';
import { FILE_SIZE } from '../shared/constants/file-size.constant';
import { TRUST_PENALTIES } from '../shared/constants/trust-penalties.constant';
import { TRUST_THRESHOLDS } from '../shared/constants/trust-thresholds.constant';

@Injectable({
  providedIn: 'root',
})
export class AssessmentService {
  constructor(private blacklistService: BlacklistService,) { }

  async assessTrustworthiness(data: ExtractedData): Promise<Assessment> {
    await this.blacklistService.ensureCacheValid(); // validate and populate the cache

    let trustworthiness = 100; // starts at 100% trustworthy

    const { blacklistResults, trustPenalty: blacklistTrustPenalty } = this.checkAgainstBlacklist(data);
    trustworthiness -= this.calculateTrustPenalties(data, blacklistTrustPenalty);

    trustworthiness = Math.max(trustworthiness, 0); // prevent it from dropping below 0

    const riskLevel = this.determineTrustLevel(trustworthiness);

    return {
      trustworthiness,
      riskLevel,
      blacklistResults,
    };
  }

  private calculateTrustPenalties(
    data: ExtractedData,
    blacklistTrustPenalty: number
  ): number {
    const jsPenalty = this.calculateJavaScriptTrustPenalty(data.detectedJavaScript); // data.detectedJavaScript.length * TRUST_PENALTIES.JAVASCRIPT;
    const phishingPenalty = this.calculatePhishingTrustPenalty(data.detectedPhishingKeywords); // data.detectedPhishingKeywords.length * TRUST_PENALTIES.PHISHING_KEYWORDS;
    const fileSizePenalty = this.calculateFileSizeTrustPenalty(data.fileSize);
    const attachmentPenalty = this.calculateAttachmentTrustPenalty(data.attachments);

    return (
      jsPenalty + phishingPenalty + fileSizePenalty + attachmentPenalty + blacklistTrustPenalty
    );
  }

  private calculateJavaScriptTrustPenalty(detectedJavaScript: string[]): number {
    return this.calculateDynamicTrustPenalty(
      detectedJavaScript.length,
      TRUST_PENALTIES.JAVASCRIPT,
      TRUST_PENALTIES.JAVASCRIPT_THRESHOLDS
    );
  }

  private calculatePhishingTrustPenalty(detectedPhishingKeywords: string[]): number {
    return this.calculateDynamicTrustPenalty(
      detectedPhishingKeywords.length,
      TRUST_PENALTIES.PHISHING_KEYWORDS,
      TRUST_PENALTIES.PHISHING_KEYWORDS_THRESHOLDS
    );
  }
  
  private calculateDynamicTrustPenalty(
    count: number,
    basePenalty: number,
    thresholds: { low: number; medium: number; }
  ): number {
    if (count === 0) return 0;
    if (count <= thresholds.low) return count * basePenalty;
    if (count <= thresholds.medium) return count * (basePenalty * 1.5);
  
    return count * (basePenalty * 2);
  }

  private calculateFileSizeTrustPenalty(fileSize: number): number {
    if (fileSize > FILE_SIZE.LARGE) return TRUST_PENALTIES.LARGE_FILE;
    if (fileSize < FILE_SIZE.SMALL) return TRUST_PENALTIES.SMALL_FILE;
    return 0; // normal size
  }

  private calculateAttachmentTrustPenalty(attachments: { name: string; type: string }[] | null): number {
    if (!attachments || attachments.length === 0) return 0;
    return attachments.filter(att => UNSAFE_FILE_EXTENSIONS.includes(att.type)).length * TRUST_PENALTIES.UNSAFE_ATTACHMENT;
  }

  private determineTrustLevel(trustworthiness: number): RiskLevel {
    if (trustworthiness < TRUST_THRESHOLDS.MEDIUM) return RiskLevel.High;
    if (trustworthiness < TRUST_THRESHOLDS.LOW) return RiskLevel.Medium;
    return RiskLevel.Low;
  }

  private checkAgainstBlacklist(data: ExtractedData): { blacklistResults: BlacklistResults, trustPenalty: number } {
    const blacklistResults: BlacklistResults = { blacklistedDomains: [], blacklistedTLDs: [] };

    const itemsToCheck = [
      data.sender,
      data.replyTo,
      data.returnPath,
      ...data.domains,
    ]
      .filter((item): item is string => Boolean(item))
      .map(item => item.toLowerCase());

    let trustPenalty = 0;

    for (const item of itemsToCheck) {
      const isBlacklistedDomain = this.blacklistService.isCachedDomainBlacklisted(item);
      const tld = item.split('.').pop();
      const isBlacklistedTLD = tld ? this.blacklistService.isCachedTLDBlacklisted(tld) : false;

      if (isBlacklistedDomain) {
        blacklistResults.blacklistedDomains?.push(item);
        trustPenalty += TRUST_PENALTIES.BLACKLISTED_DOMAIN
      }

      if (isBlacklistedTLD) {
        blacklistResults.blacklistedTLDs?.push(tld!);
        trustPenalty += TRUST_PENALTIES.BLACKLISTED_TLD
      }
    }
    return { blacklistResults, trustPenalty };
  }
}

