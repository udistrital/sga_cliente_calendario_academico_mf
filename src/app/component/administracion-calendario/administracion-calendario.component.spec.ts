import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministracionCalendarioComponent } from './administracion-calendario.component';

describe('AdministracionCalendarioComponent', () => {
  let component: AdministracionCalendarioComponent;
  let fixture: ComponentFixture<AdministracionCalendarioComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdministracionCalendarioComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdministracionCalendarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
