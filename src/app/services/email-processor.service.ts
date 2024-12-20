import { Injectable } from '@angular/core';
import { ExtractedData } from '../shared/interfaces/extracted-data.interface';
import { AttachmentDetails } from '../shared/interfaces/attachment-details.interface';
import { FileReaderUtil } from '../shared/utils/file-reader.util';
import { PHISHING_KEYWORDS } from '../shared/constants/phishing-keywords.constant';
import { UNSAFE_FILE_EXTENSIONS } from '../shared/constants/unsafe-file-extensions.constant';

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
    const decodedBody = this.decodeBody(rawEmail);

    return {
      sender: sender || '',
      replyTo: replyTo || '',
      returnPath: returnPath || '',
      domains: this.detectDomains(decodedBody),
      subject: subject,
      rawEmail: decodedBody || '',
      detectedJavaScript: this.detectJavaScript(decodedBody),
      detectedPhishingKeywords: this.detectPhishingKeywords(`${subject}\n${decodedBody}`),
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
    subject = subject.replace(/\r?\n[ \t]+/g, ' ');

    subject = subject.replace(/=\?([\w\-]+)\?(Q|B)\?(.+?)\?=/gi, (_, charset, encoding, encodedText) => {
      try {
        if (encoding.toUpperCase() === 'Q') {
          return encodedText
            .replace(/_/g, ' ')
            .replace(/=([0-9A-Fa-f]{2})/g, (_: any, hex: string) =>
              String.fromCharCode(parseInt(hex, 16))
            );
        } else if (encoding.toUpperCase() === 'B') {
          return atob(encodedText);
        }
      } catch {
        return '';
      }

      return '';
    });

    subject = this.fixCorruptedUtf8(subject);
    return subject.replace(/\s{2,}/g, ' ').trim();
  }

  private decodeBody(rawEmail: string): string {
    try {
      const quotedPrintableDecoded = rawEmail.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );

      let decoded = atob(quotedPrintableDecoded);
      decoded = this.fixCorruptedUtf8(decoded);

      const htmlDecoded = decoded.replace(/&#(\d+);/g, (_, code) =>
        String.fromCharCode(parseInt(code, 10))
      );

      const plainText = htmlDecoded.replace(/<[^>]*>/g, '');

      return plainText.trim();
    } catch {
      return this.fixCorruptedUtf8(rawEmail);
    }
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
      'Ü¿': '',
    };

    let fixed = input.replace(
      new RegExp(Object.keys(replacements).join('|'), 'g'),
      (match) => replacements[match] || ''
    );

    fixed = fixed.replace(/\b([A-Z][a-z]*)\s([A-Z])/g, '$1$2');
    fixed = fixed.replace(/([a-z])([A-Z])/g, '$1 $2');
    fixed = fixed.replace(/\s{2,}/g, ' ');

    return fixed.trim();
  }

  private detectDomains(decodedBody: string): string[] {
    const cleanedUrlMatches = decodedBody
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

  private detectJavaScript(decodedBody: string): string[] {
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
      .filter(({ pattern }) => pattern.test(decodedBody))
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