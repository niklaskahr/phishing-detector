import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-trustworthiness-gauge',
  standalone: true,
  templateUrl: './trustworthiness-gauge.component.html',
  styleUrls: ['./trustworthiness-gauge.component.scss']
})
export class TrustworthinessGaugeComponent implements OnChanges {
  @Input() score: number = 0;
  animatedScore: number = 0;
  Math = Math;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['score'] && changes['score'].currentValue !== changes['score'].previousValue) {
      this.animateScore();
    }
  }

  animateScore(): void {
    const animationDuration = 1000;
    const steps = 60;
    const increment = this.score / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      this.animatedScore = Math.min(Math.round(current), this.score);

      if (current >= this.score) {
        clearInterval(interval);
      }
    }, animationDuration / steps);
  }

  get strokeDashoffset(): number {
    const radius = 40;
    const circumference = Math.PI * radius;
    const progress = this.animatedScore / 100;
    return circumference * (1 - progress);
  }
}