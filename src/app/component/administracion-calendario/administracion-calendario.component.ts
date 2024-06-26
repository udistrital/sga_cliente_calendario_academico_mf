import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Proceso } from 'src/app/models/calendario-academico/proceso';
import { Actividad } from 'src/app/models/calendario-academico/actividad';
import { ProyectoAcademicoInstitucion } from '../../models/proyecto_academico/proyecto_academico_institucion';
import { NivelFormacion } from 'src/app/models/proyecto_academico/nivel_formacion';
import { UserService } from '../../services/users.service';
import { EventoService } from 'src/app/services/evento.service';
import { ProyectoAcademicoService } from 'src/app/services/proyecto_academico.service';
import { SgaCalendarioMidService } from 'src/app/services/sga_calendario_mid.service';
import { SgaAdmisionesMidService } from 'src/app/services/sga_admisiones_mid.service';
import { ImplicitAutenticationService } from 'src/app/services/implicit_autentication.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { PopUpManager } from '../../managers/popUpManager';
import * as moment from 'moment';
import { CalendarOptions } from '@fullcalendar/core';
import multiMonthPlugin from '@fullcalendar/multimonth';
import dayGridPlugin from '@fullcalendar/daygrid';
import esLocale from '@fullcalendar/core/locales/es';
import { EdicionActividadesProgramasComponent } from '../edicion-actividades-programas/edicion-actividades-programas.component';

