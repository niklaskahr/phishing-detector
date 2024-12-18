import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { LoaderComponent } from './loader/loader.component';
import { FooterComponent } from './footer/footer.component';
import { EmailAuditService } from './services/email-audit.service';
import { CacheService } from './services/shared/cache.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, HomeComponent, LoaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  constructor(
    private cacheService: CacheService,
    private emailAuditService: EmailAuditService
  ) { }

  async ngOnInit(): Promise<void> {
    await this.cacheService.fetchAndCacheAll();
  }
}
