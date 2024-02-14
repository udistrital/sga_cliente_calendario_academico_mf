//models
import { Actividad } from '../../models/calendario-academico/actividad';
import { Proceso } from '../../models/calendario-academico/proceso';
import { ProyectoAcademicoInstitucion } from '../../models/proyecto_academico/proyecto_academico_institucion';
import { NivelFormacion } from '../../models/proyecto_academico/nivel_formacion';
//managers
import { PopUpManager } from '../../managers/popUpManager';
//servicios
import { EventoService } from '../../services/evento.service';
import { ProyectoAcademicoService } from '../../services/proyecto_academico.service';
import { SgaMidService } from '../../services/sga_mid.service';

import { UserService } from '../../services/users.service';
import { ParametrosService } from '../../services/parametros.service';
import { ImplicitAutenticationService } from '../../services/implicit_autentication.service';
//Material
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Component, OnInit, ViewChild } from '@angular/core';
//Traductor
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
//componente etc
import { EdicionActividadesProgramasComponent } from '../edicion-actividades-programas/edicion-actividades-programas.component';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { filter } from 'rxjs';



@Component({
  selector: 'administracion-calendario',
  templateUrl: './administracion-calendario.component.html',
  styleUrls: ['./administracion-calendario.component.scss']
})
export class AdministracionCalendarioComponent implements OnInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading: boolean = false;
  processSettings: any;
  activitiesSettings: any;

  processes: Proceso[] = [];

  userId: number = 0;
  DependenciaID: number = 0;
  IsAdmin: boolean = false;

  niveles!: NivelFormacion[];
  nivelesSelected!: NivelFormacion;
  ProyectosFull!: ProyectoAcademicoInstitucion[];
  Proyectos!: ProyectoAcademicoInstitucion[];
  proyectoSelected!: any; //ProyectoAcademicoInstitucion;

  Proyecto_nombre: string = "";
  Calendario_academico: any = "";
  periodicidad!: any;
  periodo_calendario: string = "";
  idCalendario: number = 0;

  displayedColumns: string[] = ['Nombre', 'Descripcion', "Acciones"];
  displayedColumnsActividades: string[] = ["Nombre", "Descripcion", "FechaInicio", "FechaFin", "Activo", "Acciones"]
  dataSource!: MatTableDataSource<Proceso>;
  datasourceActivity!: MatTableDataSource<Actividad>


  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private popUpManager: PopUpManager,
    private userService: UserService,

    private projectService: ProyectoAcademicoService,
    private sgaMidService: SgaMidService,
    private eventoService: EventoService,
    private parametrosService: ParametrosService,
    private router: Router,
    private route: ActivatedRoute,
    private autenticationService: ImplicitAutenticationService,
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



    this.autenticationService.getRole().then(
      //1.fix (rol: Array <String>) => {
      (rol: any) => {

        let r = rol.find((role: string) => (role == "ADMIN_SGA" || role == "VICERRECTOR" || role == "ASESOR_VICE")); // rol admin o vice
        if (r) {
          this.IsAdmin = true;
          this.getNivel();
          this.getListaProyectos();
        } else {
          this.IsAdmin = false;
          //2. fix this.getProgramaIdByUser().then((id: number) => {
          this.getProgramaIdByUser().then((id: any) => {
            this.DependenciaID = id;
            this.getInfoPrograma(this.DependenciaID);
          }, (err: any) => {
            if (err) {
              console.log('error en el contructor X(')
              this.popUpManager.showAlert(this.translate.instant('GLOBAL.info'), this.translate.instant('admision.multiple_vinculacion') + ". " + this.translate.instant('GLOBAL.comunicar_OAS_error'));
            } else {
              console.log('error en el contructor X(')
              this.popUpManager.showErrorAlert(this.translate.instant('admision.no_vinculacion_no_rol') + ". " + this.translate.instant('GLOBAL.comunicar_OAS_error'));
            }
          })
        }
      }
    );
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
            title: '<i class="nb-search" title="' +
              this.translate.instant('calendario.tooltip_detalle_proceso') +
              '"></i>',
          },
        ],
      },
      noDataMessage: this.translate.instant('calendario.sin_procesos'),
    }
  }

  createActivitiesTable() {
    this.activitiesSettings = {
      columns: {
        Nombre: {
          title: this.translate.instant('calendario.nombre'),
          witdh: '20%',
          editable: false,
        },
        Descripcion: {
          title: this.translate.instant('GLOBAL.descripcion'),
          witdh: '20%',
          editable: false,
        },
        FechaInicio: {
          title: this.translate.instant('calendario.fecha_inicio'),
          witdh: '20%',
          editable: false,
        },
        FechaFin: {
          title: this.translate.instant('calendario.fecha_fin'),
          witdh: '20%',
          editable: false,
        },
        Activo: {
          title: this.translate.instant('calendario.estado'),
          witdh: '20%',
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
            name: 'edit',
            title: '<i class="nb-edit" title="' +
              this.translate.instant('calendario.tooltip_editar_actividad') +
              '"></i>',
          },
          {
            name: 'disable',
            title: '<i class="nb-locked" title="' +
              this.translate.instant('calendario.tooltip_estado_actividad') +
              '" ></i>',
          }
        ],
      },
      noDataMessage: this.translate.instant('calendario.sin_actividades'),
    };
  }


  applyFilterProces(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    console.log(filterValue)
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  applyFilterActividades(event: Event, data: any, i: number) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.processes[i].actividades.filter = filterValue.trim().toLowerCase();
    this.datasourceActivity = data

  }

  verCalendario() {
    this.router.navigate(['../detalle-calendario', { Id: this.idCalendario }], { relativeTo: this.route });
  }

  onAction(event: any, process: any) {
    switch (event.action) {
      case 'view':
        this.viewProcess(event, process)
        break;
      case 'edit':
        this.editActivity(event, process);
        break;
      case 'disable':
        this.disableActivity(event, process);
        break;
    }
  }

  viewProcess(event: any, process: any) {
    console.log(event)
    const activityConfig = new MatDialogConfig();
    activityConfig.width = '600px';
    activityConfig.height = '370px';
    activityConfig.data = { process: event.data, vista: "process" };
    const newActivity = this.dialog.open(EdicionActividadesProgramasComponent, activityConfig);
    newActivity.afterClosed().subscribe((activity: any) => {

    });
  }

  editActivity(event: any, process: any) {
    console.log(event)
    console.log(process)
    const activityConfig = new MatDialogConfig();
    activityConfig.width = '800px';
    activityConfig.height = '600px';
    activityConfig.data = { activity: event.data, process: process, periodo: this.periodo_calendario, dependencia: this.DependenciaID, vista: "edit_act" };
    const newActivity = this.dialog.open(EdicionActividadesProgramasComponent, activityConfig);
    newActivity.afterClosed().subscribe((activity: any) => {
      if (activity != undefined) {
        this.eventoService.get('calendario_evento/' + event.data.actividadId).subscribe(
          (respGet: any) => {
            respGet.DependenciaId = JSON.stringify(activity.UpdateDependencias)
            this.eventoService.put('calendario_evento', respGet).subscribe(
              respPut => {
                this.popUpManager.showSuccessAlert(this.translate.instant('calendario.actividad_actualizada'));
                this.getInfoPrograma(this.DependenciaID);
              }, error => {
                this.popUpManager.showErrorToast(this.translate.instant('calendario.error_registro_actividad'));
              }
            )
          }, (error: any) => {
            this.popUpManager.showErrorToast(this.translate.instant('calendario.error_registro_actividad'));
          }

        )
      }
    });
  }

  disableActivity(event: any, process: any) {
    this.popUpManager.showConfirmAlert(this.translate.instant('calendario.mensaje_estado_actividad'), this.translate.instant('calendario.procesos_actividades')).then(accion => {
      if (accion.value) {
        if (event.data.Editable) {
          this.eventoService.get('calendario_evento/' + event.data.actividadId).subscribe(
            (respGet: any) => {
              var dep = JSON.parse(respGet.DependenciaId);
              dep.fechas.forEach((fd: { Id: number; Activo: boolean; Modificacion: string; }) => {
                if (fd.Id == this.DependenciaID) {
                  fd.Activo = !fd.Activo;
                  fd.Modificacion = moment(new Date()).format('DD-MM-YYYY');
                }
              });
              respGet.DependenciaId = JSON.stringify(dep);
              this.eventoService.put('calendario_evento', respGet).subscribe(
                respPut => {
                  this.getInfoPrograma(this.DependenciaID);
                  this.popUpManager.showSuccessAlert(this.translate.instant('calendario.actividad_actualizada'));
                }, error => {
                  this.popUpManager.showErrorToast(this.translate.instant('calendario.error_registro_actividad'));
                }
              )
            }, (error: any) => {
              this.popUpManager.showErrorToast(this.translate.instant('calendario.error_registro_actividad'));
            }
          )
        } else {
          this.popUpManager.showAlert(this.translate.instant('calendario.actividades'), this.translate.instant('calendario.sin_permiso_edicion'))
        }
      }
    })
  }

  getNivel() {
    this.projectService.get('nivel_formacion?query=NivelFormacionPadreId__isnull:true&limit=0').subscribe(
      //(response: NivelFormacion[]) => {
      (response: any) => {
        this.niveles = response;



      },
      error => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      }
    );
  }

  getListaProyectos() {
    this.projectService.get('proyecto_academico_institucion?query=Activo:true&limit=0&fields=Id,Nombre,NivelFormacionId')
      .subscribe(
        //(response: ProyectoAcademicoInstitucion[]) => {
        (response: any) => {
          this.ProyectosFull = response;
          console.log(this.ProyectosFull)
        },
        (error) => {
          this.ProyectosFull = [];
        }
      );
  }


  onSelectLevel() {
    this.proyectoSelected = undefined;
    this.Calendario_academico = undefined;
    this.processes = [];
    this.Proyectos = this.ProyectosFull.filter((proyecto) => this.filtrarProyecto(proyecto));
  }

  filtrarProyecto(proyecto: any) {
    if (this.nivelesSelected.Id === proyecto['NivelFormacionId']['Id']) {
      return true
    }
    if (proyecto['NivelFormacionId']['NivelFormacionPadreId'] !== null) {
      if (proyecto['NivelFormacionId']['NivelFormacionPadreId']['Id'] === this.nivelesSelected.Id) {
        return true
      }
    } else {
      return false
    }
    return
  }

  onSelectPrograma() {
    this.Calendario_academico = undefined;
    this.processes = [];
    this.DependenciaID = this.proyectoSelected.Id;
    this.getInfoPrograma(this.DependenciaID);




  }

  getProgramaIdByUser() {
    return new Promise((resolve, reject) => {
      this.userId = this.userService.getPersonaId();
      this.sgaMidService.get('admision/dependencia_vinculacion_tercero/' + this.userId)
        .subscribe(
          (respDependencia: any) => {
            const dependencias = <Number[]>respDependencia.Data.DependenciaId;
            if (dependencias.length == 1) {
              resolve(dependencias[0])
            } else {
              reject(dependencias)
            }
          },
          (error: any) => {
            reject(null)
          }
        );
    });
  }

  getInfoPrograma(DependenciaId: number) {
    this.loading = true;
    this.processes = [];
    this.projectService.get('proyecto_academico_institucion/' + DependenciaId).subscribe(
      //(res_proyecto: ProyectoAcademicoInstitucion) => {
      (res_proyecto: any) => {
        this.Proyecto_nombre = res_proyecto.Nombre;
        if (!this.IsAdmin) {
          this.Proyectos = [res_proyecto];
          this.proyectoSelected = res_proyecto;
        }
        this.eventoService.get('tipo_recurrencia?limit=0').subscribe(
          (res_recurrencia: any) => {
            this.periodicidad = res_recurrencia;
            this.sgaMidService.get('consulta_calendario_proyecto/' + DependenciaId).subscribe(
              (resp_calendar_project: any) => {
                this.idCalendario = resp_calendar_project["CalendarioId"];
                if (this.idCalendario > 0) {
                  this.sgaMidService.get('calendario_academico/v2/' + resp_calendar_project["CalendarioId"]).subscribe(
                    (response: any) => {
                      this.parametrosService.get('periodo/' + response.Data[0].PeriodoId).subscribe(
                        (resp: any) => {
                          this.periodo_calendario = resp.Data.Nombre;
                          this.Calendario_academico = response.Data[0].Nombre
                          const processes: any[] = response.Data[0].proceso;
                          if (processes !== null) {
                            processes.forEach(element => {
                              if (Object.keys(element).length !== 0) {
                                const loadedProcess: Proceso = new Proceso();
                                loadedProcess.Nombre = element['Proceso'];
                                loadedProcess.CalendarioId = { Id: response.Data[0].Id };
                                loadedProcess.actividades = new MatTableDataSource<Actividad>;
                                const activities: any[] = element['Actividades']
                                if (activities !== null) {
                                  activities.forEach(element => {
                                    if (Object.keys(element).length !== 0 && element['EventoPadreId'] == null) {
                                      const loadedActivity: Actividad = new Actividad();
                                      loadedActivity.actividadId = element['actividadId'];
                                      loadedActivity.TipoEventoId = { Id: element['TipoEventoId']['Id'] };
                                      loadedActivity.Nombre = element['Nombre'];
                                      loadedActivity.Descripcion = element['Descripcion'];
                                      loadedActivity['DependenciaId'] = this.validJSONdeps(element['DependenciaId']);
                                      var FechasParticulares = this.findDatesforDep(loadedActivity['DependenciaId'], DependenciaId);
                                      if (FechasParticulares == undefined) {
                                        loadedActivity.FechaInicio = moment(element['FechaInicio'], 'YYYY-MM-DD').format('DD-MM-YYYY');
                                        loadedActivity.FechaFin = moment(element['FechaFin'], 'YYYY-MM-DD').format('DD-MM-YYYY');
                                        loadedActivity.Activo = element['Activo'];
                                        loadedActivity['Editable'] = false;
                                      } else {
                                        loadedActivity.FechaInicio = moment(FechasParticulares.Inicio, 'YYYY-MM-DDTHH:mm:ss[Z]').format('DD-MM-YYYY');
                                        loadedActivity.FechaFin = moment(FechasParticulares.Fin, 'YYYY-MM-DDTHH:mm:ss[Z]').format('DD-MM-YYYY');
                                        loadedActivity.Activo = FechasParticulares.Activo;
                                        loadedActivity['Editable'] = true;
                                      }
                                      loadedActivity['FechaInicioOrg'] = moment(element['FechaInicio'], 'YYYY-MM-DD').format('DD-MM-YYYY');
                                      loadedActivity['FechaFinOrg'] = moment(element['FechaFin'], 'YYYY-MM-DD').format('DD-MM-YYYY');
                                      loadedActivity.responsables = element['Responsable'];
                                      loadedProcess.procesoId = element['TipoEventoId']['Id'];
                                      loadedProcess.Descripcion = element['TipoEventoId']['Descripcion'];
                                      let id_rec = element['TipoEventoId']['TipoRecurrenciaId']['Id']
                                      loadedProcess.TipoRecurrenciaId = { Id: id_rec, Nombre: this.periodicidad.find((rec: { Id: any; }) => rec.Id == id_rec).Nombre };
                                      loadedProcess.actividades.data.push(loadedActivity);
                                    }
                                  });
                                  this.processes.push(loadedProcess);
                                  this.dataSource = new MatTableDataSource(this.processes);
                                  this.datasourceActivity = new MatTableDataSource<Actividad>


                                  this.dataSource.paginator = this.paginator;
                                  this.dataSource.sort = this.sort;


                                }
                              }
                            });
                            this.loading = false;
                          } else {
                            this.loading = false;
                          }
                          if (<boolean>response.Data[0].AplicaExtension) {

                            this.popUpManager.showAlert(this.translate.instant('calendario.formulario_extension'), this.translate.instant('calendario.calendario_tiene_extension'));
                          }
                        },
                        error => {
                          this.loading = false;

                          this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
                        }
                      );
                    },
                    (error: any) => {
                      this.loading = false;

                      this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
                    }
                  );
                } else {
                  this.loading = false;

                  this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
                }
              }, (error: any) => {
                this.loading = false;

                this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
              }
            );
          },
          (error: any) => {
            this.loading = false;

            this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
          }
        );
      },
      error => {
        this.loading = false;

        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      }
    )
  }

  validJSONdeps(DepIds: string) {
    if (DepIds == "") {
      DepIds = "{\"proyectos\":[],\"fechas\":[]}"
    }
    let jsoncheck = JSON.parse(DepIds);
    if (!jsoncheck.hasOwnProperty("proyectos")) {
      jsoncheck['proyectos'] = [];
    }
    if (!jsoncheck.hasOwnProperty("fechas")) {
      jsoncheck['fechas'] = [];
    } else {
      jsoncheck.fechas.forEach((f: any) => {
        if (!f.hasOwnProperty("Activo")) {
          f['Activo'] = true;
        }
        if (!f.hasOwnProperty("Modificacion")) {
          f['Modificacion'] = "";
        }
        if (!f.hasOwnProperty("Fin")) {
          f['Fin'] = "";
        }
        if (!f.hasOwnProperty("Inicio")) {
          f['Inicio'] = "";
        }
        if (!f.hasOwnProperty("Id")) {
          f['Id'] = "";
        }
      });
    }
    return jsoncheck;
  }

  findDatesforDep(listDeps: any, DepId: number) {

    return listDeps.fechas.find((p: any) => p.Id == DepId)
  }


}