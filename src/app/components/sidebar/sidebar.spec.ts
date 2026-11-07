import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the sidebar with every module expanded', () => {
    component.toggleGroup('Operations');
    component.toggleGroup('Inventory');
    component.toggleGroup('Fleet & Field');
    component.toggleGroup('Automated Logistics');
    component.toggleGroup('Delivery');

    component.toggleMobileMenu();
    fixture.detectChanges();

    expect(component.mobileMenuOpen()).toBe(true);
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('.nav-group-toggle'))
        .every((button: HTMLButtonElement) => button.getAttribute('aria-expanded') === 'true')
    ).toBe(true);
  });

  it('closes the sidebar when the toggle is activated while open', () => {
    component.toggleMobileMenu();
    component.toggleMobileMenu();

    expect(component.mobileMenuOpen()).toBe(false);
  });
});
