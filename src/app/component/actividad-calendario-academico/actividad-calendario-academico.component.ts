import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Actividad } from 'src/app/models/calendario-academico/actividad';
import { ParametrosService } from 'src/app/services/parametros.service';
import { SgaCalendarioMidService } from 'src/app/services/sga_calendario_mid.service';
import { EventoService } from 'src/app/services/evento.service';
import { ConfiguracionService } from 'src/app/services/configuracion.service';
import { PopUpManager } from 'src/app/managers/popUpManager';
import * as moment from 'moment';
import { MatTableDataSource } from '@angular/material/table';
import { forkJoin } from 'rxjs';
// import { LocalDataSource } from 'ng2-smart-table';

@Component({
  selector: 'ngx-actividad-calendario-academico',
  templateUrl: './actividad-calendario-academico.component.html',
  styleUrls: ['./actividad-calendario-academico.component.scss'],
})
export class ActividadCalendarioAcademicoComponent implements OnInit {

  activity!: Actividad;
  processName: string;
  processDescription: string;
  period: string;
  activityForm!: FormGroup;
  responsables: any[] = [];
  availableResponsables: any[] = [];
  selectedResponsableId: number | null = null;
  tiposPublico: any[] = [];
  eventosCatalogo: any[] = [];
  responsablesSelected!: any[];
  publicTable: any;
  // tableSource: LocalDataSource;
  tableSource: MatTableDataSource<any> = new MatTableDataSource<any>
  displayedColumns = ['Nombre', 'Acciones']
  minDate!: Date;
  maxDate!: Date;
  activeTab = 0;

  constructor(
    public dialogRef: MatDialogRef<ActividadCalendarioAcademicoComponent>,
    private builder: FormBuilder,
    private parametrosService: ParametrosService,
    private sgaCalendarioMidService: SgaCalendarioMidService,
    private eventoService: EventoService,
    private configuracionService: ConfiguracionService,
    private translate: TranslateService,
    private popUpManager: PopUpManager,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.processName = this.resolveProcessName();
    this.processDescription = this.resolveProcessDescription();
    this.period = '';
    this.fetchSelectData(this.data.calendar.PeriodoId);
    this.createActivityForm();
    this.createPublicTable();
    this.dialogRef.backdropClick().subscribe(() => this.closeDialog());
  }

  ngOnInit() {

    if (this.data.editActivity !== undefined) {
      this.activityForm.setValue({
        EventoCatalogoId: this.getCatalogId(this.data.editActivity.EventoCatalogoId),
        FechaInicio: this.parseActivityDate(this.activityStartDateValue()),
        FechaFin: this.parseActivityDate(this.activityEndDateValue()),
        HoraInicio: this.parseActivityTime(this.activityStartDateValue()),
        HoraFin: this.parseActivityTime(this.activityEndDateValue()),
      });
      this.activityForm.get('EventoCatalogoId')?.disable();
    }
  }

  saveActivity() {
    if (this.activityForm.invalid) {
      this.activeTab = 0;
      this.activityForm.markAllAsTouched();
      const message = this.activityForm.get('EventoCatalogoId')?.hasError('required')
        ? this.t('calendario.error_evento_catalogo')
        : this.t('calendario.error_fecha_actividad');
      this.popUpManager.showErrorToast(message);
      return;
    }
    const activity = this.buildActivityPayload();
    if (activity === null) {
      this.activeTab = 0;
      return;
    }
    const responsables = this.selectedPublicPayload();
    if (responsables.length === 0) {
      this.activeTab = this.publicTabIndex();
      this.popUpManager.showErrorAlert(this.translate.instant('calendario.no_publico'));
      return;
    }
    this.popUpManager.showConfirmAlert(
      this.data.editActivity === undefined ?
        this.translate.instant('calendario.seguro_registrar_actividad') :
        this.translate.instant('calendario.seguro_modificar_actividad')
    ).then((ok) => {
      if (ok.value) {
        this.dialogRef.close({ 'Actividad': activity, 'responsable': responsables });
      }
    });
  }

