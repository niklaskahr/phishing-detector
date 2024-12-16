import { Injectable } from '@angular/core';
import { ExtractedData } from '../shared/interfaces/extracted-data.interface';
import { PHISHING_KEYWORDS } from '../shared/constants/phishing-keywords.constant';
import { AttachmentDetails } from '../shared/interfaces/attachment-details.interface';
import { UNSAFE_FILE_EXTENSIONS } from '../shared/constants/unsafe-file-extensions.constant';
import { FileReaderUtil } from '../shared/utils/file-reader.util';

@Injectable({
  providedIn: 'root'
})
export class EmailProcessorService {
  fileSize: number = 0;

  // async processFile(file: File): Promise<ExtractedData> {
  //   await this.blacklistService.ensureCacheValid(); // validate and populate the cache
  //   const fileContent = await this.readFileAsText(file);
  //   return this.extractEmailData(fileContent);
  // }

  // private async readFileAsText(file: File): Promise<string> {
  //   this.fileSize = file.size;

  //   const reader = new FileReader();

  //   return new Promise((resolve, reject) => {
  //     reader.onload = (event) => {
  //       const fileContent = event.target?.result as string;
  //       if (!fileContent) {
  //         reject(new Error('File is empty or could not be read.'));
  //       } else {
  //         resolve(fileContent);
  //       }
  //     };

  //     reader.onerror = (error) => {
  //       reject(new Error(`Error reading file: ${error}`));
  //     };

  //     reader.readAsText(file);
  //   });
  // }

  async processFile(file: File): Promise<ExtractedData> {
    const fileContent = await FileReaderUtil.readFileAsText(file);
    this.fileSize = file.size;
    return this.extractEmailData(fileContent);
  }

  private extractEmailData(fileContent: string): ExtractedData {
    const headersAndBody = fileContent.split(/\r?\n\r?\n/);
    const rawHeaders = headersAndBody[0] || '';
    const rawEmail = headersAndBody.slice(1).join('\n'); // handle multiple blank lines

    const senderMatch = rawHeaders.match(/^From:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/m);
    const replyToMatch = rawHeaders.match(/^Reply-To:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/m);
    const returnPathMatch = rawHeaders.match(/^Return-Path:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/m);
    const subjectMatch = rawHeaders.match(/^Subject:\s*(.+)/m);
    const domainMatches = this.detectDomains(fileContent);

    const detectedJavaScript = this.detectJavaScript(rawEmail);
    const detectedPhishingKeywords = this.detectPhishingKeywords(`${subjectMatch?.[1]}\n${rawEmail}`);
    const unsafeAttachments = this.extractUnsafeAttachments(fileContent);

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
      attachments: unsafeAttachments,
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

  private detectJavaScript(email: string): string[] {
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
      .filter(({ pattern }) => pattern.test(email))
      .map(({ label }) => label);
  }

  private detectPhishingKeywords(subjectAndEmail: string): string[] {
    const lowerCasedContent = subjectAndEmail.toLowerCase();
    return PHISHING_KEYWORDS.filter(keyword => {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
      return regex.test(lowerCasedContent);
    });
  }

  private extractUnsafeAttachments(fileContent: string): AttachmentDetails[] | null {
    const unsafeExtensions = UNSAFE_FILE_EXTENSIONS;
    const attachments: AttachmentDetails[] = [];
    const processedFilenames = new Set<string>();

    // pre-process: merge multi-line headers
    const mergedContent = fileContent.replace(/\r?\n\s+/g, ' ');

    const contentTypeRegex = /Content-Type:.*?;\s*name="?([^";\r\n\s]+)"?/gi;
    const contentDispositionRegex = /Content-Disposition:.*?;\s*filename="?([^";\r\n\s]+)"?/gi;

    let match: RegExpExecArray | null;

    const processMatch = (filename: string) => { // extract and process filenames
      const fileParts = filename.split('.');
      const fileType = fileParts.pop()?.toLowerCase(); // extract extension
      const baseName = fileParts.join('.'); // remaining part is the file name without extension

      if (fileType && unsafeExtensions.includes(fileType) && !processedFilenames.has(filename)) {
        attachments.push({ name: baseName, type: fileType });
        processedFilenames.add(filename);
      }
    };

    while ((match = contentTypeRegex.exec(mergedContent))) { // search for Content-Type matches
      processMatch(match[1]);
    }

    while ((match = contentDispositionRegex.exec(mergedContent))) { // search for Content-Disposition matches
      processMatch(match[1]);
    }

    return attachments.length > 0 ? attachments : null;
  }
}