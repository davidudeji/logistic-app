import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: [
    './landing.component.css',
    './landing-base.component.css',
    './landing-sections.component.css',
    './landing-ending.component.css',
    './landing-footer.component.css',
    './landing-responsive.component.css',
  ],
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  readonly currentYear = new Date().getFullYear();
  readonly menuOpen = signal(false);
  readonly isScrolled = signal(false);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly observers: IntersectionObserver[] = [];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !('IntersectionObserver' in window)) return;

    const root: HTMLElement = this.element.nativeElement;
    const sentinel = root.querySelector('.scroll-sentinel');
    if (sentinel) {
      const headerObserver = new IntersectionObserver(
        ([entry]) => this.isScrolled.set(!entry.isIntersecting),
        { rootMargin: '-72px 0px 0px 0px', threshold: 0 },
      );
      headerObserver.observe(sentinel);
      this.observers.push(headerObserver);
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    root.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );

    const revealItems: NodeListOf<Element> = root.querySelectorAll('[data-reveal]');
    revealItems.forEach((item: Element) => revealObserver.observe(item));
    this.observers.push(revealObserver);
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  scrollToSection(event: MouseEvent, id: string): void {
    const target = this.element.nativeElement.querySelector(`#${id}`);
    if (!target) return;

    event.preventDefault();
    this.closeMenu();
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    target.scrollIntoView({ behavior, block: 'start' });
    window.history.pushState(null, '', `#${id}`);
  }

  ngOnDestroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
  }
}
