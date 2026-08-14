import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { ProyectoAcademicoService } from 'src/app/services/proyecto_academico.service';
import { SgaCalendarioMidService } from 'src/app/services/sga_calendario_mid.service';
import { EventoService } from 'src/app/services/evento.service';
import { SgaAdmisionesMidService } from 'src/app/services/sga_admisiones_mid.service';
import { ImplicitAutenticationService } from 'src/app/services/implicit_autentication.service';
import { ConfiguracionService } from 'src/app/services/configuracion.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { PopUpManager } from '../../managers/popUpManager';
import * as moment from 'moment';
import { CalendarOptions } from '@fullcalendar/core';
import multiMonthPlugin from '@fullcalendar/multimonth';
import dayGridPlugin from '@fullcalendar/daygrid';
import esLocale from '@fullcalendar/core/locales/es';
import { EdicionActividadesProgramasComponent } from '../edicion-actividades-programas/edicion-actividades-programas.component';
import { CalendarioFiltroOption, CalendarioFiltrosAlcanceService, CalendarioProgramaOption } from 'src/app/services/calendario-filtros-alcance.service';
import { CalendarioActualizacionService } from 'src/app/services/calendario-actualizacion.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'administracion-calendario',
  templateUrl: './administracion-calendario.component.html',
  styleUrls: ['./administracion-calendario.component.scss'],
})
export class AdministracionCalendarioComponent implements OnInit, OnDestroy {
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

  userId: number | null = null;
  DependenciaID: number = 0;
  IsAdmin: boolean = false;
  EsSecretariaAcademica: boolean = false;
  programasUsuario: number[] = [];
  facultadesSecretaria: number[] = [];
  rolesUsuario: string[] = [];
  perfilesUsuarioGestion = new Set<number>();
  eventosCatalogoPermitidos = new Set<number>();

  periodos: CalendarioFiltroOption[] = [];
  facultades: CalendarioFiltroOption[] = [];
  periodoSelected?: CalendarioFiltroOption;
  facultadSelected?: CalendarioFiltroOption;
  niveles: CalendarioFiltroOption[] = [];
  nivelesSelected!: CalendarioFiltroOption;
  ProyectosFull!: ProyectoAcademicoInstitucion[];
  Proyectos: CalendarioProgramaOption[] = [];
  proyectoSelected!: any;

  Proyecto_nombre: string = '';
  Calendario_academico: any = '';
  periodicidad!: any;
  periodo_calendario: string = '';
  idCalendario: number = 0;