  publicTabIndex() {
    return 1;
  }

  buildActivityPayload() {
    const activity: any = this.activityForm.getRawValue();
    if (this.data.editActivity !== undefined) {
      activity.Id = this.data.editActivity.actividadId || this.data.editActivity.Id;
    }
    activity.ProcesoId = { Id: this.data.process.procesoId };
    activity.EventoCatalogoId = { Id: activity.EventoCatalogoId };
    const fechaInicio = this.combineDateAndTime(activity.FechaInicio, this.activityForm.get('HoraInicio')?.value);
    const fechaFin = this.combineDateAndTime(activity.FechaFin, this.activityForm.get('HoraFin')?.value);
    if (fechaFin.isBefore(fechaInicio)) {
      this.popUpManager.showErrorToast(this.t('calendario.fecha_fin_posterior_inicio'));
      return null;
    }
    activity.FechaInicio = this.formatGmtMinus5(fechaInicio);
    activity.FechaFin = this.formatGmtMinus5(fechaFin);
    activity.Activo = true;
    delete activity.HoraInicio;
    delete activity.HoraFin;
    return activity;
  }

  selectedPublicPayload() {
    const data = this.tableSource instanceof MatTableDataSource ? this.tableSource.data : this.tableSource;
    return Array.isArray(data) ? data.map((item: any) => ({ responsableID: item.Id, Activo: item.Activo !== false })) : [];
  }

  saveGlobalDates() {
    if (this.data.editActivity === undefined) {
      this.saveActivity();
      return;
    }
    const activity = this.buildActivityPayload();
    if (activity === null) {
      return;
    }
    const actividadId = this.data.editActivity.actividadId || this.data.editActivity.Id;
    this.sgaCalendarioMidService.put('actividad-calendario/calendario/actividad/' + actividadId, { Id: actividadId, actividad: activity }).subscribe(
      () => this.popUpManager.showSuccessAlert(this.t('calendario.fechas_globales_actualizadas')),
      (error: any) => this.popUpManager.showErrorToast(error?.error?.Message || error?.error?.Data || error?.Message || error?.message || this.t('calendario.error_actualizar_fechas_globales')),
    );
  }

  savePublicSelection() {
    const responsables = this.selectedPublicPayload();
    if (this.data.editActivity === undefined) {
      if (responsables.length === 0) {
        this.popUpManager.showErrorAlert(this.translate.instant('calendario.no_publico'));
        return;
      }
      this.saveActivity();
      return;
    }
    const actividadId = this.data.editActivity.actividadId || this.data.editActivity.Id;
    this.sgaCalendarioMidService.put('actividad-calendario/calendario/actividad/' + actividadId, { Id: actividadId, resp: responsables }).subscribe(
      () => this.popUpManager.showSuccessAlert(this.t('calendario.publico_dirigido_actualizado')),
      (error: any) => this.popUpManager.showErrorToast(error?.error?.Message || error?.message || this.t('calendario.error_actualizar_publico_dirigido')),
    );
  }

  persistPublicSelection(previousData?: any[]) {
    if (this.data.editActivity === undefined) {
      return;
    }
    const actividadId = this.data.editActivity.actividadId || this.data.editActivity.Id;
    this.sgaCalendarioMidService.put('actividad-calendario/calendario/actividad/' + actividadId, { Id: actividadId, resp: this.selectedPublicPayload() }).subscribe(
      () => {
        this.data.editActivity.responsables = this.selectedPublicPayload();
      },
      (error: any) => {
        if (previousData) {
          this.tableSource.data = previousData;
          this.tableSource._updateChangeSubscription();
          this.refreshAvailableResponsables();
        }
        this.popUpManager.showErrorToast(error?.error?.Message || error?.message || this.t('calendario.error_actualizar_publico_dirigido'));
      },
    );
  }

