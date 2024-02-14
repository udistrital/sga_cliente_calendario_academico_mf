import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActividadCalendarioAcademicoComponent } from './actividad-calendario-academico.component';

describe('ActividadCalendarioAcademicoComponent', () => {
  let component: ActividadCalendarioAcademicoComponent;
  let fixture: ComponentFixture<ActividadCalendarioAcademicoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActividadCalendarioAcademicoComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActividadCalendarioAcademicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