@Component({
  selector: 'administracion-calendario',
  templateUrl: './administracion-calendario.component.html',
  styleUrls: ['./administracion-calendario.component.scss'],
})
export class AdministracionCalendarioComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  processSettings: any;
  activitiesSettings: any;

  processes: Proceso[] = [];
  misEventos: { title: string; start: string; end: string; color: string }[] =
    [];
  actividad: { title: string; start: string; end: string }[] = [];
  misColores = [
    '#007bff',
    '#006400',
    '#808000',
    '#800000',
    '#500050',
    '#804000',
  ]; // Tonos oscuros de azul, verde, amarillo, rojo, morado, naranja
  calendarOptions: CalendarOptions = {
    timeZone: 'America/Bogota',
    locale: esLocale,
    fixedWeekCount: false,
    showNonCurrentDates: false,
    plugins: [],
    initialView: '',
    events: [],
  };

  userId: number = 0;
  DependenciaID: number = 0;
  IsAdmin: boolean = false;

  niveles!: NivelFormacion[];
  nivelesSelected!: NivelFormacion;
  ProyectosFull!: ProyectoAcademicoInstitucion[];
  Proyectos!: ProyectoAcademicoInstitucion[];
  proyectoSelected!: any;

  Proyecto_nombre: string = '';
  Calendario_academico: any = '';
  periodicidad!: any;
  periodo_calendario: string = '';
  idCalendario: number = 0;

  displayedColumns: string[] = [
    'Nombre',
    'Descripcion',
    'FechaInicio',
    'FechaFin',
    'Activo',
    'Acciones',
  ];
  displayedColumnsActividades: string[] = [
    'Nombre',
    'Descripcion',
    'FechaInicio',
    'FechaFin',
    'Activo',
    'Acciones',
  ];
  dataSource!: MatTableDataSource<Proceso>;
  datasourceActivity!: MatTableDataSource<Actividad>;

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private popUpManager: PopUpManager,
    private userService: UserService,
    private projectService: ProyectoAcademicoService,
    private sgaAdmisionesMidService: SgaAdmisionesMidService,
    private sgaCalendarioMidService: SgaCalendarioMidService,
    private eventoService: EventoService,
    private autenticationService: ImplicitAutenticationService,
    private parametrosService: ParametrosService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.createProcessTable();
    this.createActivitiesTable();
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.createProcessTable();
      this.createActivitiesTable();
    });
  }

  ngOnInit() {
    this.dataSource = new MatTableDataSource<Proceso>();
    this.autenticationService.getRole().then((rol: any) => {
      const r = rol.find(
        (role: string) =>
          role === 'ADMIN_SGA' ||
          role === 'VICERRECTOR' ||
          role === 'ASESOR_VICE'
      );
      if (r) {
        this.IsAdmin = true;
        this.getNivel();
        this.getListaProyectos();
      } else {
        this.IsAdmin = false;
        this.getProgramaIdByUser()
          .then((id: any) => {
            this.DependenciaID = id;
            this.getInfoPrograma(this.DependenciaID);
          })
          .catch((err: any) => {
            if (err) {
              this.popUpManager.showAlert(
                this.translate.instant('GLOBAL.info'),
                this.translate.instant('admision.multiple_vinculacion') +
                  '. ' +
                  this.translate.instant('GLOBAL.comunicar_OAS_error')
              );
            } else {
              this.popUpManager.showErrorAlert(
                this.translate.instant('admision.no_vinculacion_no_rol') +
                  '. ' +
                  this.translate.instant('GLOBAL.comunicar_OAS_error')
              );
            }
          });
      }
    });
  }

  createProcessTable() {
    this.processSettings = {
      columns: {
        Nombre: {
          title: this.translate.instant('calendario.nombre'),
          width: '20%',
          editable: false,
        },
        Descripcion: {
          title: this.translate.instant('GLOBAL.descripcion'),
          width: '80%',
          editable: false,
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
            name: 'view',
            title:
              '<i class="nb-search" title="' +
              this.translate.instant('calendario.tooltip_detalle_proceso') +
              '"></i>',
          },
        ],
      },
      noDataMessage: this.translate.instant('calendario.sin_procesos'),
    };
  }

  createActivitiesTable() {
    this.activitiesSettings = {
      columns: {
        Nombre: {
          title: this.translate.instant('calendario.nombre'),
          width: '20%',
          editable: false,
        },
        Descripcion: {
          title: this.translate.instant('GLOBAL.descripcion'),
          width: '80%',
          editable: false,
        },
        FechaInicio: {
          title: this.translate.instant('calendario.fecha_inicio'),
          width: '20%',
          editable: false,
        },
        FechaFin: {
          title: this.translate.instant('calendario.fecha_fin'),
          width: '20%',
          editable: false,
        },
        Activo: {
          title: this.translate.instant('calendario.estado'),
          width: '20%',
          editable: false,
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
            name: 'calendar',
            title:
              '<i class="nb-calendar" title="' +
              this.translate.instant('calendario.tooltip_ver_calendario') +
              '"></i>',
          },
          {
            name: 'edit',
            title:
              '<i class="nb-edit" title="' +
              this.translate.instant('calendario.tooltip_editar_actividad') +
              '"></i>',
          },
          {
            name: 'disable',
            title:
              '<i class="nb-locked" title="' +
              this.translate.instant('calendario.tooltip_estado_actividad') +
              '" ></i>',
          },
        ],
      },
      noDataMessage: this.translate.instant('calendario.sin_actividades'),
    };
  }

  applyFilterProces(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyFilterActividades(event: Event, data: any) {
    const filterValue = (event.target as HTMLInputElement).value;
    data.filter = filterValue.trim().toLowerCase();
    this.datasourceActivity = data;
  }

  onSelectLevel() {
    this.proyectoSelected = '';
    this.Calendario_academico = '';
    this.processes = [];
    this.Proyectos = this.ProyectosFull.filter((proyecto) =>
      this.filtrarProyecto(proyecto)
    );
  }

  filtrarProyecto(proyecto: any) {
    return (
      this.nivelesSelected.Id === proyecto.NivelFormacionId.Id ||
      (proyecto.NivelFormacionId.NivelFormacionPadreId &&
        proyecto.NivelFormacionId.NivelFormacionPadreId.Id ===
          this.nivelesSelected.Id)
    );
  }

  async onSelectPrograma() {
    this.Calendario_academico = '';
    this.processes = [];
    this.DependenciaID = this.proyectoSelected.Id;
    this.getInfoPrograma(this.DependenciaID);
  }

  getNivel() {
    this.projectService
      .get('nivel_formacion?query=NivelFormacionPadreId__isnull:true&limit=0')
      .subscribe(
        (response: any) => {
          this.niveles = response;
        },
        (error: any) => {
          this.popUpManager.showErrorToast(
            this.translate.instant('ERROR.general')
          );
        }
      );
  }

  getListaProyectos() {
    this.projectService
      .get(
        'proyecto_academico_institucion?query=Activo:true&limit=0&fields=Id,Nombre,NivelFormacionId'
      )
      .subscribe(
        (response: any) => {
          this.ProyectosFull = response;
        },
        (error: any) => {
          this.ProyectosFull = [];
        }
      );
  }

  getProgramaIdByUser() {
    return new Promise((resolve, reject) => {
      this.userId = this.userService.getPersonaId();
      this.sgaAdmisionesMidService
        .get('admision/dependencia_vinculacion_tercero/' + this.userId)
        .subscribe(
          (respDependencia: any) => {
            const dependencias = <number[]>respDependencia.Data.DependenciaId;
            if (dependencias.length === 1) {
              resolve(dependencias[0]);
            } else {
              reject(dependencias);
            }
          },
          (error: any) => {
            reject(null);
          }
        );
    });
  }

  getInfoPrograma(DependenciaId: number) {
    this.processes = [];
    this.projectService
      .get('proyecto_academico_institucion/' + DependenciaId)
      .subscribe(
        (res_proyecto: any) => {
          this.Proyecto_nombre = res_proyecto.Nombre;
          if (!this.IsAdmin) {
            this.Proyectos = [res_proyecto];
            this.proyectoSelected = res_proyecto;
          }
          this.eventoService.get('tipo_recurrencia?limit=0').subscribe(
            (res_recurrencia: any) => {
              this.periodicidad = res_recurrencia;
              this.sgaCalendarioMidService
                .get('calendario-proyecto/' + DependenciaId)
                .subscribe(
                  (resp_calendar_project: any) => {
                    this.idCalendario = resp_calendar_project.Data.CalendarioId;
                    if (this.idCalendario > 0) {
                      this.sgaCalendarioMidService
                        .get(
                          'calendario-academico/v2/' +
                            resp_calendar_project.Data.CalendarioId
                        )
                        .subscribe(
                          (response: any) => {
                            this.parametrosService
                              .get('periodo/' + response.Data[0].PeriodoId)
                              .subscribe(
                                (resp: any) => {
                                  this.periodo_calendario = resp.Data.Nombre;
                                  this.Calendario_academico =
                                    response.Data[0].Nombre;
                                  const processes: any[] =
                                    response.Data[0].proceso;
                                  if (processes !== null) {
                                    processes.forEach((element) => {
                                      if (Object.keys(element).length !== 0) {
                                        const loadedProcess: Proceso =
                                          new Proceso();
                                        loadedProcess.Nombre = element.Proceso;
                                        loadedProcess.CalendarioId = {
                                          Id: response.Data[0].Id,
                                        };
                                        loadedProcess.actividades =
                                          new MatTableDataSource<Actividad>();
                                        const activities: any[] =
                                          element.Actividades;
                                        if (activities !== null) {
                                          activities.forEach((element) => {
                                            if (
                                              Object.keys(element).length !==
                                                0 &&
                                              element.EventoPadreId === null
                                            ) {
                                              const loadedActivity: Actividad =
                                                new Actividad();
                                              loadedActivity.actividadId =
                                                element.actividadId;
                                              loadedActivity.TipoEventoId = {
                                                Id: element.TipoEventoId.Id,
                                              };
                                              loadedActivity.Nombre =
                                                element.Nombre;
                                              loadedActivity.Descripcion =
                                                element.Descripcion;
                                              loadedActivity.DependenciaId =
                                                this.validJSONdeps(
                                                  element.DependenciaId
                                                );
                                              const FechasParticulares =
                                                this.findDatesforDep(
                                                  loadedActivity.DependenciaId,
                                                  DependenciaId
                                                );
                                              if (
                                                FechasParticulares === undefined
                                              ) {
                                                loadedActivity.FechaInicio =
                                                  moment(
                                                    element.FechaInicio,
                                                    'YYYY-MM-DD'
                                                  ).format('DD-MM-YYYY');
                                                loadedActivity.FechaFin =
                                                  moment(
                                                    element.FechaFin,
                                                    'YYYY-MM-DD'
                                                  ).format('DD-MM-YYYY');
                                                loadedActivity.Activo =
                                                  element.Activo;
                                                loadedActivity.Editable = false;
                                              } else {
                                                loadedActivity.FechaInicio =
                                                  moment(
                                                    FechasParticulares.Inicio,
                                                    'YYYY-MM-DDTHH:mm:ss[Z]'
                                                  ).format('DD-MM-YYYY');
                                                loadedActivity.FechaFin =
                                                  moment(
                                                    FechasParticulares.Fin,
                                                    'YYYY-MM-DDTHH:mm:ss[Z]'
                                                  ).format('DD-MM-YYYY');
                                                loadedActivity.Activo =
                                                  FechasParticulares.Activo;
                                                loadedActivity.Editable = true;
                                              }
                                              loadedActivity.FechaInicioOrg =
                                                moment(
                                                  element.FechaInicio,
                                                  'YYYY-MM-DD'
                                                ).format('DD-MM-YYYY');
                                              loadedActivity.FechaFinOrg =
                                                moment(
                                                  element.FechaFin,
                                                  'YYYY-MM-DD'
                                                ).format('DD-MM-YYYY');
                                              loadedActivity.responsables =
                                                element.Responsable;
                                              loadedProcess.procesoId =
                                                element.TipoEventoId.Id;
                                              loadedProcess.Descripcion =
                                                element.TipoEventoId.Descripcion;
                                              const id_rec =
                                                element.TipoEventoId
                                                  .TipoRecurrenciaId.Id;
                                              loadedProcess.TipoRecurrenciaId =
                                                {
                                                  Id: id_rec,
                                                  Nombre:
                                                    this.periodicidad.find(
                                                      (rec: { Id: any }) =>
                                                        rec.Id === id_rec
                                                    ).Nombre,
                                                };
                                              loadedProcess.actividades.data.push(
                                                loadedActivity
                                              );
                                            }
                                          });
                                          this.processes.push(loadedProcess);
                                          this.dataSource =
                                            new MatTableDataSource(
                                              this.processes
                                            );
                                          this.datasourceActivity =
                                            new MatTableDataSource<Actividad>();
                                          this.dataSource.paginator =
                                            this.paginator;
                                          this.dataSource.sort = this.sort;
                                        }
                                      }
                                    });
                                  }
                                  if (response.Data[0].AplicaExtension) {
                                    this.popUpManager.showAlert(
                                      this.translate.instant(
                                        'calendario.formulario_extension'
                                      ),
                                      this.translate.instant(
                                        'calendario.calendario_tiene_extension'
                                      )
                                    );
                                  }
                                },
                                (error: any) => {
                                  this.popUpManager.showErrorToast(
                                    this.translate.instant('ERROR.general')
                                  );
                                }
                              );
                          },
                          (error: any) => {
                            this.popUpManager.showErrorToast(
                              this.translate.instant('ERROR.general')
                            );
                          }
                        );
                    } else {
                      this.popUpManager.showErrorToast(
                        this.translate.instant('ERROR.general')
                      );
                    }
                  },
                  (error: any) => {
                    this.popUpManager.showErrorToast(
                      this.translate.instant('ERROR.general')
                    );
                  }
                );
            },
            (error: any) => {
              this.popUpManager.showErrorToast(
                this.translate.instant('ERROR.general')
              );
            }
          );
        },
        (error: any) => {
          this.popUpManager.showErrorToast(
            this.translate.instant('ERROR.general')
          );
        }
      );
  }

  validJSONdeps(DepIds: string) {
    if (DepIds === '') {
      DepIds = '{"proyectos":[],"fechas":[]}';
    }
    const jsoncheck = JSON.parse(DepIds);
    if (!jsoncheck.hasOwnProperty('proyectos')) {
      jsoncheck.proyectos = [];
    }
    if (!jsoncheck.hasOwnProperty('fechas')) {
      jsoncheck.fechas = [];
    } else {
      jsoncheck.fechas.forEach((f: any) => {
        if (!f.hasOwnProperty('Activo')) {
          f.Activo = true;
        }
        if (!f.hasOwnProperty('Modificacion')) {
          f.Modificacion = '';
        }
        if (!f.hasOwnProperty('Fin')) {
          f.Fin = '';
        }
        if (!f.hasOwnProperty('Inicio')) {
          f.Inicio = '';
        }
        if (!f.hasOwnProperty('Id')) {
          f.Id = '';
        }
      });
    }
    return jsoncheck;
  }

  findDatesforDep(listDeps: any, DepId: number) {
    return listDeps.fechas.find((p: any) => p.Id === DepId);
  }

  generarColorAleatorio() {
    const indiceAleatorio = Math.floor(Math.random() * this.misColores.length);
    return this.misColores[indiceAleatorio];
  }

  openDialog(template: TemplateRef<any>, process: any) {
    this.misEventos = [];
    for (let i = 0; i < process.actividades.filteredData.length; i++) {
      const evento = {
        title: process.actividades.filteredData[i].Nombre,
        start: process.actividades.filteredData[i].FechaInicio.split('-')
          .reverse()
          .join('-'),
        end: process.actividades.filteredData[i].FechaFin.split('-')
          .reverse()
          .join('-'),
        color: this.generarColorAleatorio(),
      };
      this.misEventos.push(evento);
    }
    const dialogRef = this.dialog.open(template, {
      width: '1000px',
      height: '800px',
    });
    this.calendarOptions = {
      customButtons: {
        cerrar: {
          text: 'Cerrar',
          click: () => {
            dialogRef.close();
          },
        },
      },
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'cerrar',
      },
      timeZone: 'America/Bogota',
      fixedWeekCount: false,
      showNonCurrentDates: false,
      locale: esLocale,
      plugins: [multiMonthPlugin],
      initialView: 'multiMonthYear',
      events: this.misEventos,
    };
  }

  onAction(event: any, process: any) {
    console.log("PROCESS --> ",process);
    switch (event.action) {
      case 'view':
        this.viewProcess(event, process);
        break;
      case 'edit':
        this.editActivity(event, process);
        break;
      case 'disable':
        this.disableActivity(event, process);
        break;
      case 'calendar':
        this.calendarioActividad(event, process);
        break;
    }
  }

  viewProcess(event: any, process: any) {
    const activityConfig = new MatDialogConfig();
    activityConfig.width = '600px';
    activityConfig.height = '370px';
    activityConfig.data = { process: event.data, vista: 'process' };
    const newActivity = this.dialog.open(
      EdicionActividadesProgramasComponent,
      activityConfig
    );
    newActivity.afterClosed().subscribe((activity: any) => {});
  }

  calendarioActividad(event: any, process: any) {
    this.actividad = [
      {
        title: event.data.Nombre,
        start: event.data.FechaInicio.split('-').reverse().join('-'),
        end: event.data.FechaFin.split('-').reverse().join('-'),
      },
    ];
    const dialogRef = this.dialog.open(event.dialog, {
      width: '700px',
      height: '580px',
    });
    this.calendarOptions = {
      customButtons: {
        cerrar: {
          text: 'Cerrar',
          click: () => {
            dialogRef.close();
          },
        },
      },
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'cerrar',
      },
      timeZone: 'America/Bogota',
      initialDate: event.data.FechaInicio.split('-').reverse().join('-'),
      fixedWeekCount: false,
      showNonCurrentDates: false,
      locale: esLocale,
      plugins: [dayGridPlugin],
      initialView: 'dayGridMonth',
      events: this.actividad,
    };
  }

  editActivity(event: any, process: any) {
    const activityConfig = new MatDialogConfig();
    activityConfig.width = '800px';
    activityConfig.height = '600px';
    activityConfig.data = {
      process: process,
      activity: event.data,
      periodo: this.periodo_calendario,
      dependencia: this.DependenciaID,
      vista: 'edit_act',
    };
    const newActivity = this.dialog.open(
      EdicionActividadesProgramasComponent,
      activityConfig
    );
    newActivity.afterClosed().subscribe((activity: any) => {
      if (activity !== undefined) {
        this.eventoService
          .get('calendario_evento/' + event.data.actividadId)
          .subscribe(
            (respGet: any) => {
              respGet.DependenciaId = JSON.stringify(
                activity.UpdateDependencias
              );
              this.eventoService.put('calendario_evento', respGet).subscribe(
                (respPut: any) => {
                  this.popUpManager.showSuccessAlert(
                    this.translate.instant('calendario.actividad_actualizada')
                  );
                  this.getInfoPrograma(this.DependenciaID);
                },
                (error: any) => {
                  this.popUpManager.showErrorToast(
                    this.translate.instant(
                      'calendario.error_registro_actividad'
                    )
                  );
                }
              );
            },
            (error: any) => {
              this.popUpManager.showErrorToast(
                this.translate.instant('calendario.error_registro_actividad')
              );
            }
          );
      }
    });
  }

  disableActivity(event: any, process: any) {
    this.popUpManager
      .showConfirmAlert(
        this.translate.instant('calendario.mensaje_estado_actividad'),
        this.translate.instant('calendario.procesos_actividades')
      )
      .then((accion) => {
        if (accion.value) {
          if (event.data.Editable) {
            this.eventoService
              .get('calendario_evento/' + event.data.actividadId)
              .subscribe(
                (respGet: any) => {
                  const dep = JSON.parse(respGet.DependenciaId);
                  dep.fechas.forEach(
                    (fd: {
                      Id: number;
                      Activo: boolean;
                      Modificacion: string;
                    }) => {
                      if (fd.Id === this.DependenciaID) {
                        fd.Activo = !fd.Activo;
                        fd.Modificacion = moment(new Date()).format(
                          'DD-MM-YYYY'
                        );
                      }
                    }
                  );
                  respGet.DependenciaId = JSON.stringify(dep);
                  this.eventoService
                    .put('calendario_evento', respGet)
                    .subscribe(
                      (respPut: any) => {
                        this.getInfoPrograma(this.DependenciaID);
                        this.popUpManager.showSuccessAlert(
                          this.translate.instant(
                            'calendario.actividad_actualizada'
                          )
                        );
                      },
                      (error: any) => {
                        this.popUpManager.showErrorToast(
                          this.translate.instant(
                            'calendario.error_registro_actividad'
                          )
                        );
                      }
                    );
                },
                (error: any) => {
                  this.popUpManager.showErrorToast(
                    this.translate.instant(
                      'calendario.error_registro_actividad'
                    )
                  );
                }
              );
          } else {
            this.popUpManager.showAlert(
              this.translate.instant('calendario.actividades'),
              this.translate.instant('calendario.sin_permiso_edicion')
            );
          }
        }
      });
  }
}
