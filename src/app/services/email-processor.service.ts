import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmailProcessorService {

  processEmailFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (event) => {
      const fileContent = event.target?.result as string;

      // Example: Extract subject from the email
      const subjectMatch = fileContent.match(/Subject: (.+)/);
      if (subjectMatch) {
        console.log('*Subject:*', subjectMatch[1]);
      }

      // Process the file content (e.g., parse headers, body, attachments)
      console.log('*File content:*', fileContent);
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };

    reader.readAsText(file);
  }
}