import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DefCalendarioAcademicoComponent } from './def-calendario-academico.component';

describe('DefCalendarioAcademicoComponent', () => {
  let component: DefCalendarioAcademicoComponent;
  let fixture: ComponentFixture<DefCalendarioAcademicoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DefCalendarioAcademicoComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefCalendarioAcademicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
