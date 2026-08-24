import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

import { PopUpManager } from '../../managers/popUpManager';
import * as moment from 'moment';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SgaCalendarioMidService } from '../../services/sga_calendario_mid.service';
import { ConfiguracionService } from 'src/app/services/configuracion.service';
import { CalendarioFiltroOption, CalendarioFiltrosAlcanceService } from 'src/app/services/calendario-filtros-alcance.service';



@Component({
  selector: 'edicion-actividades-programas',
  templateUrl: './edicion-actividades-programas.component.html',
  styleUrls: ['./edicion-actividades-programas.component.scss']
})
export class EdicionActividadesProgramasComponent implements OnInit {

  select_proyectos_act: boolean = false;
  actividad_detalle_proyectos: boolean = false;
  vista: string;
  projects!: any[];
  facultades: CalendarioFiltroOption[] = [];
  facultadSeleccionada: number | null = null;
  actividad: string = "";
  descripcion_actividad: string = "";
  proceso_detalle: boolean = false;
  editar_actividad: boolean = false;
  nombre_proceso: string = "";
  descripcion_proceso: string = "";
  periodicidad_proceso: string = "";
  periodo: string = "";
  fecha_inicio_org: string = "";
  fecha_fin_org: string = "";
  fecha_inicio_permitida!: Date;
  fecha_fin_permitida!: Date;
  displayedColumns: string[] = ['ProyectoCurricular', 'FechaInicio', 'FechaFin','FechaEdicion' ];
  responsableDisplayedColumns: string[] = ['Nombre'];
  dataSource!: MatTableDataSource<any>;
  dataSource2!: MatTableDataSource<any>
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  settings!: Object;


  settings2!: Object;
  //dataSource2!: LocalDataSource;

  SelectorDeps!: FormGroup;
  ActivityEditor!: FormGroup;
  ActividadEditable: boolean = false;
  programasAsociados: number = 0;
  filtroProgramasAsociados: string = '';
  filtroProgramasDisponibles: string = '';
  programasOriginales: number[] = [];

  constructor(
    private filtrosAlcanceService: CalendarioFiltrosAlcanceService,
    private popUpManager: PopUpManager,
    private builder: FormBuilder,
    private translate: TranslateService,
    private sgaCalendarioMidService: SgaCalendarioMidService,
    private configuracionService: ConfiguracionService,
    public dialogRef: MatDialogRef<EdicionActividadesProgramasComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.vista = this.data.vista;
    if(this.vista == "select"){
      this.select_proyectos_act = true;
      this.actividad_detalle_proyectos = false;
      this.proceso_detalle = false;
      this.editar_actividad = false;
    }
    if(this.vista == "view"){
      this.select_proyectos_act = false;
      this.actividad_detalle_proyectos = true;
      this.proceso_detalle = false;
      this.editar_actividad = false;
    }
    if(this.vista == "process"){
      this.select_proyectos_act = false;
      this.actividad_detalle_proyectos = false;
      this.proceso_detalle = true;
      this.editar_actividad = false;
    }
    if(this.vista == "edit_act"){
      this.select_proyectos_act = false;
      this.actividad_detalle_proyectos = false;
      this.proceso_detalle = false;
      this.editar_actividad = true;
    }
    this.dialogRef.backdropClick().subscribe(() => this.closeDialog());
  }

