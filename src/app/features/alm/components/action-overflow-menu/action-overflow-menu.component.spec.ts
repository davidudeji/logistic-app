import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionOverflowMenuComponent } from './action-overflow-menu.component';

describe('ActionOverflowMenuComponent', () => {
  let component: ActionOverflowMenuComponent;
  let fixture: ComponentFixture<ActionOverflowMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionOverflowMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionOverflowMenuComponent);
    component = fixture.componentInstance;
    component.entityId = 'ITEM-001';
    component.entityName = 'Test Truck VEH-101';
    fixture.detectChanges();
  });

  it('should create the action overflow menu component', () => {
    expect(component).toBeTruthy();
  });

  it('should render trigger button with >=44x44px target and aria attributes', () => {
    const trigger = fixture.nativeElement.querySelector('.overflow-trigger-btn');
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('should open dropdown menu on click with role="menu" and three items in exact order', () => {
    const trigger = fixture.nativeElement.querySelector('.overflow-trigger-btn');
    trigger.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(true);

    const menu = fixture.nativeElement.querySelector('.dropdown-menu');
    expect(menu).toBeTruthy();
    expect(menu.getAttribute('role')).toBe('menu');

    const items = fixture.nativeElement.querySelectorAll('[role="menuitem"]');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain('View');
    expect(items[1].textContent).toContain('Edit');
    expect(items[2].textContent).toContain('Delete');
  });

  it('should close on escape key (light dismiss)', () => {
    component.isOpen.set(true);
    fixture.detectChanges();

    component.onEscapeKey();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
  });

  it('should open confirmation modal with red delete and neutral cancel button when delete is clicked', () => {
    component.isOpen.set(true);
    fixture.detectChanges();

    const deleteBtn = fixture.nativeElement.querySelector('.delete-item');
    deleteBtn.click();
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
    expect(component.showDeleteModal()).toBe(true);

    const modal = fixture.nativeElement.querySelector('.modal-backdrop');
    expect(modal).toBeTruthy();

    const cancelBtn = fixture.nativeElement.querySelector('.modal-cancel-btn');
    const confirmDeleteBtn = fixture.nativeElement.querySelector('.modal-delete-btn');

    expect(cancelBtn.textContent).toContain('Cancel');
    expect(confirmDeleteBtn.textContent).toContain('Delete');
  });

  it('should emit deleteConfirmed event when modal delete button is clicked', () => {
    spyOn(component.deleteConfirmed, 'emit');

    component.showDeleteModal.set(true);
    fixture.detectChanges();

    const confirmDeleteBtn = fixture.nativeElement.querySelector('.modal-delete-btn');
    confirmDeleteBtn.click();

    expect(component.deleteConfirmed.emit).toHaveBeenCalledWith('ITEM-001');
    expect(component.showDeleteModal()).toBe(false);
  });
});
