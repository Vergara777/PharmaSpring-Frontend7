import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuppliersForm } from './suppliers-form';

describe('SuppliersForm', () => {
  let component: SuppliersForm;
  let fixture: ComponentFixture<SuppliersForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuppliersForm],
    }).compileComponents();

    fixture = TestBed.createComponent(SuppliersForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
