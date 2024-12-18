import { Component } from '@angular/core';
import { DropZoneComponent } from './drop-zone/drop-zone.component';
import { ReportComponent } from './report/report.component';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DropZoneComponent, ReportComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
