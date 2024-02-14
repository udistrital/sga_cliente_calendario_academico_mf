import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarioProyectoComponent } from './calendario-proyecto.component';

describe('CalendarioProyectoComponent', () => {
  let component: CalendarioProyectoComponent;
  let fixture: ComponentFixture<CalendarioProyectoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CalendarioProyectoComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarioProyectoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