  ngOnInit() {

    // Seleccion de proyectos a editar fechas actividades
    if (this.select_proyectos_act) {
      this.SelectorDeps = this.builder.group({
        Dependencias: ['', Validators.required],
      });
      this.projects = this.programasAsociadosCalendario(this.data.dependencias, this.data.calendar);
      this.cargarFacultades();
 
      let dependenciasJSON = this.normalizarDependenciaId(this.data.activity.DependenciaId);
      const programasPermitidos = new Set(this.projects.map((project: any) => Number(project.Id)));
      dependenciasJSON.proyectos = dependenciasJSON.proyectos.filter((id: any) => programasPermitidos.has(Number(id)));
      dependenciasJSON.fechas = dependenciasJSON.fechas.filter((fecha: any) => programasPermitidos.has(Number(fecha.Id)));
      this.data.activity.DependenciaId = dependenciasJSON;
      this.SelectorDeps.patchValue({
        Dependencias: dependenciasJSON.proyectos,
      })
      this.programasOriginales = dependenciasJSON.proyectos.map((id: any) => Number(id));
      this.programasAsociados = dependenciasJSON.proyectos.length;
      this.SelectorDeps.controls['Dependencias'].valueChanges.subscribe((value: any[]) => {
        this.programasAsociados = Array.isArray(value) ? value.length : 0;
      });
    }

    if(this.actividad_detalle_proyectos){
      this.actividad = this.data.activity.Nombre;
      this.descripcion_actividad = this.data.activity.Descripcion;
      let deps = this.normalizarDependenciaId(this.data.activity.DependenciaId);
      this.data.activity.DependenciaId = deps;
      let tablaFechas: any[] = [];
      deps.fechas.forEach((fdep: { Id: any; Inicio: moment.MomentInput; Fin: moment.MomentInput; Modificacion: moment.MomentInput; }) => {
        tablaFechas.push({
          ProyectoCurricular: this.data.projects.find((p: { Id: any; }) => p.Id == fdep.Id).Nombre,
          FechaInicio:  this.parseDisplayDate(fdep.Inicio).format('DD/MM/YYYY HH:mm'),
          FechaFin: this.parseDisplayDate(fdep.Fin).format('DD/MM/YYYY HH:mm'),
          FechaEdicion: this.parseDisplayDate(fdep.Modificacion).format('DD/MM/YYYY'),
        })
      })
      this.dataSource = new MatTableDataSource(tablaFechas);
    
    }
    if(this.proceso_detalle){
      this.nombre_proceso = this.data.process.Nombre;
      this.descripcion_proceso = this.data.process.Descripcion;
      this.periodicidad_proceso = this.data.process.TipoRecurrenciaId.Nombre;
    }
    if(this.editar_actividad){
      this.data.activity.DependenciaId = this.normalizarDependenciaId(this.data.activity.DependenciaId);
      this.ActividadEditable = this.data.activity.Editable;
      this.ActivityEditor = new FormGroup({
          fecha_inicio_org: new FormControl({ value: '', disabled: true }),
          fecha_fin_org: new FormControl({ value: '', disabled: true }),
          hora_inicio_org: new FormControl({ value: '', disabled: true }),
          hora_fin_org: new FormControl({ value: '', disabled: true }),
          fecha_inicio_new: new FormControl(''),
          fecha_fin_new: new FormControl(''),
          hora_inicio_new: new FormControl('00:00'),
          hora_fin_new: new FormControl('23:59'),
      });
      this.nombre_proceso = this.data.process.Nombre;
      this.periodo = this.data.periodo;
      this.actividad = this.data.activity.Nombre;
      this.descripcion_actividad = this.data.activity.Descripcion;
      this.fecha_inicio_org = this.data.activity.FechaInicioOrg;
      this.fecha_fin_org = this.data.activity.FechaFinOrg;
      this.fecha_inicio_permitida = this.localDateFromMoment(this.parseDisplayDate(this.fecha_inicio_org));
      this.fecha_fin_permitida = this.localDateFromMoment(this.parseDisplayDate(this.fecha_fin_org));
      this.dataSource2 = new MatTableDataSource<any>([])
      this.cargarPublicoDirigidoConfiguracion();
      this.ActivityEditor.patchValue({
        fecha_inicio_org: this.localDateFromMoment(this.parseDisplayDate(this.fecha_inicio_org)),
        fecha_fin_org: this.localDateFromMoment(this.parseDisplayDate(this.fecha_fin_org)),
        hora_inicio_org: this.parseDisplayDate(this.fecha_inicio_org).format('HH:mm'),
        hora_fin_org: this.parseDisplayDate(this.fecha_fin_org).format('HH:mm'),
        fecha_inicio_new: this.localDateFromMoment(this.parseDisplayDate(this.data.activity.FechaInicio)),
        fecha_fin_new: this.localDateFromMoment(this.parseDisplayDate(this.data.activity.FechaFin)),
        hora_inicio_new: this.parseDisplayDate(this.data.activity.FechaInicio).format('HH:mm'),
        hora_fin_new: this.parseDisplayDate(this.data.activity.FechaFin).format('HH:mm'),
      });
      this.cargarRangoPermitidoDependencia();
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  regresar() {
    this.dialogRef.close();
  }

  dialogTitle(): string {
    if (this.select_proyectos_act) {
      return this.translate.instant('calendario.select_proyectos_actividades');
    }
    if (this.actividad_detalle_proyectos) {
      return `${this.translate.instant('calendario.actividad')}: ${this.actividad || ''}`;
    }
    if (this.proceso_detalle) {
      return this.translate.instant('calendario.proceso');
    }
    return this.translate.instant('calendario.edicion_actividades');
  }

  dialogSubtitle(): string {
    if (this.editar_actividad) {
      return [this.nombre_proceso, this.periodo].filter(Boolean).join(' - ');
    }
    return this.actividad_detalle_proyectos ? this.descripcion_actividad : '';
  }

  guardar() {
    if (this.select_proyectos_act) {
      let selected_deps = this.programasSeleccionados();
      const lockedPrograms = this.programasOriginales.filter((programaId) => !selected_deps.includes(programaId) && this.programaNoDesasociable(programaId));
      if (lockedPrograms.length > 0) {
        this.popUpManager.showErrorToast(this.translate.instant('calendario.programas_no_desasociables'));
        return;
      }
      let updated_deps = this.buildJSONdeps(this.data.activity.DependenciaId,selected_deps)
      this.popUpManager.showConfirmAlert(this.translate.instant('calendario.seguro_programas_evento'))
        .then((ok) => {
          if (ok.value) {
            this.dialogRef.close({UpdateDependencias: updated_deps})
          }
        });
    }
    if(this.editar_actividad){
      const fechaInicioNueva = this.combineDateAndTime(this.ActivityEditor.controls['fecha_inicio_new'].value, this.ActivityEditor.controls['hora_inicio_new'].value);
      const fechaFinNueva = this.combineDateAndTime(this.ActivityEditor.controls['fecha_fin_new'].value, this.ActivityEditor.controls['hora_fin_new'].value);
      const fechaInicioPermitida = this.combineDateAndTime(this.ActivityEditor.controls['fecha_inicio_org'].value, this.ActivityEditor.controls['hora_inicio_org'].value);
      const fechaFinPermitida = this.combineDateAndTime(this.ActivityEditor.controls['fecha_fin_org'].value, this.ActivityEditor.controls['hora_fin_org'].value);

      if (fechaInicioNueva.isBefore(fechaInicioPermitida) || fechaFinNueva.isAfter(fechaFinPermitida) || fechaFinNueva.isBefore(fechaInicioNueva)) {
        this.popUpManager.showErrorToast(this.translate.instant('calendario.fechas_particulares_fuera_rango'));
        return;
      }

      this.data.activity.DependenciaId.fechas.forEach((fd: { Id: any; Inicio: string; Fin: string; Modificacion: string; }) => {
        if(fd.Id == this.data.dependencia){
          fd.Inicio = this.formatGmtMinus5(fechaInicioNueva);
          fd.Fin = this.formatGmtMinus5(fechaFinNueva);
          fd.Modificacion = this.nowGmtMinus5();
        }
      });
      this.dialogRef.close({UpdateDependencias: this.data.activity.DependenciaId})
    }
  }

  cargarRangoPermitidoDependencia() {
    const actividadId = this.data.activity.actividadId || this.data.activity.Id;
    const dependenciaId = this.data.dependencia;
    if (!actividadId || !dependenciaId) {
      return;
    }

    this.sgaCalendarioMidService.get('actividad-calendario/' + actividadId + '/rango-dependencia/' + dependenciaId).subscribe(
      (response: any) => {
        const rango = response?.Data || response;
        const rangoPermitido = rango?.RangoPermitido || rango?.rango_permitido || rango;
        const fechaInicio = rangoPermitido?.FechaInicio || rangoPermitido?.fecha_inicio;
        const fechaFin = rangoPermitido?.FechaFin || rangoPermitido?.fecha_fin;
        if (!fechaInicio || !fechaFin) {
          return;
        }
        const fechaInicioPermitida = this.parseDisplayDate(fechaInicio);
        const fechaFinPermitida = this.parseDisplayDate(fechaFin);
        this.fecha_inicio_permitida = this.localDateFromMoment(fechaInicioPermitida);
        this.fecha_fin_permitida = this.localDateFromMoment(fechaFinPermitida);
        this.ActivityEditor.patchValue({
          fecha_inicio_org: this.fecha_inicio_permitida,
          fecha_fin_org: this.fecha_fin_permitida,
          hora_inicio_org: fechaInicioPermitida.format('HH:mm'),
          hora_fin_org: fechaFinPermitida.format('HH:mm'),
        });
      },
      () => {
        this.popUpManager.showErrorToast(this.translate.instant('calendario.error_consultar_rango_programa'));
      }
    );
  }

  cargarPublicoDirigidoConfiguracion() {
    this.configuracionService.get('aplicacion/?query=Alias:SGA_MF&limit=1').subscribe(
      (aplicaciones: any) => {
        const aplicacion = Array.isArray(aplicaciones) && aplicaciones.length > 0 ? aplicaciones[0] : null;
        const aplicacionId = Number(aplicacion?.Id || aplicacion?.id || 0);
        if (!aplicacionId) {
          this.dataSource2 = new MatTableDataSource(this.normalizarPublicoDirigido([]));
          return;
        }
        this.configuracionService.get('perfil/?query=Aplicacion.Id:' + aplicacionId + '&limit=0').subscribe(
          (perfiles: any) => this.dataSource2 = new MatTableDataSource(this.normalizarPublicoDirigido(Array.isArray(perfiles) ? perfiles : [])),
          () => this.dataSource2 = new MatTableDataSource(this.normalizarPublicoDirigido([])),
        );
      },
      () => this.dataSource2 = new MatTableDataSource(this.normalizarPublicoDirigido([])),
    );
  }

  normalizarPublicoDirigido(perfiles: any[]) {
    const perfilesMap = new Map<number, any>();
    perfiles.forEach((perfil: any) => {
      const id = Number(perfil.Id || perfil.id || 0);
      if (id > 0) {
        perfilesMap.set(id, perfil);
      }
    });
    const responsables = Array.isArray(this.data.activity.responsables) ? this.data.activity.responsables : [];
    return responsables.map((responsable: any) => {
      const id = Number(responsable.responsableID || responsable.PerfilId || responsable.Id || responsable.id || 0);
      const perfil = perfilesMap.get(id);
      return {
        responsableID: id,
        Nombre: perfil?.Nombre || perfil?.nombre || responsable.Nombre || responsable.nombre || (id ? `Perfil ${id}` : '-'),
        Activo: responsable.Activo !== false,
      };
    });
  }
  

  buildJSONdeps(OrgDeps: any, NewSelect: Number[]) {
    OrgDeps = this.normalizarDependenciaId(OrgDeps);
    let output: any[] = [];
    NewSelect.forEach(sel => {
      let fe = OrgDeps.fechas.find((f: { Id: Number; }) => f.Id == sel)
      if (fe == undefined) {
        fe = { 
          Id: sel, 
          Inicio: this.formatGmtMinus5(this.parseDisplayDate(this.data.activity.FechaInicio)),
          Fin: this.formatGmtMinus5(this.parseDisplayDate(this.data.activity.FechaFin)),
          Modificacion: this.nowGmtMinus5(),
          Activo: true
        }
      }
      output.push(fe)
    })
    OrgDeps.proyectos = NewSelect;
    OrgDeps.fechas = output;
    return OrgDeps
  }

  programasSeleccionados(): number[] {
    const value = this.SelectorDeps?.controls['Dependencias']?.value;
    return Array.isArray(value) ? value.map((id: any) => Number(id)) : [];
  }

  programasAsociadosFiltrados() {
    const seleccionados = this.programasSeleccionados();
    return this.projectsFiltrados(this.filtroProgramasAsociados).filter((project) => seleccionados.includes(Number(project.Id)));
  }

  programasDisponiblesFiltrados() {
    const seleccionados = this.programasSeleccionados();
    return this.projectsFiltrados(this.filtroProgramasDisponibles).filter((project) => !seleccionados.includes(Number(project.Id)));
  }

  projectsFiltrados(filtro: string) {
    const normalizedFilter = (filtro || '').toLowerCase().trim();
    const projects = this.filtrosAlcanceService.filtrarProgramasPorFacultad(this.projects, this.facultadSeleccionada);
    if (!normalizedFilter) {
      return projects;
    }
    return projects.filter((project) => `${project.Nombre || ''} ${project.Id || ''}`.toLowerCase().includes(normalizedFilter));
  }

  private programasAsociadosCalendario(programas: any[], calendario: any): any[] {
    const disponibles = Array.isArray(programas) ? programas : [];
    if (calendario?.DependenciaId === undefined || calendario?.DependenciaId === null) {
      return disponibles;
    }
    const dependencia = this.normalizarDependenciaId(calendario?.DependenciaId);
    const idsCalendario = new Set(dependencia.proyectos.map((id: any) => Number(id)));
    return disponibles.filter((programa: any) => idsCalendario.has(Number(programa.Id)));
  }

  private async cargarFacultades() {
    this.facultades = await this.filtrosAlcanceService.facultadesDeProgramas(this.projects);
  }

  togglePrograma(programaId: number, checked: boolean) {
    const seleccionados = this.programasSeleccionados();
    if (!checked && this.programaNoDesasociable(programaId)) {
      this.popUpManager.showErrorToast(this.translate.instant('calendario.programa_no_desasociable'));
      return;
    }
    const nextValue = checked
      ? Array.from(new Set([...seleccionados, Number(programaId)]))
      : seleccionados.filter((id) => id !== Number(programaId));
    this.SelectorDeps.controls['Dependencias'].setValue(nextValue);
  }

  programaNoDesasociable(programaId: number) {
    const programaOriginal = this.programasOriginales.includes(Number(programaId));
    return programaOriginal && (this.tieneFechaParticularModificada(programaId) || this.tieneExtensionVigente(programaId));
  }

  motivoBloqueoPrograma(programaId: number) {
    if (this.tieneFechaParticularModificada(programaId) && this.tieneExtensionVigente(programaId)) {
      return this.translate.instant('calendario.programa_bloqueado_fechas_extension');
    }
    if (this.tieneFechaParticularModificada(programaId)) {
      return this.translate.instant('calendario.programa_bloqueado_fechas');
    }
    if (this.tieneExtensionVigente(programaId)) {
      return this.translate.instant('calendario.programa_bloqueado_extension');
    }
    return '';
  }

  tieneFechaParticularModificada(programaId: number) {
    const deps = this.normalizarDependenciaId(this.data.activity.DependenciaId);
    const fecha = deps.fechas.find((item: any) => Number(item.Id) === Number(programaId));
    if (!fecha) {
      return false;
    }
    const inicioGlobal = this.parseDisplayDate(this.data.activity.FechaInicio);
    const finGlobal = this.parseDisplayDate(this.data.activity.FechaFin);
    const inicioParticular = this.parseDisplayDate(fecha.Inicio);
    const finParticular = this.parseDisplayDate(fecha.Fin);
    return !inicioParticular.isSame(inicioGlobal) || !finParticular.isSame(finGlobal);
  }

  tieneExtensionVigente(programaId: number) {
    const extensiones = Array.isArray(this.data.activity.Extensiones) ? this.data.activity.Extensiones : [];
    return extensiones.some((extension: any) => {
      const relaciones = extension.Programas || extension.Dependencias || [];
      return Array.isArray(relaciones) && relaciones.some((relacion: any) => {
        const dependenciaId = Number(relacion.DependenciaId || relacion.Id || relacion);
        return dependenciaId === Number(programaId) && relacion.Vigente !== false && relacion.Activo !== false;
      });
    });
  }

  normalizarDependenciaId(dependencia: any) {
    if (!dependencia || dependencia === '{}' || dependencia === '') {
      return { proyectos: [], fechas: [] };
    }
    if (typeof dependencia === 'string') {
      try {
        dependencia = JSON.parse(dependencia);
      } catch (_e) {
        return { proyectos: [], fechas: [] };
      }
    }
    if (!Array.isArray(dependencia.proyectos)) {
      dependencia.proyectos = dependencia.proyectos ? [dependencia.proyectos] : [];
    }
    if (!Array.isArray(dependencia.fechas)) {
      dependencia.fechas = [];
    }
    return dependencia;
  }

  parseDisplayDate(date: any) {
    const value = this.extractDateValue(date);
    const parsedDate = moment.parseZone(value, [
      moment.ISO_8601,
      'YYYY-MM-DDTHH:mm:ss[Z]',
      'YYYY-MM-DDTHH:mm:ssZ',
      'YYYY-MM-DDTHH:mm:ss',
      'YYYY-MM-DD HH:mm:ss ZZ',
      'YYYY-MM-DD HH:mm:ss Z',
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD HH:mm',
      'DD/MM/YYYY HH:mm',
      'DD/MM/YYYY',
      'DD-MM-YYYY HH:mm',
      'DD-MM-YYYY',
    ], true);
    return parsedDate.isValid() ? parsedDate : moment.parseZone(value);
  }

  extractDateValue(date: any): any {
    if (date === null || date === undefined) {
      return '';
    }
    if (date instanceof Date || typeof date === 'number') {
      return date;
    }
    if (typeof date === 'string') {
      return this.cleanDateText(date);
    }
    return this.extractDateValue(date.FechaFin || date.fecha_fin || date.FechaInicio || date.fecha_inicio || date.Time || date.time || date.String || date.string || '');
  }

  cleanDateText(date: string): string {
    return date.trim()
      .replace(/ ([+-]\d{4}) [+-]\d{4}$/, '')
      .replace(/([T ]\d{2}:\d{2}:\d{2})(?:\.\d+)?\s+[+-]\d{4}$/, '$1')
      .replace(/([T ]\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/, '$1');
  }

  localDateFromMoment(date: moment.Moment) {
    return new Date(date.year(), date.month(), date.date());
  }

  combineDateAndTime(date: any, time: string) {
    const parsedDate = moment(date);
    const [hours, minutes] = (time || '00:00').split(':').map((value: string) => Number(value));
    return parsedDate.hours(hours || 0).minutes(minutes || 0).seconds(0).milliseconds(0);
  }

  formatGmtMinus5(date: moment.Moment) {
    return date.clone().format('YYYY-MM-DDTHH:mm:ss');
  }

  nowGmtMinus5() {
    return moment().format('YYYY-MM-DDTHH:mm:ss');
  }



}
