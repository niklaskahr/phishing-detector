import { Injectable } from '@angular/core';
import { BlacklistService } from './blacklist.service';
import { ExtractedData } from '../shared/interfaces/extracted-data.interface';
import { PHISHING_KEYWORDS } from '../shared/constants/phishing-keywords.constant';

@Injectable({
  providedIn: 'root'
})
export class EmailProcessorService {
  fileSize: number = 0;

  constructor(private blacklistService: BlacklistService,) { }

  async processFile(file: File): Promise<ExtractedData> {
    await this.blacklistService.ensureCacheValid(); // validate and populate the cache
    const fileContent = await this.readFileAsText(file);
    return this.extractEmailData(fileContent);
  }

  private async readFileAsText(file: File): Promise<string> {
    this.fileSize = file.size;

    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = (event) => {
        const fileContent = event.target?.result as string;
        if (!fileContent) {
          reject(new Error('File is empty or could not be read.'));
        } else {
          resolve(fileContent);
        }
      };

      reader.onerror = (error) => {
        reject(new Error(`Error reading file: ${error}`));
      };

      reader.readAsText(file);
    });
  }

  private extractEmailData(fileContent: string): ExtractedData {
    const headersAndBody = fileContent.split(/\r?\n\r?\n/);
    const rawHeaders = headersAndBody[0] || '';
    const rawEmail = headersAndBody.slice(1).join('\n'); // join remaining parts to handle multiple blank lines

    const senderMatch = rawHeaders.match(/^From:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/m);
    const replyToMatch = rawHeaders.match(/^Reply-To:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/m);
    const returnPathMatch = rawHeaders.match(/^Return-Path:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/m);
    const subjectMatch = rawHeaders.match(/^Subject:\s*(.+)/m);
    const domainMatches = this.detectDomains(fileContent);

    const detectedJavaScript = this.detectJavaScript(fileContent);
    const detectedPhishingKeywords = this.detectPhishingKeywords(fileContent);

    console.log('Extracted Data:', {
      sender: senderMatch?.[1] || '',
      replyTo: replyToMatch?.[1] || '',
      returnPath: returnPathMatch?.[1] || '',
      domains: domainMatches,
      subject: subjectMatch?.[1] || '',
      rawEmail: rawEmail || '',
      detectedJavaScript: detectedJavaScript,
      detectedPhishingKeywords: detectedPhishingKeywords,
      fileSize: this.fileSize,
    });

    return {
      sender: senderMatch?.[1] || '',
      replyTo: replyToMatch?.[1] || '',
      returnPath: returnPathMatch?.[1] || '',
      domains: domainMatches,
      subject: subjectMatch?.[1] || '',
      rawEmail: rawEmail || '',
      detectedJavaScript: detectedJavaScript,
      detectedPhishingKeywords: detectedPhishingKeywords,
      fileSize: this.fileSize,
    };
  }


  private detectDomains(fileContent: string): string[] {
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

  private detectJavaScript(content: string): string[] {
    const executionPatterns: { pattern: RegExp; label: string }[] = [
      { pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/i, label: '<script> tag' },
      { pattern: /<[^>]+on\w+\s*=\s*["']?[^"'>]*["']?/i, label: 'Inline event handler' },
      { pattern: /javascript:/i, label: 'JavaScript URL' },
      { pattern: /eval\(/i, label: 'eval() function' },
      { pattern: /new Function\(/i, label: 'new Function()' },
      { pattern: /document\.write\(/i, label: 'document.write()' },
      { pattern: /window\.location/i, label: 'window.location manipulation' },
      { pattern: /<iframe[\s\S]*?>/i, label: '<iframe> tag' }
    ];

    return executionPatterns
      .filter(({ pattern }) => pattern.test(content))
      .map(({ label }) => label);
  }

  private detectPhishingKeywords(content: string): string[] {
    const lowerCasedContent = content.toLowerCase();
    return PHISHING_KEYWORDS.filter(keyword => lowerCasedContent.includes(keyword.toLowerCase()));
  }
}