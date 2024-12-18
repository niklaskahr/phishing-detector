import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrustworthinessGaugeComponent } from './trustworthiness-gauge.component';

describe('TrustworthinessGaugeComponent', () => {
  let component: TrustworthinessGaugeComponent;
  let fixture: ComponentFixture<TrustworthinessGaugeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrustworthinessGaugeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TrustworthinessGaugeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
