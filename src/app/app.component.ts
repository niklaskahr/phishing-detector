import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { FooterComponent } from './footer/footer.component';
import { CacheService } from './services/cache.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, HomeComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  constructor(private cacheService: CacheService) { }

  async ngOnInit(): Promise<void> {
    await this.cacheService.fetchAndCacheAll();
  }
}
