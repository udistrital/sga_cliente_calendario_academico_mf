import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignarCalendarioProyectoComponent } from './asignar-calendario-proyecto.component';

describe('AsignarCalendarioProyectoComponent', () => {
  let component: AsignarCalendarioProyectoComponent;
  let fixture: ComponentFixture<AsignarCalendarioProyectoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AsignarCalendarioProyectoComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AsignarCalendarioProyectoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
