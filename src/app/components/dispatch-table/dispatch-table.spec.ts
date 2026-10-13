import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DispatchTableComponent } from './dispatch-table';

describe('DispatchTableComponent', () => {
  let component: DispatchTableComponent;
  let fixture: ComponentFixture<DispatchTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DispatchTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DispatchTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
