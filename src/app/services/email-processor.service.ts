import { Injectable } from '@angular/core';
import { BlacklistService } from './blacklist.service';
import { ExtractedData } from '../shared/interfaces/extracted-data.interface';

@Injectable({
  providedIn: 'root'
})
export class EmailProcessorService {
  constructor(private blacklistService: BlacklistService,) { }

  async processFile(file: File): Promise<ExtractedData> {
    // Validate and populate the cache
    await this.blacklistService.ensureCacheValid();

    // Read and process the file
    const fileContent = await this.readFileAsText(file);
    return this.extractEmailData(fileContent);
  }

  private async readFileAsText(file: File): Promise<string> {
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
    const subjectMatch = fileContent.match(/Subject: (.+)/); // evaluate using keywords / common list?
    const senderMatch = fileContent.match(/From:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/);
    const replyToMatch = fileContent.match(/Reply-To:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/);
    const returnPathMatch = fileContent.match(/Return-Path:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/);
    const domainMatches = this.extractDomains(fileContent);

    console.log('Extracted Data:', {
      subject: subjectMatch?.[1] || '',
      sender: senderMatch?.[1] || '',
      replyTo: replyToMatch?.[1] || '',
      returnPath: returnPathMatch?.[1] || '',
      domains: domainMatches,
    });

    return {
      subject: subjectMatch?.[1] || '',
      sender: senderMatch?.[1] || '',
      replyTo: replyToMatch?.[1] || '',
      returnPath: returnPathMatch?.[1] || '',
      domains: domainMatches,
    };
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