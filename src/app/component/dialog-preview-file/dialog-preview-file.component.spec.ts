import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPreviewFileComponent } from './dialog-preview-file.component';

describe('DialogPreviewFileComponent', () => {
  let component: DialogPreviewFileComponent;
  let fixture: ComponentFixture<DialogPreviewFileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogPreviewFileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogPreviewFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
