import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcesoCalendarioAcademicoComponent } from './proceso-calendario-academico.component';

describe('ProcesoCalendarioAcademicoComponent', () => {
  let component: ProcesoCalendarioAcademicoComponent;
  let fixture: ComponentFixture<ProcesoCalendarioAcademicoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProcesoCalendarioAcademicoComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcesoCalendarioAcademicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
