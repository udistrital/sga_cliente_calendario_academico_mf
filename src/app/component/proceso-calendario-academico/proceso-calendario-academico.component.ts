import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Proceso } from 'src/app/models/calendario-academico/proceso';
import { Calendario } from 'src/app/models/calendario-academico/calendario';
import { EventoService } from 'src/app/services/evento.service';
import { PopUpManager } from 'src/app/managers/popUpManager';

@Component({
  selector: 'proceso-calendario-academico',
  templateUrl: './proceso-calendario-academico.component.html',
  styleUrls: ['./proceso-calendario-academico.component.scss'],
})
export class ProcesoCalendarioAcademicoComponent {

  //process!: Proceso;
  process!: any;
  processForm!: FormGroup;
  periodicidad!: any[];

  constructor(
    public dialogRef: MatDialogRef<ProcesoCalendarioAcademicoComponent>,
    private builder: FormBuilder,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private eventoService: EventoService,
    private popUpManager: PopUpManager,
  ) {
    this.fetchSelectData();
    this.createProcessForm();
    this.dialogRef.backdropClick().subscribe(() => this.closeDialog());
    if (this.data.editProcess !== undefined) {
      this.processForm.setValue({
        Nombre: this.data.editProcess.Nombre,
        Descripcion: this.data.editProcess.Descripcion,
        TipoRecurrenciaId: this.data.editProcess.TipoRecurrenciaId.Id,
      });
    }
  }

  saveProcess() {
    this.popUpManager.showConfirmAlert(
      this.data.editProcess === undefined ?
      this.translate.instant('calendario.seguro_registrar_proceso') :
      this.translate.instant('calendario.seguro_modificar_proceso')
    ).then((ok:any) => {
      if (ok.value) {
        this.process = this.processForm.value;
        this.process.CalendarioId = {Id: this.data.calendar.calendarioId};
        this.process.TipoRecurrenciaId = {Id: this.processForm.value.TipoRecurrenciaId};
        this.process['Activo'] = true;
        this.dialogRef.close(this.process);
      }
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  createProcessForm() {
    this.processForm = this.builder.group({
      Nombre: ['', Validators.required],
      Descripcion: ['', Validators.required],
      TipoRecurrenciaId: '',
    });
  }

  fetchSelectData() {
    this.eventoService.get('tipo_recurrencia?limit=0').subscribe((data:any) => this.periodicidad = data);
  }

}
