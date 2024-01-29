import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EdicionActividadesProgramasComponent } from './edicion-actividades-programas.component';

describe('EdicionActividadesProgramasComponent', () => {
  let component: EdicionActividadesProgramasComponent;
  let fixture: ComponentFixture<EdicionActividadesProgramasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EdicionActividadesProgramasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EdicionActividadesProgramasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
