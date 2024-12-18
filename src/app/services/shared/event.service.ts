import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { EmailData } from '../../shared/interfaces/email-data.interface';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private filesDroppedSubject = new Subject<File[]>();
  private analysisStoredSubject = new Subject<EmailData>();
  filesDropped$ = this.filesDroppedSubject.asObservable();
  analysisStored$ = this.analysisStoredSubject.asObservable();

  notifyFilesDropped(files: File[]): void {
    this.filesDroppedSubject.next(files);
  }

  notifyAnalysisStored(data: EmailData): void {
    this.analysisStoredSubject.next(data);
  }
}
