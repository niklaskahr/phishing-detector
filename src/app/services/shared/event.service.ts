import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private fileDroppedSubject = new Subject<File>();
  fileDropped$ = this.fileDroppedSubject.asObservable();

  notifyFileDropped(file: File): void {
    console.log('eventService received file:', file);
    this.fileDroppedSubject.next(file);
  }
}