  displayedColumns: string[] = ['Nombre', 'Descripcion', 'Acciones'];
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
  private readonly destroy$ = new Subject<void>();

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
    private configuracionService: ConfiguracionService,
    private filtrosAlcanceService: CalendarioFiltrosAlcanceService,
    private parametrosService: ParametrosService,
    private router: Router,
    private route: ActivatedRoute,
    private calendarioActualizacionService: CalendarioActualizacionService
  ) {
    this.createProcessTable();
    this.createActivitiesTable();
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.createProcessTable();
      this.createActivitiesTable();
    });
    this.calendarioActualizacionService.actualizacion$
      .pipe(takeUntil(this.destroy$))
      .subscribe((actualizacion) => {
        if (this.idCalendario > 0 && Number(actualizacion.calendarioId) === Number(this.idCalendario)) {
          this.getInfoPrograma(this.DependenciaID, this.periodoSelected?.Id);
        }
      });
  }

  ngOnInit() {
    this.dataSource = new MatTableDataSource<Proceso>();
    this.autenticationService.getRole().then((rol: any) => {
      const roles = Array.isArray(rol) ? rol : [];
      this.rolesUsuario = roles;
      const r = roles.find(
        (role: string) =>
          role === 'ADMIN_SGA' ||
          role === 'VICERRECTOR' ||
          role === 'ASESOR_VICE' ||
          role === 'ADMISIONES_REG'
      );
      this.cargarPermisosGestionEventos(roles).finally(() => {
        this.IsAdmin = !!r;
        this.EsSecretariaAcademica = roles.includes('SECRETARIA_ACADEMICA') || roles.includes('SECRETARIO_ACADEMICO');
        this.cargarAlcanceFiltros();
      });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  cargarAlcanceFiltros(): void {
    this.filtrosAlcanceService.cargarAlcance()
      .then((alcance) => {
        this.periodos = alcance.periodos;
        this.facultades = alcance.facultades;
        this.niveles = [];
        this.Proyectos = [];
      })
      .catch(() => {
        this.periodos = [];
        this.facultades = [];
        this.niveles = [];
        this.Proyectos = [];
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      });
  }

  onSelectPeriodo() {
    this.facultadSelected = undefined;
    this.nivelesSelected = undefined as any;
    this.proyectoSelected = undefined;
    this.Calendario_academico = '';
    this.processes = [];
    this.niveles = [];
    this.Proyectos = [];
    this.dataSource = new MatTableDataSource<Proceso>();
  }

  onSelectFacultad() {
    this.nivelesSelected = undefined as any;
    this.proyectoSelected = undefined;
    this.Calendario_academico = '';
    this.processes = [];
    this.Proyectos = [];
    this.niveles = this.filtrosAlcanceService.nivelesPorFacultad(this.facultadSelected?.Id || null);
    this.dataSource = new MatTableDataSource<Proceso>();
  }

  onSelectLevel() {
    this.proyectoSelected = '';
    this.Calendario_academico = '';
    this.processes = [];
    this.Proyectos = this.filtrosAlcanceService.programasPorFacultadNivel(
      this.facultadSelected?.Id || null,
      this.nivelesSelected?.Id || null
    );
    this.dataSource = new MatTableDataSource<Proceso>();
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
    this.dataSource = new MatTableDataSource<Proceso>();
    if (!this.periodoSelected?.Id || !this.proyectoSelected?.Id) {
      return;
    }
    this.DependenciaID = this.proyectoSelected.Id;
    this.getInfoPrograma(this.DependenciaID, this.periodoSelected.Id);
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
        'proyecto_academico_institucion?query=Activo:true&limit=0'
      )
      .subscribe(
        (response: any) => {
          this.ProyectosFull = response;
          this.aplicarFiltroProyectosPorNivel();
        },
        (error: any) => {
          this.ProyectosFull = [];
        }
      );
  }

  getListaProyectosPorDependencias(dependencias: []) {
    this.projectService
      .get(
        'proyecto_academico_institucion?query=Activo:true&limit=0&fields=Id,Nombre,NivelFormacionId'
      )
      .subscribe(
        (response: any) => {
          const proyectos = response.filter((proyecto: any) =>
            dependencias.some(
              (dependencia: number) => dependencia === proyecto.Id
            )
          );
          this.Proyectos = proyectos;
        },
        (error: any) => {
          this.ProyectosFull = [];
        }
      );
  }

  aplicarFiltroProyectosPorNivel() {
    if (!this.ProyectosFull) {
      this.Proyectos = [];
      return;
    }
    let proyectos = [...this.ProyectosFull];

    if (this.nivelesSelected) {
      proyectos = proyectos.filter((proyecto) => this.filtrarProyecto(proyecto));
    } else if (!this.IsAdmin) {
      this.Proyectos = [];
      return;
    }

    if (this.EsSecretariaAcademica) {
      proyectos = proyectos.filter((proyecto: any) => this.facultadesSecretaria.includes(Number(proyecto.FacultadId)));
    } else if (!this.IsAdmin && this.programasUsuario.length > 0) {
      proyectos = proyectos.filter((proyecto: any) => this.programasUsuario.includes(Number(proyecto.Id)));
    }

    this.Proyectos = proyectos;
  }

  getFacultadesSecretaria() {
    return new Promise<number[]>(async (resolve, reject) => {
      try {
        const documento = await this.autenticationService.getDocument();
        if (!documento) {
          reject([]);
          return;
        }
        this.sgaCalendarioMidService
          .get('calendario-academico/secretario-academico/' + documento + '/facultades')
          .subscribe(
            (response: any) => {
              const facultades = response?.Facultades || response?.Data?.Facultades || response?.Data || [];
              resolve(Array.isArray(facultades) ? facultades.map((facultad: any) => Number(facultad)).filter((facultad: number) => facultad > 0) : []);
            },
            () => reject([])
          );
      } catch (error) {
        reject([]);
      }
    });
  }

  getProgramaIdByUser() {
    return new Promise(async (resolve, reject) => {
      try {
        this.userId = await this.userService.getPersonaId();
      } catch (error) {
        console.error('Error al obtener el id del usuario', error);
        reject(null);
      }
      this.sgaAdmisionesMidService
        .get('admision/dependencia_vinculacion_tercero/' + this.userId)
        .subscribe(
          (respDependencia: any) => {
            const dependencias = <number[]>(
              respDependencia.Data.Data.DependenciaId
            );
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

  getDependenciasPorTercero() {
    return new Promise(async (resolve, reject) => {
      try {
        this.userId = await this.userService.getPersonaId();
        this.sgaAdmisionesMidService
          .get('admision/dependencia_vinculacion_tercero/' + this.userId)
          .subscribe(
            (respDependencia: any) => {
              const dependencias = <number[]>(
                respDependencia.Data.Data.DependenciaId
              );
              if (dependencias.length >= 1) {
                resolve(dependencias);
              } else {
                reject(null);
              }
            },
            (error: any) => {
              reject(null);
            }
          );
      } catch (error) {
        console.error('Error al obtener las dependencias por tercero', error);
        reject(null);
      }
    });
  }

  getInfoPrograma(DependenciaId: number, periodoId?: number) {
    this.processes = [];
    this.projectService
      .get('proyecto_academico_institucion/' + DependenciaId)
      .subscribe(
        (res_proyecto: any) => {
          this.Proyecto_nombre = res_proyecto.Nombre;
          this.eventoService.get('tipo_recurrencia?limit=0').subscribe(
            (res_recurrencia: any) => {
              this.periodicidad = res_recurrencia;
              this.sgaCalendarioMidService
                .get('calendario-proyecto/' + DependenciaId + (periodoId ? '?id-periodo=' + periodoId : ''))
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
                                        const loadedProcess = new Proceso();
                                        loadedProcess.Nombre = element.Proceso;
                                        loadedProcess.CalendarioId = {
                                          Id: response.Data[0].Id,
                                        };
                                        const activities = element.Actividades;
                                        const activityList: Actividad[] = [];

                                        if (activities !== null) {
                                          activities.forEach((element: any) => {
                                            if (Object.keys(element).length !== 0) {
                                              const loadedActivity =
                                                new Actividad();
                                              loadedActivity.actividadId =
                                                element.actividadId;
                                               loadedActivity.ProcesoId = {
                                                 Id: element.ProcesoId.Id,
                                               };
                                               loadedActivity.EventoCatalogoId = element.EventoCatalogoId;
                                               loadedActivity.Nombre =
                                                 element.Nombre;
                                              loadedActivity.Descripcion =
                                                element.Descripcion;
                                              (loadedActivity as any).ProcesoNombre = loadedProcess.Nombre;
                                               loadedActivity.DependenciaId =
                                                 this.validJSONdeps(
                                                   element.DependenciaId
                                                 );
                                              if (
                                                !this.actividadIncluyePrograma(
                                                  loadedActivity.DependenciaId,
                                                  DependenciaId
                                                )
                                              ) {
                                                return;
                                              }

                                              const FechasParticulares =
                                                this.findDatesforDep(
                                                  loadedActivity.DependenciaId,
                                                  DependenciaId
                                                );
                                              if (
                                                FechasParticulares === undefined
                                              ) {
                                                loadedActivity.FechaInicio =
                                                  this.formatDateTimeLocal(
                                                    element.FechaInicio
                                                  );
                                                loadedActivity.FechaFin =
                                                  this.formatDateTimeLocal(
                                                    element.FechaFin
                                                  );
                                                loadedActivity.Activo =
                                                  element.Activo;
                                                loadedActivity.Editable = false;
                                              } else {
                                                loadedActivity.FechaInicio =
                                                  this.formatDateTimeLocal(
                                                    FechasParticulares.Inicio
                                                  );
                                                loadedActivity.FechaFin =
                                                  this.formatDateTimeLocal(
                                                    FechasParticulares.Fin
                                                  );
                                                loadedActivity.Activo =
                                                  FechasParticulares.Activo;
                                                loadedActivity.Editable = true;
                                              }
                                              loadedActivity.FechaInicioOrg =
                                                this.formatDateTimeLocal(
                                                  element.FechaInicio
                                                );
                                              loadedActivity.FechaFinOrg =
                                                this.formatDateTimeLocal(
                                                  element.FechaFin
                                                );
                                               loadedActivity.responsables =
                                                 element.Responsable;
                                               loadedActivity.PuedeEditar =
                                                 this.puedeEditarEventoCatalogo(
                                                   loadedActivity.EventoCatalogoId
                                                 );
                                               loadedActivity.MotivoNoEditable = loadedActivity.PuedeEditar
                                                 ? ''
                                                 : this.translate.instant('calendario.sin_permiso_evento_catalogo');
                                               loadedProcess.procesoId =
                                                 element.ProcesoId.Id;
                                              loadedProcess.Descripcion =
                                                element.ProcesoId.ProcesoCatalogoId.Descripcion;
                                              loadedProcess.ProcesoCatalogoId =
                                                element.ProcesoId.ProcesoCatalogoId;
                                              const id_rec =
                                                element.ProcesoId
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
                                              activityList.push(loadedActivity);
                                            }
                                          });
                                          if (activityList.length > 0) {
                                            loadedProcess.actividades =
                                              new MatTableDataSource(
                                                activityList
                                              );
                                            this.processes.push(loadedProcess);
                                          }
                                        }
                                      }
                                    });
                                    this.dataSource = new MatTableDataSource(
                                      this.processes
                                    );
                                    this.datasourceActivity =
                                      new MatTableDataSource<Actividad>();
                                    this.dataSource.paginator = this.paginator;
                                    this.dataSource.sort = this.sort;
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
                        this.translate.instant('calendario.sin_calendario')
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
    if (!DepIds || DepIds === '' || DepIds === '{}') {
      DepIds = '{"proyectos":[],"fechas":[]}';
    }
    const jsoncheck = JSON.parse(DepIds);
    if (!jsoncheck.hasOwnProperty('proyectos')) {
      jsoncheck.proyectos = [];
    }
    if (!Array.isArray(jsoncheck.proyectos)) {
      jsoncheck.proyectos = jsoncheck.proyectos ? [jsoncheck.proyectos] : [];
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

  actividadIncluyePrograma(listDeps: any, DepId: number) {
    const proyectos = Array.isArray(listDeps?.proyectos)
      ? listDeps.proyectos
      : [];
    return proyectos.some(
      (proyectoId: any) => Number(proyectoId) === Number(DepId)
    );
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
        start: this.parseDisplayDate(process.actividades.filteredData[i].FechaInicio),
        end: this.parseDisplayDate(process.actividades.filteredData[i].FechaFin),
        color: this.generarColorAleatorio(),
      };
      this.misEventos.push(evento);
    }
    const dialogRef = this.dialog.open(template, {
      width: '1000px',
      height: '800px',
      maxWidth: '94vw',
      maxHeight: '92vh',
      panelClass: 'sga-modal-panel',
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
    if ((event.action === 'edit' || event.action === 'disable') && !event.data?.PuedeEditar) {
      this.popUpManager.showAlert(
        this.translate.instant('calendario.actividades'),
        event.data?.MotivoNoEditable || this.translate.instant('calendario.sin_permiso_evento_catalogo')
      );
      return;
    }
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
    activityConfig.maxWidth = '94vw';
    activityConfig.maxHeight = '90vh';
    activityConfig.panelClass = 'sga-modal-panel';
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
        start: this.parseDisplayDate(event.data.FechaInicio),
        end: this.parseDisplayDate(event.data.FechaFin),
      },
    ];
    const dialogRef = this.dialog.open(event.dialog, {
      width: '700px',
      height: '580px',
      maxWidth: '94vw',
      maxHeight: '90vh',
      panelClass: 'sga-modal-panel',
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
      initialDate: this.parseDisplayDate(event.data.FechaInicio),
      fixedWeekCount: false,
      showNonCurrentDates: false,
      locale: esLocale,
      plugins: [dayGridPlugin],
      initialView: 'dayGridMonth',
      events: this.actividad,
    };
  }

  parseDisplayDate(date: any) {
    return this.localDateTimeParts(date).iso;
  }

  formatDateTimeLocal(date: any) {
    return this.localDateTimeParts(date).display;
  }

  localDateTimeParts(date: any) {
    const value = this.extractDateText(date);
    let match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value);
    if (match) {
      const [, year, month, day, hour, minute] = match;
      return {
        display: `${day}/${month}/${year} ${hour}:${minute}`,
        iso: `${year}-${month}-${day}T${hour}:${minute}:00`,
      };
    }
    match = /^(\d{2})[/-](\d{2})[/-](\d{4})(?:[ T](\d{2}):(\d{2}))?/.exec(value);
    if (match) {
      const [, day, month, year, hour = '00', minute = '00'] = match;
      return {
        display: `${day}/${month}/${year} ${hour}:${minute}`,
        iso: `${year}-${month}-${day}T${hour}:${minute}:00`,
      };
    }
    const parsed = moment.parseZone(value, ['DD/MM/YYYY HH:mm', 'DD/MM/YYYY', 'DD-MM-YYYY HH:mm', 'DD-MM-YYYY', moment.ISO_8601], true);
    const safe = parsed.isValid() ? parsed : moment.parseZone(value);
    return {
      display: safe.format('DD/MM/YYYY HH:mm'),
      iso: safe.format('YYYY-MM-DDTHH:mm:ss'),
    };
  }

  extractDateText(date: any) {
    if (date === null || date === undefined) {
      return '';
    }
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hour}:${minute}:00`;
    }
    return String(date).trim().replace(/ ([+-]\d{4}) [+-]\d{4}$/, ' $1');
  }

  fechaGMTMinus5() {
    return moment().format('YYYY-MM-DDTHH:mm:ss');
  }

  editActivity(event: any, process: any) {
    const activityConfig = new MatDialogConfig();
    activityConfig.width = 'min(1100px, 94vw)';
    activityConfig.maxWidth = '94vw';
    activityConfig.height = '90vh';
    activityConfig.maxHeight = '92vh';
    activityConfig.panelClass = ['activity-edit-dialog', 'sga-modal-panel'];
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
               this.sgaCalendarioMidService.put('calendario-academico/actividad/' + event.data.actividadId + '/dependencias', { DependenciaId: respGet.DependenciaId }).subscribe(
                 (respPut: any) => {
                   this.calendarioActualizacionService.notificar({
                     calendarioId: Number(this.idCalendario),
                     actividadIds: [Number(event.data.actividadId)],
                   });
                   this.popUpManager.showSuccessAlert(
                     this.translate.instant('calendario.fechas_particulares_actualizadas')
                   );
                 },
                 (error: any) => {
                   this.popUpManager.showErrorToast(
                    this.translate.instant(
                       'calendario.error_actualizar_fechas_particulares'
                    )
                  );
                }
              );
            },
            (error: any) => {
              this.popUpManager.showErrorToast(
                 this.translate.instant('calendario.error_actualizar_fechas_particulares')
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
                        fd.Modificacion = this.fechaGMTMinus5();
                      }
                   }
                  );
                   this.sgaCalendarioMidService
                     .put('calendario-academico/actividad/' + respGet.Id + '/dependencias', { DependenciaId: JSON.stringify(dep) })
                     .subscribe(
                       (respPut: any) => {
                         this.calendarioActualizacionService.notificar({
                           calendarioId: Number(this.idCalendario),
                           actividadIds: [Number(respGet.Id)],
                         });
                         this.popUpManager.showSuccessAlert(
                          this.translate.instant(
                             'calendario.estado_actividad_actualizado'
                          )
                        );
                       },
                       (error: any) => {
                         this.popUpManager.showErrorToast(
                          this.translate.instant(
                             'calendario.error_actualizar_estado_actividad'
                          )
                        );
                      }
                    );
                },
                (error: any) => {
                  this.popUpManager.showErrorToast(
                    this.translate.instant(
                       'calendario.error_actualizar_estado_actividad'
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

  cargarPermisosGestionEventos(roles: string[]): Promise<void> {
    return new Promise((resolve) => {
      this.configuracionService.get('aplicacion/?query=Alias:SGA_MF&limit=1').subscribe(
        (aplicaciones: any) => {
          const aplicacion = this.normalizarListaRespuesta(aplicaciones)[0];
          const aplicacionId = this.obtenerIdRespuesta(aplicacion);
          if (!aplicacionId) {
            resolve();
            return;
          }
          this.configuracionService.get('perfil/?query=Aplicacion.Id:' + aplicacionId + '&limit=0').subscribe(
            (perfiles: any) => {
              const rolesNormalizados = new Set(roles.map((role: string) => this.normalizarTextoPermiso(role)));
              this.perfilesUsuarioGestion = new Set(
                this.normalizarListaRespuesta(perfiles)
                  .filter((perfil: any) =>
                    rolesNormalizados.has(this.normalizarTextoPermiso(perfil?.Nombre || perfil?.nombre || '')) ||
                    rolesNormalizados.has(this.normalizarTextoPermiso(perfil?.CodigoAbreviacion || perfil?.codigo_abreviacion || ''))
                  )
                  .map((perfil: any) => this.obtenerIdRespuesta(perfil))
                  .filter((id: number) => id > 0)
              );
              this.cargarEventosCatalogoPermitidos().then(resolve).catch(() => resolve());
            },
            () => resolve()
          );
        },
        () => resolve()
      );
    });
  }

  cargarEventosCatalogoPermitidos(): Promise<void> {
    return new Promise((resolve) => {
      if (this.perfilesUsuarioGestion.size === 0) {
        this.eventosCatalogoPermitidos = new Set<number>();
        resolve();
        return;
      }
      this.eventoService
        .get('evento_catalogo_rol_gestion?query=Activo:true&limit=0')
        .subscribe(
          (relaciones: any) => {
            const permitidos = this.normalizarListaRespuesta(relaciones)
              .filter((relacion: any) => this.perfilesUsuarioGestion.has(Number(relacion?.PerfilId || relacion?.perfil_id || 0)))
              .map((relacion: any) => this.obtenerIdRespuesta(relacion?.EventoCatalogoId || relacion?.evento_catalogo_id))
              .filter((id: number) => id > 0);
            this.eventosCatalogoPermitidos = new Set(permitidos);
            resolve();
          },
          () => {
            this.eventosCatalogoPermitidos = new Set<number>();
            resolve();
          }
        );
    });
  }

  puedeEditarEventoCatalogo(eventoCatalogo: any): boolean {
    const eventoCatalogoId = this.obtenerIdRespuesta(eventoCatalogo);
    return eventoCatalogoId > 0 && this.eventosCatalogoPermitidos.has(eventoCatalogoId);
  }

  normalizarListaRespuesta(respuesta: any): any[] {
    if (Array.isArray(respuesta)) {
      return respuesta;
    }
    if (Array.isArray(respuesta?.Data?.Data)) {
      return respuesta.Data.Data;
    }
    if (Array.isArray(respuesta?.Data)) {
      return respuesta.Data;
    }
    return [];
  }

  obtenerIdRespuesta(valor: any): number {
    if (typeof valor === 'number') {
      return valor;
    }
    return Number(valor?.Id || valor?.id || 0);
  }

  normalizarTextoPermiso(valor: string): string {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
  }
}
