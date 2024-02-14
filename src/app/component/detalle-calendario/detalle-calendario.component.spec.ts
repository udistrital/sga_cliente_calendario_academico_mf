import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleCalendarioComponent } from './detalle-calendario.component';

describe('DetalleCalendarioComponent', () => {
  let component: DetalleCalendarioComponent;
  let fixture: ComponentFixture<DetalleCalendarioComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetalleCalendarioComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalleCalendarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