  closeDialog() {
    this.dialogRef.close();
  }

  createActivityForm() {
    this.activityForm = this.builder.group({
      EventoCatalogoId: [null, Validators.required],
      FechaInicio: ['', Validators.required],
      FechaFin: ['', Validators.required],
      HoraInicio: ['00:00', Validators.required],
      HoraFin: ['23:59', Validators.required],
    })
  }

  fetchSelectData(periodo: any) {
    //si tiene multiple periodo
    if (Array.isArray(periodo)) {
      const observables = periodo.map(p => this.parametrosService.get(`periodo/${p}`));
      forkJoin(observables).subscribe((responses: any[]) => {
        const periodos = responses.map(res => res['Data']['Nombre']);
        periodos.sort();
        this.period = periodos.join(', ');
      });

    } else {
      this.parametrosService.get('periodo/' + periodo).subscribe(
        (response: any) => this.period = response['Data']['Nombre'],
      );
    }
    this.updateSelect();
  }

  updateSelect() {
    this.loadPublicTypes();

    const procesoCatalogoId = this.getCatalogId(this.data.process?.ProcesoCatalogoId || this.data.editActivity?.ProcesoId?.ProcesoCatalogoId);
    this.ensureProcessCatalogLoaded(procesoCatalogoId);
    if (procesoCatalogoId === null) {
      this.eventosCatalogo = [];
      this.ensureSelectedEventoCatalogoLoaded();
      return;
    }

    this.eventoService.get('evento_catalogo_proceso_catalogo?query=Activo:true,ProcesoCatalogoId__Id:' + procesoCatalogoId + '&limit=0').subscribe(
      (data: any) => {
        const relaciones = Array.isArray(data) ? data : [];
        this.eventosCatalogo = relaciones
          .filter((relacion: any) => relacion.EventoCatalogoId !== undefined && relacion.EventoCatalogoId !== null && relacion.EventoCatalogoId.Activo === true)
          .map((relacion: any) => relacion.EventoCatalogoId);
        this.ensureSelectedEventoCatalogoLoaded();
      },
      (error: any) => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      },
    );
  }

  loadPublicTypes() {
    this.configuracionService.get('aplicacion/?query=Alias:SGA_MF&limit=1').subscribe(
      (applications: any) => {
        const applicationId = Array.isArray(applications) && applications.length > 0 ? (applications[0].Id || applications[0].id) : null;
        if (!applicationId) {
          this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
          return;
        }
        this.configuracionService.get('perfil/?query=Aplicacion.Id:' + applicationId + '&limit=0').subscribe(
          (profiles: any) => this.setPublicTypesFromProfiles(profiles),
          () => this.popUpManager.showErrorToast(this.translate.instant('ERROR.general')),
        );
      },
      () => this.popUpManager.showErrorToast(this.translate.instant('ERROR.general')),
    );
  }

  setPublicTypesFromProfiles(profiles: any) {
    const normalizedProfiles = Array.isArray(profiles) ? profiles.map((profile: any) => ({
      Id: profile.Id || profile.id,
      Nombre: profile.Nombre || profile.nombre,
      CodigoAbreviacion: profile.Nombre || profile.nombre,
      Activo: true,
    })).filter((profile: any) => profile.Id && profile.Nombre) : [];
    this.tiposPublico = normalizedProfiles;
    this.responsables = normalizedProfiles;
    if (this.data.editActivity !== undefined && this.data.editActivity.responsables !== undefined && this.data.editActivity.responsables !== null) {
      const responsablesSeleccionados = this.responsables
        .filter((resp: any) => this.data.editActivity.responsables.some((resp2: any) => Number(resp2.responsableID) === Number(resp.Id)))
        .map((resp: any) => {
          const responsableGuardado = this.data.editActivity.responsables.find((resp2: any) => Number(resp2.responsableID) === Number(resp.Id));
          return { ...resp, Activo: responsableGuardado?.Activo !== false };
        });
      this.tableSource = new MatTableDataSource(responsablesSeleccionados);
    }
    this.refreshAvailableResponsables();
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

  deletePublic(row: any) {
    this.tableSource.data = this.tableSource.data.filter((publico: any) => Number(publico.Id) !== Number(row.Id));
    this.tableSource._updateChangeSubscription();
    this.refreshAvailableResponsables();
  }

  onSelectChange(event: any) {
    if (this.tableSource.data.some((row: any) => Number(row.Id) === Number(event.value))) {
      this.popUpManager.showErrorToast(this.translate.instant('calendario.publico_repetido'));
      return;
    }
    const data: any = this.responsables.filter((row: any) => Number(row.Id) === Number(event.value))[0]
    if (data === undefined) {
      return;
    }
    this.tableSource.data.push({ ...data, Activo: true });
    this.tableSource._updateChangeSubscription();
    this.selectedResponsableId = null;
    this.refreshAvailableResponsables();


  }

  togglePublic(row: any, active: boolean) {
    row.Activo = active;
    this.tableSource._updateChangeSubscription();
  }

  refreshAvailableResponsables() {
    const selectedIds = new Set((this.tableSource.data || []).map((row: any) => Number(row.Id)));
    this.availableResponsables = this.responsables.filter((resp: any) => !selectedIds.has(Number(resp.Id)));
  }

  getCatalogId(eventoCatalogo: any) {
    if (eventoCatalogo === undefined || eventoCatalogo === null) {
      return null;
    }
    return eventoCatalogo.Id !== undefined ? eventoCatalogo.Id : eventoCatalogo;
  }

  resolveProcessName() {
    return this.data.process?.Nombre
      || this.data.process?.Proceso
      || this.data.process?.NombreProceso
      || this.data.editActivity?.ProcesoNombre
      || this.data.process?.ProcesoCatalogoId?.Nombre
      || this.data.editActivity?.ProcesoId?.ProcesoCatalogoId?.Nombre
      || '-';
  }

  resolveProcessDescription() {
    return this.data.process?.Descripcion
      || this.data.process?.DescripcionProceso
      || this.data.process?.ProcesoCatalogoId?.Descripcion
      || this.data.editActivity?.ProcesoId?.ProcesoCatalogoId?.Descripcion
      || '-';
  }

  ensureProcessCatalogLoaded(procesoCatalogoId: any) {
    if (this.processName !== '-' && this.processDescription !== '-') {
      return;
    }
    if (procesoCatalogoId === null || procesoCatalogoId === undefined) {
      this.ensureProcessLoaded();
      return;
    }
    this.eventoService.get('proceso_catalogo/' + procesoCatalogoId).subscribe(
      (procesoCatalogo: any) => {
        this.setProcessCatalogContext(procesoCatalogo);
      },
      () => {}
    );
  }

  ensureProcessLoaded() {
    const processId = this.getCatalogId(this.data.process?.procesoId || this.data.process?.Id || this.data.editActivity?.ProcesoId);
    if (processId === null || processId === undefined) {
      return;
    }
    this.eventoService.get('proceso?query=Id:' + processId + '&limit=1').subscribe(
      (procesos: any) => {
        const proceso = Array.isArray(procesos) ? procesos[0] : procesos;
        if (!proceso || proceso.Type === 'error') {
          return;
        }
        this.setProcessCatalogContext(proceso.ProcesoCatalogoId);
      },
      () => {}
    );
  }

  setProcessCatalogContext(procesoCatalogo: any) {
    if (procesoCatalogo?.Nombre && this.processName === '-') {
      this.processName = procesoCatalogo.Nombre;
    }
    if (procesoCatalogo?.Descripcion) {
      this.processDescription = procesoCatalogo.Descripcion;
    }
  }

  parseActivityDate(date: any) {
    const parsedDate = this.parseFlexibleDate(date);
    return parsedDate.isValid() ? this.localDateFromMoment(parsedDate) : moment(date).toDate();
  }

  activityStartDateValue() {
    return this.data.editActivity?.FechaInicioOriginal || this.data.editActivity?.FechaInicio;
  }

  activityEndDateValue() {
    return this.data.editActivity?.FechaFinOriginal || this.data.editActivity?.FechaFin;
  }

  parseActivityTime(date: any) {
    const parsedDate = this.parseFlexibleDate(date);
    return parsedDate.isValid() ? parsedDate.format('HH:mm') : '00:00';
  }

  parseFlexibleDate(date: any) {
	const value = this.extractDateValue(date);
	return moment.parseZone(value, [
	  moment.ISO_8601,
	  'YYYY-MM-DDTHH:mm:ss[Z]',
      'YYYY-MM-DDTHH:mm:ssZ',
      'YYYY-MM-DDTHH:mm:ss',
      'YYYY-MM-DD HH:mm:ss ZZ',
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DD',
      'DD/MM/YYYY HH:mm',
      'DD/MM/YYYY',
      'DD-MM-YYYY HH:mm',
      'DD-MM-YYYY',
	], true);
  }

  localDateFromMoment(date: moment.Moment) {
    return new Date(date.year(), date.month(), date.date());
  }

  extractDateValue(date: any): any {
    if (date === null || date === undefined || date instanceof Date || typeof date === 'string' || typeof date === 'number') {
      return typeof date === 'string' ? this.cleanDateText(date) : date;
    }
    return this.extractDateValue(date.FechaFin || date.fecha_fin || date.FechaInicio || date.fecha_inicio || date.Time || date.time || date.String || date.string || '');
  }

  cleanDateText(date: string): string {
    return date.trim()
      .replace(/ ([+-]\d{4}) [+-]\d{4}$/, '')
      .replace(/([T ]\d{2}:\d{2}:\d{2})(?:\.\d+)?\s+[+-]\d{4}$/, '$1')
      .replace(/([T ]\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/, '$1');
  }

  combineDateAndTime(date: any, time: string) {
    const parsedDate = moment(date);
    const [hours, minutes] = (time || '00:00').split(':').map((value: string) => Number(value));
    return parsedDate.hours(hours || 0).minutes(minutes || 0).seconds(0).milliseconds(0);
  }

  formatGmtMinus5(date: moment.Moment) {
    return date.clone().format('YYYY-MM-DDTHH:mm:ss');
  }

  t(key: string, params?: any) {
    return this.translate.instant(key, params);
  }

  ensureSelectedEventoCatalogoLoaded() {
    const eventoCatalogoId = this.getCatalogId(this.data.editActivity?.EventoCatalogoId);
    if (eventoCatalogoId === null || this.eventosCatalogo.some((evento: any) => evento.Id === eventoCatalogoId)) {
      return;
    }
    this.eventoService.get('evento_catalogo/' + eventoCatalogoId).subscribe(
      (eventoCatalogo: any) => {
        if (eventoCatalogo !== null && eventoCatalogo.Type !== 'error' && eventoCatalogo.Activo === true) {
          this.eventosCatalogo = [...this.eventosCatalogo, eventoCatalogo];
        }
      },
      (error: any) => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      },
    );
  }

  getSelectedEventoCatalogo() {
    const catalogoId = this.activityForm?.get('EventoCatalogoId')?.value;
    return this.eventosCatalogo.find((evento: any) => evento.Id === catalogoId);
  }

  activityTitle() {
    return this.data.editActivity?.Nombre || this.getSelectedEventoCatalogo()?.Nombre || '';
  }

  activityDescription() {
    return this.getSelectedEventoCatalogo()?.Descripcion
      || this.data.editActivity?.EventoCatalogoId?.Descripcion
      || this.data.editActivity?.Descripcion
      || '-';
  }

}
