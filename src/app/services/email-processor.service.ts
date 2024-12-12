import { Injectable } from '@angular/core';
import { BlacklistService } from './blacklist.service';

@Injectable({
  providedIn: 'root'
})
export class EmailProcessorService {
  // TODO: process JS snippets, keywords (PIN, password, etc.), attachments (phishing-report-phishsite.com.pdf)
  constructor(private blacklistService: BlacklistService) { }

  // TODO: give user option to process multiple files at once and/or only process certain aspects
  async processEmailFile(file: File): Promise<void> {
    const reader = new FileReader();

    reader.onload = async (event) => {
      const fileContent = event.target?.result as string;

      if (!fileContent) {
        console.error('File is empty or could not be read.');
        return;
      }

      // extract subject (scan separately from email body?)
      const subjectMatch = fileContent.match(/Subject: (.+)/);
      if (subjectMatch) {
        console.log('SUBJECT:', subjectMatch[1]);
      }

      // extract and prepare items to check
      const senderMatch = fileContent.match(/From:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/);
      const replyToMatch = fileContent.match(/Reply-To:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/);
      const returnPathMatch = fileContent.match(/Return-Path:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/);
      const domainMatches = this.extractDomains(fileContent);

      const itemsToCheck = Array.from(
        new Set([
          senderMatch?.[1],
          replyToMatch?.[1],
          returnPathMatch?.[1],
          ...domainMatches,
        ])
      )
        .filter((item): item is string => Boolean(item))
        .map(item => item.trim().toLowerCase());

      const blacklistResults = await Promise.all(
        itemsToCheck.map(async (item) => {
          try {
            const isBlacklistedDomain = await this.blacklistService.isBlacklistedDomain(item);
            const tld = item.split('.').pop();
            const isBlacklistedTLD = tld ? await this.blacklistService.isBlacklistedTLD(tld) : false;

            return { item, isBlacklistedDomain, isBlacklistedTLD };
          } catch (error) {
            console.error(`Error checking item "${item}":`, error);
            return { item, isBlacklistedDomain: false, isBlacklistedTLD: false };
          }
        })
      );

      blacklistResults.forEach(({ item, isBlacklistedDomain, isBlacklistedTLD }) => {
        if (isBlacklistedDomain && isBlacklistedTLD) {
          // "EmailAssessmentService"
          console.log(`"${item}" is blacklisted in both domain and TLD lists.`);
        } else if (isBlacklistedDomain) {
          console.log(`"${item}" is blacklisted in the domain list.`);
        } else if (isBlacklistedTLD) {
          console.log(`"${item}" has a blacklisted TLD.`);
        } else {
          console.log(`"${item}" is not blacklisted.`);
        }
      });

      console.log(fileContent);
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };

    reader.readAsText(file);
  }

  private extractDomains(fileContent: string): string[] {
    const cleanedUrlMatches = fileContent
      .match(/https?:\/\/[^\s"<>]+/g)
      ?.map(url =>
        url.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))) // decode hexadecimal entities
      ) || [];

    return [
      ...new Set(
        cleanedUrlMatches
          .map(url => {
            try {
              const hostname = new URL(url).hostname;
              return hostname.match(/^[a-z0-9.-]+$/i) ? hostname : null;
            } catch {
              return null;
            }
          })
          .filter((hostname): hostname is string => Boolean(hostname)) // type guard for non-null strings
      ),
    ];
  }
}