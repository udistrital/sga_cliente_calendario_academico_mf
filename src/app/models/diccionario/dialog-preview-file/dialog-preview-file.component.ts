import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { TranslateService } from '@ngx-translate/core';
import { MODALS } from 'src/app/models/diccionario/diccionario';

@Component({
  selector: 'dialog-preview-file',
  templateUrl: './dialog-preview-file.component.html',
  styleUrls: ['./dialog-preview-file.component.scss']
})
export class DialogPreviewFileComponent implements OnInit {
  validsafe: boolean = false;
  ulrfileSafe: any;
  title: string = "";
  constructor(
    public dialogRef: MatDialogRef<DialogPreviewFileComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private sanitizer: DomSanitizer,
    private popUpManager: PopUpManager,
    private translate: TranslateService,
  ) { }

  ngOnInit() {
    this.ulrfileSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.url);
    this.validsafe = this.ulrfileSafe.changingThisBreaksApplicationSecurity !== undefined;
    if (this.validsafe) {
      this.title = this.data.title || "";
      if (this.data.message) {
        let m: string = this.data.message;
        if (m.endsWith(" | translate")) {
          m = this.translate.instant(m.replace(" | translate",""));
        }
        this.popUpManager.showPopUpGeneric("", "<b>"+m+"</b>", MODALS.INFO, false);
      }
    }
  }

}
