import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DispatchTable } from './dispatch-table';

describe('DispatchTable', () => {
  let component: DispatchTable;
  let fixture: ComponentFixture<DispatchTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DispatchTable],
    }).compileComponents();

    fixture = TestBed.createComponent(DispatchTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
