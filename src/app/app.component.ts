import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { FooterComponent } from './footer/footer.component';
import { InitializationService } from './services/initialization.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, HomeComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  constructor(private initService: InitializationService) { }

  async ngOnInit(): Promise<void> {
    console.log('Initializing app...');
    await this.initService.fetchAndCacheAll();
    console.log('App initialization complete.');
  }
}
