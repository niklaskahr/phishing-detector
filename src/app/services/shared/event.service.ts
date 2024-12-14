import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private fileDroppedSubject = new Subject<File>();
  fileDropped$ = this.fileDroppedSubject.asObservable();

  notifyFileDropped(file: File): void {
    this.fileDroppedSubject.next(file);
  }
}
