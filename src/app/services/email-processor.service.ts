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

  async processFile(file: File): Promise<ExtractedData> {
    const fileContent = await FileReaderUtil.readFileAsText(file);
    this.fileSize = file.size;
    return this.extractEmailData(fileContent);
  }

  private extractEmailData(fileContent: string): ExtractedData {
    const { rawHeaders, rawEmail } = this.splitHeadersAndBody(fileContent);

    const sender = this.extractHeader(rawHeaders, /^From:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/m);
    const replyTo = this.extractHeader(rawHeaders, /^Reply-To:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/m);
    const returnPath = this.extractHeader(rawHeaders, /^Return-Path:\s*(?:.*<)?([\w.-]+@[\w.-]+)(?:>)?/m);
    const subject = this.cleanSubject(this.extractHeader(rawHeaders, /^Subject:\s*(.+)/m) || '');

    return {
      sender: sender || '',
      replyTo: replyTo || '',
      returnPath: returnPath || '',
      domains: this.detectDomains(fileContent),
      subject: subject,
      rawEmail: rawEmail || '',
      detectedJavaScript: this.detectJavaScript(rawEmail),
      detectedPhishingKeywords: this.detectPhishingKeywords(`${subject}\n${rawEmail}`),
      fileSize: this.fileSize,
      attachments: this.extractUnsafeAttachments(fileContent),
    };
  }

  private splitHeadersAndBody(fileContent: string): { rawHeaders: string; rawEmail: string } {
    const parts = fileContent.split(/\r?\n\r?\n/);
    return {
      rawHeaders: parts[0] || '',
      rawEmail: parts.slice(1).join('\n') || '',
    };
  }

  private extractHeader(headers: string, regex: RegExp): string | null {
    const unfoldedHeaders = headers.replace(/\r?\n[ \t]+/g, ' ');
    const match = unfoldedHeaders.match(regex);
    return match?.[1]?.trim() || null;
  }

  private cleanSubject(subject: string): string {
    // unfold multiline subject headers into a single line
    subject = subject.replace(/\r?\n[ \t]+/g, ' ');

    // decode all MIME-encoded words and combine with plain text
    subject = subject.replace(/=\?UTF-8\?B\?([A-Za-z0-9+/=]+)\?=/g, (_, base64) => {
      try {
        return atob(base64);
      } catch {
        return '';
      }
    });

    subject = this.fixCorruptedUtf8(subject);
    subject = this.removeEmojis(subject);

    return subject.replace(/\s{2,}/g, ' ').trim();
  }

  private removeEmojis(input: string): string {
    const corruptedReplacements = [
      'âï¸',
    ];

    corruptedReplacements.forEach(corrupted => {
      input = input.replace(new RegExp(corrupted, 'g'), '');
    });

    return input.replace(/[\p{Emoji}\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]/gu, '');
  }

  private fixCorruptedUtf8(input: string): string {
    const replacements: { [key: string]: string } = {
      'â': "'",
      'â': '–',
      'â¦': '…',
      'Ã©': 'é',
      'Ã¨': 'è',
      'âï¸': '',
      'ð': '',
    };
    return input.replace(/â|â|â¦|Ã©|Ã¨|ð/g, (match) => replacements[match] || '');
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
      { pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/i, label: '<script> Tag' },
      { pattern: /<[^>]+on\w+\s*=\s*["']?[^"'>]*["']?/i, label: 'Inline Event Handler' },
      { pattern: /javascript:/i, label: 'JavaScript URL' },
      { pattern: /eval\(/i, label: 'eval() Function' },
      { pattern: /new Function\(/i, label: 'new Function()' },
      { pattern: /document\.write\(/i, label: 'document.write()' },
      { pattern: /window\.location/i, label: 'window.location Manipulation' },
      { pattern: /<iframe[\s\S]*?>/i, label: '<iframe> Tag' }
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