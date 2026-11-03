import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  NgZone,
  ElementRef,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/** Brand config — swap this one object before launch */
const BRAND = {
  name: 'Trunkline',
  tagline: 'Freight that moves. Operations that breathe.',
  ctaLabel: 'Get a quote',
  ctaRoute: '/orders',
};

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly brand = BRAND;

  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);
  private el = inject(ElementRef);

  // GSAP / Lenis refs — loaded dynamically so SSR never touches them
  private gsap: any;
  private ScrollTrigger: any;
  private lenis: any;
  private ctx: any; // gsap.context()

  ngOnInit() {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.zone.runOutsideAngular(() => this.initAnimations());
  }

  private async initAnimations() {
    // Dynamic imports — avoids SSR issues
    const gsapMod = await import('gsap');
    const stMod = await import('gsap/ScrollTrigger');
    const lenisMod = await import('lenis');

    this.gsap = gsapMod.gsap ?? gsapMod.default;
    this.ScrollTrigger = stMod.ScrollTrigger;
    const LenisClass = lenisMod.default;

    this.gsap.registerPlugin(this.ScrollTrigger);

    // Lenis smooth-scroll
    this.lenis = new LenisClass({ lerp: 0.08 });
    this.lenis.on('scroll', this.ScrollTrigger.update);
    this.gsap.ticker.add((time: number) => this.lenis.raf(time * 1000));
    this.gsap.ticker.lagSmoothing(0);

    const root = this.el.nativeElement as HTMLElement;

    // Reduced-motion guard
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      this.showReducedMotion(root);
      return;
    }

    this.ctx = this.gsap.context(() => {
      this.buildScene1(root);
      this.buildScene2(root);
      this.buildScene3(root);
      this.buildScene4(root);
      this.buildScene5(root);
    }, root);
  }

  // ── SCENE 1 — Highway aerial zoom-out ────────────────────────────
  private buildScene1(root: HTMLElement) {
    const pin = root.querySelector('.scene-1') as HTMLElement;
    const img = pin.querySelector('.s1-img') as HTMLElement;
    const headline = pin.querySelector('.s1-headline') as HTMLElement;
    const sub = pin.querySelector('.s1-sub') as HTMLElement;
    const cta = pin.querySelector('.s1-cta') as HTMLElement;

    const tl = this.gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: '+=140%',
        scrub: 1.2,
        pin: true,
        anticipatePin: 1,
      },
    });

    // Zoom out the cropped highway image on scroll
    tl.fromTo(img, { scale: 1.18, x: '-12%' }, { scale: 1, x: '0%', ease: 'none' }, 0)
      .fromTo(headline, { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.3 }, 0.05)
      .fromTo(sub, { opacity: 0, y: 16 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.25 }, 0.15)
      .fromTo(cta, { opacity: 0, y: 12 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.2 }, 0.25)
      // Exit: slide text up and fade out
      .to([headline, sub, cta], { opacity: 0, y: -20, ease: 'power2.in', duration: 0.2 }, 0.78)
      .to(img, { scale: 1.05, opacity: 0.6, duration: 0.2, ease: 'none' }, 0.82);
  }

  // ── SCENE 2 — Truck top-view callouts ────────────────────────────
  private buildScene2(root: HTMLElement) {
    const pin = root.querySelector('.scene-2') as HTMLElement;
    const truck = pin.querySelector('.s2-truck') as HTMLElement;
    const callouts = pin.querySelectorAll<HTMLElement>('.s2-callout');

    const tl = this.gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: '+=120%',
        scrub: 1,
        pin: true,
        anticipatePin: 1,
      },
    });

    tl.fromTo(truck, { scale: 0.88, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }, 0);
    callouts.forEach((c, i) => {
      tl.fromTo(c, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.18, ease: 'back.out(1.4)' }, 0.18 + i * 0.12);
    });
    // Exit fade
    tl.to(pin.querySelector('.scene-inner'), { opacity: 0, duration: 0.15, ease: 'power1.in' }, 0.88);
  }

  // ── SCENE 3 — Iris reveal: closed → open truck ───────────────────
  private buildScene3(root: HTMLElement) {
    const pin = root.querySelector('.scene-3') as HTMLElement;
    const iris = pin.querySelector('.s3-iris') as HTMLElement;
    const crates = pin.querySelector('.s3-crates') as HTMLElement;
    const caption = pin.querySelector('.s3-caption') as HTMLElement;

    const tl = this.gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: '+=110%',
        scrub: 1,
        pin: true,
        anticipatePin: 1,
      },
    });

    // Iris expand via clip-path circle
    tl.fromTo(
      iris,
      { clipPath: 'circle(0% at 50% 50%)' },
      { clipPath: 'circle(75% at 50% 50%)', ease: 'power2.inOut', duration: 0.45 },
      0,
    )
      .fromTo(crates, { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 0.25 }, 0.35)
      .fromTo(caption, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }, 0.52)
      .to(pin.querySelector('.scene-inner'), { opacity: 0, duration: 0.15, ease: 'power1.in' }, 0.86);
  }

  // ── SCENE 4 — Container sweep + crates multiply ──────────────────
  private buildScene4(root: HTMLElement) {
    const pin = root.querySelector('.scene-4') as HTMLElement;
    const container = pin.querySelector('.s4-container') as HTMLElement;
    const crates = pin.querySelector('.s4-crates') as HTMLElement;
    const stats = pin.querySelectorAll<HTMLElement>('.s4-stat');

    const tl = this.gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: '+=130%',
        scrub: 1,
        pin: true,
        anticipatePin: 1,
      },
    });

    tl.fromTo(container, { x: '40%', opacity: 0 }, { x: '0%', opacity: 1, ease: 'power2.out', duration: 0.4 }, 0)
      .fromTo(crates, { x: '-30%', opacity: 0 }, { x: '0%', opacity: 1, ease: 'power2.out', duration: 0.35 }, 0.2);

    stats.forEach((s, i) => {
      tl.fromTo(s, { opacity: 0, y: 12 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.2 }, 0.32 + i * 0.1);
    });

    tl.to(pin.querySelector('.scene-inner'), { opacity: 0, duration: 0.15, ease: 'power1.in' }, 0.87);
  }

  // ── SCENE 5 — CTA finale ─────────────────────────────────────────
  private buildScene5(root: HTMLElement) {
    const pin = root.querySelector('.scene-5') as HTMLElement;
    const truck = pin.querySelector('.s5-truck') as HTMLElement;
    const headline = pin.querySelector('.s5-headline') as HTMLElement;
    const cta = pin.querySelector('.s5-cta') as HTMLElement;

    const tl = this.gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: '+=100%',
        scrub: 0.8,
        pin: true,
        anticipatePin: 1,
      },
    });

    tl.fromTo(truck, { scale: 1.1, opacity: 0 }, { scale: 1, opacity: 1, ease: 'power2.out', duration: 0.4 }, 0)
      .fromTo(headline, { opacity: 0, y: 20 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.3 }, 0.3)
      .fromTo(cta, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, ease: 'back.out(1.5)', duration: 0.25 }, 0.55);
  }

  private showReducedMotion(root: HTMLElement) {
    // Just make everything visible instantly
    root.querySelectorAll<HTMLElement>('.rm-show').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  ngOnDestroy() {
    this.ctx?.revert();
    this.lenis?.destroy();
    this.gsap?.ticker.remove((time: number) => this.lenis?.raf(time * 1000));
    this.ScrollTrigger?.getAll().forEach((t: any) => t.kill());
  }
}

