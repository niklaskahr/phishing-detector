import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private filesDroppedSubject = new Subject<File[]>();
  filesDropped$ = this.filesDroppedSubject.asObservable();

  notifyFilesDropped(files: File[]): void {
    this.filesDroppedSubject.next(files);
  }
}
