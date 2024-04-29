import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Actividad } from 'src/app/models/calendario-academico/actividad';
import { ParametrosService } from 'src/app/services/parametros.service';
import { EventoService } from 'src/app/services/evento.service';
import { PopUpManager } from 'src/app/managers/popUpManager';
import * as moment from 'moment';
import { MatTableDataSource } from '@angular/material/table';
// import { LocalDataSource } from 'ng2-smart-table';

@Component({
  selector: 'ngx-actividad-calendario-academico',
  templateUrl: './actividad-calendario-academico.component.html',
  styleUrls: ['./actividad-calendario-academico.component.scss'],
})
export class ActividadCalendarioAcademicoComponent implements OnInit {

  activity!: Actividad;
  processName: string;
  period: string;
  activityForm!: FormGroup;
  responsables: any;
  responsablesSelected!: any[];
  publicTypeForm!: FormGroup;
  addPublic: boolean = false;
  publicTable: any;
  // tableSource: LocalDataSource;
  tableSource: MatTableDataSource<any> = new MatTableDataSource<any>
  displayedColumns = ['Nombre', 'Acciones']
  minDate!: Date;
  maxDate!: Date;

  constructor(
    public dialogRef: MatDialogRef<ActividadCalendarioAcademicoComponent>,
    private builder: FormBuilder,
    private parametrosService: ParametrosService,
    private eventoService: EventoService,
    private translate: TranslateService,
    private popUpManager: PopUpManager,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.processName = this.data.process.Nombre;
    this.period = '';
    this.fetchSelectData(this.data.calendar.PeriodoId);
    this.createActivityForm();
    this.createPublicTable();
    this.createPublicTypeForm();
    this.dialogRef.backdropClick().subscribe(() => this.closeDialog());
  }

  ngOnInit() {

    if (this.data.editActivity !== undefined) {
      this.activityForm.setValue({
        Nombre: this.data.editActivity.Nombre,
        Descripcion: this.data.editActivity.Descripcion,
        FechaInicio: moment(this.data.editActivity.FechaInicio, 'DD-MM-YYYY').toDate(),
        FechaFin: moment(this.data.editActivity.FechaFin, 'DD-MM-YYYY').toDate(),
      });

      if (this.data.editActivity.EventoPadreId !== undefined && this.data.editActivity.EventoPadreId !== null) {

        this.minDate = new Date(this.data.editActivity.EventoPadreId.FechaInicio);
        this.minDate.setDate(this.minDate.getDate());
        this.maxDate = new Date(this.data.editActivity.EventoPadreId.FechaFin);
        this.maxDate.setDate(this.maxDate.getDate());
      }
    }
  }

  saveActivity() {
    this.popUpManager.showConfirmAlert(
      this.data.editActivity === undefined ?
        this.translate.instant('calendario.seguro_registrar_actividad') :
        this.translate.instant('calendario.seguro_modificar_actividad')
    ).then((ok) => {
      if (ok.value) {
        this.activity = this.activityForm.value;
        this.activity.TipoEventoId = { Id: this.data.process.procesoId };
        this.activity.FechaInicio = moment(this.activity.FechaInicio, 'DD-MM-YYYY').format('YYYY-MM-DDTHH:mm') + ':00Z';
        this.activity.FechaFin = moment(this.activity.FechaFin, 'DD-MM-YYYY').format('YYYY-MM-DDTHH:mm') + ':00Z';
        this.activity.Activo = true;
        const data = this.tableSource instanceof MatTableDataSource ? this.tableSource.data : this.tableSource;

        if (data != undefined) {

          this.responsablesSelected = data.map(
            (item: any) => {
              return { responsableID: item.Id }
            }
          );
          if (this.responsablesSelected.length > 0) {
            this.dialogRef.close({ 'Actividad': this.activity, 'responsable': this.responsablesSelected });
          } else {
            this.popUpManager.showErrorAlert(this.translate.instant('calendario.no_publico'))
          }
        }

      }
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  createActivityForm() {
    this.activityForm = this.builder.group({
      Nombre: ['', Validators.required],
      Descripcion: ['', Validators.required],
      FechaInicio: ['', Validators.required],
      FechaFin: ['', Validators.required],
    })
  }

  createPublicTypeForm() {
    this.publicTypeForm = this.builder.group({
      Nombre: ['', Validators.required],
      CodigoAbreviacion: ['', Validators.required],
      Activo: [true, Validators.required],
      NumeroOrden: ['', Validators.required],
    })
  }

  fetchSelectData(period: any) {
    this.parametrosService.get('periodo/' + period).subscribe(
      (response: any) => this.period = response['Data']['Nombre'],
    );
    this.updateSelect();
  }

  updateSelect() {
    this.eventoService.get('tipo_publico?limit=0').subscribe(
      (data: any) => {
        this.responsables = data;
        if (this.data.editActivity !== undefined && this.data.editActivity.responsables !== undefined && this.data.editActivity.responsables !== null) {
          // this.tableSource.load(
          //   this.responsables.filter((resp:any) => this.data.editActivity.responsables.some((resp2:any) => resp2.responsableID === resp.Id)),
          // );
          this.tableSource = new MatTableDataSource(this.responsables.filter((resp: any) => this.data.editActivity.responsables.some((resp2: any) => resp2.responsableID === resp.Id)));
        }
      },
      (error: any) => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      },
    );
  }

  createPublicTable() {
    this.publicTable = {
      columns: {
        Nombre: {
          title: this.translate.instant('calendario.nombre'),
          width: '80%',
          editable: false,
        },
      },
      mode: 'external',
      actions: {
        position: 'right',
        columnTitle: this.translate.instant('GLOBAL.acciones'),
        add: false,
        edit: false,
      },
      delete: {
        deleteButtonContent:
          '<i class="nb-trash" title="' +
          this.translate.instant('calendario.tooltip_eliminar') +
          '" ></i>',
      },
      hideSubHeader: true,
    };
  }

  deletePublic(event: any) {
    // this.tableSource.remove(event.data)
  }

  onSelectChange(event: any) {
    const data: any = this.responsables.filter((row: any) => row.Id === event.value)[0]
    this.tableSource.data.push(data);
    this.tableSource._updateChangeSubscription();


  }

  addPublicType() {
    const newPublicType = this.publicTypeForm.value;
    this.eventoService.post('tipo_publico', newPublicType).subscribe(
      response => {
        this.updateSelect();
        this.popUpManager.showSuccessAlert(this.translate.instant('calendario.responsable_exito'));
        this.publicTypeForm.reset({
          Nombre: '',
          CodigoAbreviacion: '',
          Activo: true,
          NumeroOrden: '',
        });
        this.addPublic = false;
      },
      error => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      },
    );
  }

  onDeletePublic(event: any) {
    this.popUpManager.showConfirmAlert(this.translate.instant('calendario.seguro_borrar_responsable')).then(
      willDelete => {
        if (willDelete.value) {
          this.eventoService.get('tipo_publico/' + event.data.Id).subscribe(
            (response: any) => {
              this.eventoService.delete('tipo_publico', response).subscribe(
                response => {
                  this.updateSelect();
                  this.popUpManager.showSuccessAlert(this.translate.instant('calendario.responsable_borrado'));
                },
                error => {
                  this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
                },
              );
            },
            (error: any) => {
              this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
            },
          );
        }
      },
    );
  }

  openForm() {
    this.addPublic = true;
  }

  closeForm() {
    this.addPublic = false;
  }

}
