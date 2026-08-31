import { Component, Input, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
//import { LocalDataSource } from 'ng2-smart-table';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActividadCalendarioAcademicoComponent } from '../actividad-calendario-academico/actividad-calendario-academico.component';
import { Proceso } from 'src/app/models/calendario-academico/proceso';
import { Calendario } from 'src/app/models/calendario-academico/calendario';
import { TranslateService } from '@ngx-translate/core';
//import { NuxeoService } from 'src/app/services/nuxeo.service';
import { PopUpManager } from 'src/app/managers/popUpManager';
import * as moment from 'moment';
import { Actividad } from 'src/app/models/calendario-academico/actividad';
import { NewNuxeoService } from 'src/app/services/new_nuxeo.service';
import { MatTableDataSource } from '@angular/material/table';
import { SgaCalendarioMidService } from 'src/app/services/sga_calendario_mid.service';
import { CalendarioActualizacionService } from 'src/app/services/calendario-actualizacion.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'detalle-calendario',
  templateUrl: './detalle-calendario.component.html',
  styleUrls: ['./detalle-calendario.component.scss'],
})
export class DetalleCalendarioComponent implements OnInit, OnChanges, OnDestroy {

  activetab: boolean = false;
  calendarForEditId: number = 0;
  dataSource: any;
  data: any;
  processSettings: any;
  activitiesSettings: any;
  idDetalle: any
  processes!: Proceso[];
  calendar!: Calendario;
  //processTable!: LocalDataSource;
  displayedColumnsActividades: string[] = ["Nombre", "Descripcion", "FechaInicio", "FechaFin", "Activo"]
  fileResolucion: any;
  calendarForm!: FormGroup;
  responsable!: string;
  private readonly destroy$ = new Subject<void>();

  @Input()
  calendarForProject: string = '0';
  @Input()
  projectId: number = 0;

  constructor(
    private sgaCalendarioMidService: SgaCalendarioMidService,
    private SgaCalendarioMidServide: SgaCalendarioMidService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private popUpManager: PopUpManager,
    private newNuxeoService: NewNuxeoService,
    private calendarioActualizacionService: CalendarioActualizacionService,
  ) {
    this.createActivitiesTable();
    this.calendarioActualizacionService.actualizacion$
      .pipe(takeUntil(this.destroy$))
      .subscribe((actualizacion) => {
        const calendarioActual = Number(this.calendar?.calendarioId || this.idDetalle || this.calendarForProject);
        if (calendarioActual > 0 && Number(actualizacion.calendarioId) === calendarioActual) {
          this.loadSelects(calendarioActual);
        }
      });
  }

