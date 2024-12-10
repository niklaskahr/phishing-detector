import { Component } from '@angular/core';
import { DropZoneComponent } from '../drop-zone/drop-zone.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DropZoneComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
