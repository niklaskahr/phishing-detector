import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmailProcessorService {

  // TODO: process JS snippets, URLs, email addresses (from), keywords (PIN, password, etc.), attachments (?)

  processEmailFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target?.result as string;

      const subjectMatch = fileContent.match(/Subject: (.+)/);
      if (subjectMatch) {
        console.log('*Subject:*', subjectMatch[1]);
      }

      console.log('*File content:*', fileContent);
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };

    reader.readAsText(file);
  }
}