  loadSelects(id: any) {
    this.processes = [];
    this.sgaCalendarioMidService.get('calendario-academico/v2/' + id).subscribe(
      (response: any) => {
        if (response != null && response.Success) {
          const calendar = response.Data[0];
          this.calendar = new Calendario();
          this.calendar.Nombre = calendar['Nombre'];
          this.calendar.ListaCalendario = calendar['ListaCalendario'];
          this.calendar.calendarioId = calendar['Id'];
          this.calendar.DocumentoId = calendar['resolucion']['Id'];
          this.calendar.resolucion = calendar['resolucion']['Resolucion'];
          this.calendar.anno = calendar['resolucion']['Anno'];
          this.calendar.Nivel = calendar['Nivel'];
          this.calendar.Activo = calendar['Activo'];
          this.calendar.PeriodoId = calendar['PeriodoId'];
          this.fileResolucion = calendar['resolucion']['Nombre'];
          const processes: any[] = calendar['proceso'];
          if (processes !== null) {
            processes.forEach(element => {
              if (Object.keys(element).length !== 0) {
                const loadedProcess: Proceso = new Proceso();
                loadedProcess.Nombre = element['Proceso'];
                loadedProcess.CalendarioId = { Id: this.calendar.calendarioId };
                loadedProcess.actividades = new MatTableDataSource<Actividad>;
                const activities: any[] = element['Actividades']
                if (activities !== null) {
                  activities.forEach(element => {
                    const loadedActivity = this.buildActivityForProject(element, loadedProcess);
                    if (loadedActivity !== null) {
                      loadedProcess.actividades.data.push(loadedActivity);
                    }
                  });
                  if (loadedProcess.actividades.data.length > 0) {
                    this.processes.push(loadedProcess);
                  }
                }
              }
            });
          }
        } else {
          this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
        }
      },
      (error: any) => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      },
    );
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      if (params.get('Id') !== null) {
        this.idDetalle = params.get('Id');
        this.loadSelects(this.idDetalle)
      }
    });
    this.createActivitiesTable();
  }

  ngOnChanges() {
    if (this.calendarForProject != '0') {
      this.loadSelects(this.calendarForProject);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cambiarCalendario(id: any) {
    this.loadSelects(id)
  }

  buildActivityForProject(element: any, loadedProcess: Proceso): Actividad | null {
    if (Object.keys(element).length === 0) {
      return null;
    }
    const dependenciaId = this.validJSONdeps(element['DependenciaId']);
    if (this.projectId > 0 && !this.actividadIncluyePrograma(dependenciaId, this.projectId)) {
      return null;
    }
    const fechasParticulares = this.projectId > 0
      ? this.findDatesforDep(dependenciaId, this.projectId)
      : undefined;
    const fechaInicio = fechasParticulares?.Inicio || element['FechaInicio'];
    const fechaFin = fechasParticulares?.Fin || element['FechaFin'];
    const loadedActivity: Actividad = new Actividad();
    loadedActivity.actividadId = element['actividadId'];
    loadedActivity.ProcesoId = { Id: element['ProcesoId']['Id'] };
    loadedActivity.EventoCatalogoId = element['EventoCatalogoId'];
    loadedActivity.Nombre = element['Nombre'];
    loadedActivity.Descripcion = element['Descripcion'];
    (loadedActivity as any).ProcesoNombre = loadedProcess.Nombre;
    loadedActivity.Activo = fechasParticulares !== undefined ? fechasParticulares.Activo : element['Activo'];
    loadedActivity.DependenciaId = dependenciaId;
    (loadedActivity as any).FechaInicioOriginal = element['FechaInicio'];
    (loadedActivity as any).FechaFinOriginal = element['FechaFin'];
    loadedActivity.FechaInicio = this.formatDateTimeLocal(fechaInicio);
    loadedActivity.FechaFin = this.formatDateTimeLocal(fechaFin);
    loadedActivity.responsables = element['Responsable'];
    loadedActivity.Extensiones = element['Extensiones'] || [];
    loadedProcess.procesoId = element['ProcesoId']['Id'];
    loadedProcess.Descripcion = element['ProcesoId']['ProcesoCatalogoId']['Descripcion'];
    loadedProcess.ProcesoCatalogoId = element['ProcesoId']['ProcesoCatalogoId'];
    loadedProcess.TipoRecurrenciaId = { Id: element['ProcesoId']['TipoRecurrenciaId']['Id'] };
    return loadedActivity;
  }

  validJSONdeps(dependencia: any) {
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

  actividadIncluyePrograma(listDeps: any, depId: number) {
    const proyectos = Array.isArray(listDeps?.proyectos) ? listDeps.proyectos : [];
    return proyectos.some((proyectoId: any) => Number(proyectoId) === Number(depId));
  }

  findDatesforDep(listDeps: any, depId: number) {
    const fechas = Array.isArray(listDeps?.fechas) ? listDeps.fechas : [];
    return fechas.find((fecha: any) => Number(fecha.Id) === Number(depId));
  }

  formatDateTimeLocal(date: any) {
    const parsed = moment.parseZone(date, [moment.ISO_8601, 'YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD HH:mm:ss', 'DD/MM/YYYY HH:mm'], true);
    return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : moment.parseZone(date).format('DD/MM/YYYY HH:mm');
  }

  createActivitiesTable() {
    this.activitiesSettings = {
      columns: {
        Nombre: {
          title: this.translate.instant('calendario.nombre'),
          witdh: '20%',
          editable: false,
          filter: false,
        },
        Descripcion: {
          title: this.translate.instant('GLOBAL.descripcion'),
          witdh: '20%',
          editable: false,
          filter: false,
        },
        FechaInicio: {
          title: this.translate.instant('calendario.fecha_inicio'),
          witdh: '20%',
          editable: false,
          filter: false,
          // valuePrepareFunction: (value) => value = moment(value).format('YYYY-MM-DD'),
        },
        FechaFin: {
          title: this.translate.instant('calendario.fecha_fin'),
          witdh: '20%',
          editable: false,
          filter: false,
          // valuePrepareFunction: (value) => value = moment(value).format('YYYY-MM-DD'),
        },
        responsables: {
          title: this.translate.instant('calendario.responsable'),
          witdh: '20%',
          editable: false,
          filter: false,
          valuePrepareFunction: (value: any) => {
            if (value != null) {
              this.responsable = '';
              for (let i = 0; i < value.length; i++) {
                this.responsable = value[i]['Nombre'] + ', ' + this.responsable;
              }
              if (this.responsable != '') {
                this.responsable = this.responsable.substring(
                  0,
                  this.responsable.length - 2,
                );
              }
              return this.responsable;
            } else {
              return value;
            }
          },
        },
        Activo: {
          title: this.translate.instant('calendario.estado'),
          witdh: '20%',
          editable: false,
          filter: false,
          valuePrepareFunction: (value: boolean) =>
            value
              ? this.translate.instant('GLOBAL.activo')
              : this.translate.instant('GLOBAL.inactivo'),
        },
      },
      mode: 'external',
      actions: {
        edit: false,
        delete: false,
        add: false,
        position: 'right',
        columnTitle: this.translate.instant('GLOBAL.acciones'),
        custom: [
          {
            name: 'clone',
            title: '<i class="nb-plus-circled" title="' +
              this.translate.instant('calendario.tooltip_clonar_actividad') +
              '"></i>',
          },
          {
            name: 'edit',
            title: '<i class="nb-edit" title="' + this.translate.instant('calendario.tooltip_editar_actividad') + '"></i>',
          },
        ],
      },
      add: {
        addButtonContent: '<i class="nb-plus" title="' +
          this.translate.instant('calendario.tooltip_crear_actividad') +
          '"></i>',
      },
      noDataMessage: this.translate.instant('calendario.sin_actividades'),
    };
  }

  onActionActivity(event: any, process: Proceso) {
    switch (event.action) {
      case 'edit':
        this.editActivity(event, process);
        break;
    }
  }

  editActivity(event: any, process: Proceso) {
    const activityConfig = new MatDialogConfig();
    activityConfig.width = '1040px';
    activityConfig.maxWidth = '95vw';
    activityConfig.height = '820px';
    activityConfig.maxHeight = '92vh';
    activityConfig.panelClass = 'sga-modal-panel';
    activityConfig.data = { process: process, calendar: this.calendar, editActivity: event.data };
    const editedActivity = this.dialog.open(ActividadCalendarioAcademicoComponent, activityConfig);
    editedActivity.afterClosed().subscribe((activity: any) => {
      if (activity !== undefined) {
        this.SgaCalendarioMidServide.put('actividad-calendario/calendario/actividad/' + event.data.actividadId, { Id: event.data.actividadId, actividad: activity.Actividad, resp: activity.responsable }).subscribe(
          response => {
            this.popUpManager.showSuccessAlert(this.translate.instant('calendario.actividad_actualizada'));
            this.calendarioActualizacionService.notificar({
              calendarioId: Number(this.calendar.calendarioId),
              actividadIds: [Number(event.data.actividadId)],
            });
          },
          error => {
            this.popUpManager.showErrorToast(this.translate.instant('calendario.error_actualizar_actividad'));
          },
        );
      }
    });
  }

  downloadFile(id_documento: any) {
    const filesToGet = [
      {
        Id: id_documento,
        key: id_documento,
      },
    ];
    this.newNuxeoService.get(filesToGet).subscribe(
      response => {
        const filesResponse = <any>response;
        if (Object.keys(filesResponse).length === filesToGet.length) {
          filesToGet.forEach((file: any) => {
            const url = filesResponse[0].url;
            window.open(url);
          });
        }
      },
      error => {
        this.popUpManager.showErrorToast('ERROR.error_cargar_documento');
      },
    );
  }

}
