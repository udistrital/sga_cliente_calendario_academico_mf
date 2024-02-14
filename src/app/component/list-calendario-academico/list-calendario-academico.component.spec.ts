import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCalendarioAcademicoComponent } from './list-calendario-academico.component';

describe('ListCalendarioAcademicoComponent', () => {
  let component: ListCalendarioAcademicoComponent;
  let fixture: ComponentFixture<ListCalendarioAcademicoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListCalendarioAcademicoComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListCalendarioAcademicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
