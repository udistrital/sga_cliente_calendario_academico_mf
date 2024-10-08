import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
//import { LocalDataSource } from 'ng2-smart-table';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ProcesoCalendarioAcademicoComponent } from '../proceso-calendario-academico/proceso-calendario-academico.component';
import { ActividadCalendarioAcademicoComponent } from '../actividad-calendario-academico/actividad-calendario-academico.component';
import { CrudPeriodoComponent } from '../crud-periodo/crud-periodo.component';
import { Proceso } from 'src/app/models/calendario-academico/proceso';
import { Actividad } from 'src/app/models/calendario-academico/actividad';
import { Calendario } from 'src/app/models/calendario-academico/calendario';
import { ActividadHija } from 'src/app/models/calendario-academico/actividadHija';
import { NivelFormacion } from 'src/app/models/proyecto_academico/nivel_formacion';
import { CalendarioClone } from 'src/app/models/calendario-academico/calendarioClone';
import { CalendarioEvento } from 'src/app/models/calendario-academico/calendarioEvento';
import * as moment from 'moment';
import * as momentTimezone from 'moment-timezone';

import { ParametrosService } from 'src/app/services/parametros.service';
import { DocumentoService } from 'src/app/services/documento.service';
//import { NuxeoService } from 'src/app/services/nuxeo.service';
import { NewNuxeoService } from 'src/app/services/new_nuxeo.service';
import { EventoService } from 'src/app/services/evento.service';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { ProyectoAcademicoService } from 'src/app/services/proyecto_academico.service';
import { EdicionActividadesProgramasComponent } from '../edicion-actividades-programas/edicion-actividades-programas.component';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SgaCalendarioMidService } from 'src/app/services/sga_calendario_mid.service';
import { ordenarPorPropiedad } from 'src/utils/listas';

@Component({
  selector: 'def-calendario-academico',
  templateUrl: './def-calendario-academico.component.html',
  styleUrls: ['./def-calendario-academico.component.scss'],
})
export class DefCalendarioAcademicoComponent implements OnChanges {
  fileResolucion: any;
  processSettings: any;
  activitiesSettings: any;
  processes: Proceso[];
  displayedColumns: string[] = ['Nombre', 'Descripcion', 'Acciones'];
  displayedColumnsActividades: string[] = [
    'Nombre',
    'Descripcion',
    'FechaInicio',
    'FechaFin',
    'Activo',
    'Acciones',
  ];
  displayedColumnsExtension: string[] = ['Nombre', 'Descripcion', 'Acciones'];
  dataSource!: MatTableDataSource<Proceso>;
  datasourceActivity!: MatTableDataSource<Actividad>;
  datasourceExtension!: MatTableDataSource<Proceso>;

  //processTable!: LocalDataSource;
  activities!: Actividad[];

  //calendar!: Calendario;
  calendar!: any;
  calendarActivity: ActividadHija;
  calendarClone!: CalendarioClone;
  calendarioEvento: CalendarioEvento;
  activetabs: boolean = false;
  activebutton: boolean = false;
  activetabsClone: boolean = false;
  //calendarForm!: FormGroup;
  calendarForm!: any;
  calendarFormClone!: FormGroup;
  createdCalendar: boolean = false;
  periodos: any;
  periodosClone: any;
  niveles!: NivelFormacion[];
  editMode: boolean = false;
  uploadMode: boolean = false;
  nivelSeleccionado: any;
  selectMultipleNivel: boolean = false;

  activetab: number = 0;
  proyectos!: any[];
  projects!: any[];
  Extension: boolean = false;
  //calendarFormExtend!: FormGroup;
  calendarFormExtend!: any;
  fileResolucionExt: any;
  ExtensionList!: any[];
  showList: boolean = false;
  selCalendar!: number;
  CalendarIdasfather!: number;
  fileExtId!: number;
  proyectosParticulares: any;
  processesExt: Proceso[];
  activitiesExt!: Actividad[];
  //processTableExt!: LocalDataSource;
  Ext_Extension: boolean = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  @Input({ required: true })
  view!: boolean;
  @Input()
  tab: number = 0;
  @Input()
  calendarForEditId: number = 0;
  @Input()
  calendarForNew: boolean = false;
  @Output()
  calendarCloneOut = new EventEmitter<number>();
  @Output()
  newCalendar = new EventEmitter<void>();

  constructor(
    private sanitization: DomSanitizer,
    private translate: TranslateService,
    private builder: FormBuilder,
    private dialog: MatDialog,
    private parametrosService: ParametrosService,
    //private nuxeoService: NuxeoService,
    private documentoService: DocumentoService,
    private eventoService: EventoService,
    private sgaCalendarioMidService: SgaCalendarioMidService,
    private proyectoService: ProyectoAcademicoService,
    private popUpManager: PopUpManager,
    private newNuxeoService: NewNuxeoService
  ) {
    this.calendarActivity = new ActividadHija();
    this.calendarioEvento = new CalendarioEvento();
    this.processes = [];
    this.processesExt = [];
    this.loadSelects();
    this.createCalendarFormClone();
    this.createCalendarFormExtend();
  }

  ngOnInit() {
    this.createCalendarForm();
  }

  clonarCalendario() {
    this.calendarClone = new CalendarioClone();
    this.calendarClone = this.calendarFormClone.value;
    this.calendarClone.Id = this.calendar.calendarioId;
    this.sgaCalendarioMidService
      .post('clonar-calendario/', this.calendarClone)
      .subscribe(
        (response: any) => {
          const r = <any>response;
          if (response !== null && r.Data.Code == '404') {
            this.activebutton = true;
            this.popUpManager.showErrorAlert(
              this.translate.instant('calendario.calendario_clon_error')
            );
          } else if (response !== null && r.Data.Code == '400') {
            this.activebutton = true;
            this.popUpManager.showErrorAlert(
              this.translate.instant('calendario.calendario_clon_error')
            );
          } else {
            this.activebutton = false;
            this.activetabsClone = false;
            this.activetabs = true;
            this.calendarCloneOut.emit(this.calendarClone.Id);
            this.popUpManager.showSuccessAlert(
              this.translate.instant('calendario.calendario_exito')
            );
          }
        },
        (error) => {
          this.popUpManager.showErrorToast(
            this.translate.instant('calendario.error_registro_calendario')
          );
        }
      );
  }

  ngOnChanges() {
    this.loadCalendar();
    //this.activetab = true;
  }

  loadCalendar() {
    this.processes = [];
    //this.processTable.load(this.processes);
    this.dataSource = new MatTableDataSource(this.processes);

    if (this.calendarForNew === true) {
      this.activetabs = false;
      this.createdCalendar = false;
      this.editMode = false;
      this.uploadMode = true;

      this.eventoService.get('calendario/' + this.calendarForEditId).subscribe(
        (calendar: any) => {
          this.calendar = new Calendario();
          this.calendar.calendarioId = calendar['Id'];
          this.calendar.DocumentoId = calendar['DocumentoId'];
          this.calendar.Nivel = calendar['Nivel'];
          this.calendar.Activo = calendar['Activo'];

          this.cambiarSelectPeriodoSegunNivel(this.calendar.Nivel);

          if (this.selectMultipleNivel) {
            this.calendar.PeriodoId = JSON.parse(
              calendar['MultiplePeriodoId']
            ).map(Number);
          } else {
            this.calendar.PeriodoId = calendar['PeriodoId'];
          }

          this.calendarForm.patchValue({
            resolucion: this.calendar.resolucion,
            anno: this.calendar.anno,
            //segun el nivel, puede ser multiple o no
            PeriodoId: this.calendar.PeriodoId,
            Nivel: this.calendar.Nivel,
            fileResolucion: '',
          });
        },
        (error: any) => {
          this.popUpManager.showErrorToast(
            this.translate.instant('ERROR.general')
          );
        }
      );
    } else if (this.calendarForEditId === 0) {
      this.activetabs = false;
      this.activetabsClone = false;
      this.createdCalendar = false;
      this.editMode = false;
      this.uploadMode = true;
      if (this.calendarForm) this.calendarForm.reset();
      this.fileResolucion = null;
    } else {
      this.createdCalendar = true;
      this.editMode = true;
      this.uploadMode = false;
      this.openTabs();
      this.CalendarIdasfather = this.calendarForEditId;
      this.sgaCalendarioMidService
        .get('calendario-academico/v2/' + this.calendarForEditId)
        .subscribe(
          (response: any) => {
            if (response != null && response.Success) {
              const calendar = response.Data[0];
              this.calendar = new Calendario();
              this.calendar.calendarioId = parseInt(calendar['Id']);
              this.calendar.DocumentoId = calendar['resolucion']['Id'];
              this.calendar.resolucion = calendar['resolucion']['Resolucion'];
              this.calendar.anno = calendar['resolucion']['Anno'];
              this.calendar.Nivel = calendar['Nivel'];
              this.calendar.Activo = calendar['Activo'];
              this.fileResolucion = calendar['resolucion']['Nombre'];
              this.projects = this.proyectos.filter((proyecto) =>
                this.filterProject(
                  JSON.parse(calendar['DependenciaId']).proyectos,
                  proyecto.Id
                )
              );
              this.Extension = calendar['ExistenExtensiones'];

              this.cambiarSelectPeriodoSegunNivel(this.calendar.Nivel);

              if (this.selectMultipleNivel) {
                this.calendar.PeriodoId = JSON.parse(
                  calendar['MultiplePeriodoId']
                ).map(Number);
              } else {
                this.calendar.PeriodoId = calendar['PeriodoId'];
              }

              if (this.Extension) {
                this.ExtensionList = calendar['ListaExtension'];
                if (this.ExtensionList.length > 1) {
                  this.showList = true;
                }
              }
              const processes: any[] = calendar['proceso'];
              if (processes !== null) {
                processes.forEach((element) => {
                  if (Object.keys(element).length !== 0) {
                    const loadedProcess: Proceso = new Proceso();
                    loadedProcess.Nombre = element['Proceso'];
                    loadedProcess.CalendarioId = {
                      Id: this.calendar.calendarioId,
                    };
                    loadedProcess.actividades =
                      new MatTableDataSource<Actividad>();
                    const activities: any[] = element['Actividades'];
                    if (activities !== null) {
                      activities.forEach((element) => {
                        if (
                          Object.keys(element).length !== 0 &&
                          element['EventoPadreId'] == null
                        ) {
                          const loadedActivity: Actividad = new Actividad();
                          loadedActivity.actividadId = element['actividadId'];
                          loadedActivity.TipoEventoId = {
                            Id: element['TipoEventoId']['Id'],
                          };
                          loadedActivity.Nombre = element['Nombre'];
                          loadedActivity.Descripcion = element['Descripcion'];
                          loadedActivity.Activo = element['Activo'];
                          loadedActivity.FechaInicio = moment(
                            element['FechaInicio'],
                            'YYYY-MM-DD'
                          ).format('DD-MM-YYYY');
                          loadedActivity.FechaFin = moment(
                            element['FechaFin'],
                            'YYYY-MM-DD'
                          ).format('DD-MM-YYYY');
                          loadedActivity.responsables = element['Responsable'];
                          loadedActivity['DependenciaId'] = this.validJSONdeps(
                            element['DependenciaId']
                          );
                          loadedProcess.procesoId =
                            element['TipoEventoId']['Id'];
                          loadedProcess.Descripcion =
                            element['TipoEventoId']['Descripcion'];
                          loadedProcess.TipoRecurrenciaId = {
                            Id: element['TipoEventoId']['TipoRecurrenciaId'][
                              'Id'
                            ],
                          };
                          loadedProcess.actividades.data.push(loadedActivity);
                        }
                      });
                      this.processes.push(loadedProcess);
                    }
                  }
                });

                this.dataSource = new MatTableDataSource(this.processes);
                this.datasourceActivity = new MatTableDataSource<Actividad>();
              }
              this.calendarForm.patchValue({
                resolucion: this.calendar.resolucion,
                anno: this.calendar.anno,
                //segun el nivel, puede ser multiple o no
                PeriodoId: this.calendar.PeriodoId,
                Nivel: this.calendar.Nivel,
                fileResolucion: '',
              });

              if (!this.Extension) {
                this.calendarFormExtend.patchValue({
                  Nivel: this.calendarForm.controls.Nivel.value,
                  PeriodoId: this.calendarForm.controls.PeriodoId.value,
                });
                this.activetab = 0;
              } else {
                this.popUpManager.showAlert(
                  this.translate.instant('calendario.formulario_extension'),
                  this.translate.instant(
                    'calendario.calendario_tiene_extension'
                  )
                );
                this.activetab = 1;
                this.ExtensionList.sort((a, b) => (a.Id < b.Id ? 1 : -1));
                this.selCalendar = this.ExtensionList[0].Id;
                this.loadExtension(this.ExtensionList[0].Id);
              }
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
    }
  }

  applyFilterProces(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyFilterActividades(event: Event, data: any, i: number) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.processes[i].actividades.filter = filterValue.trim().toLowerCase();
    this.datasourceActivity = data;
  }

  loadExtension(IdExt: number) {
    this.sgaCalendarioMidService
      .get('calendario-academico/v2/' + IdExt)
      .subscribe(
        (response: any) => {
          if (response != null && response.Success) {
            this.proyectosParticulares = JSON.parse(
              response.Data[0].DependenciaParticularId
            );
            this.projects = this.proyectos.filter((proyecto) =>
              this.filterProject(
                this.proyectosParticulares.proyectos,
                proyecto.Id
              )
            );
            this.cambiarSelectPeriodoSegunNivel(response.Data[0].Nivel);

            let periodo;
            if (this.selectMultipleNivel) {
              periodo = JSON.parse(response.Data[0]['MultiplePeriodoId']).map(
                Number
              );
            } else {
              periodo = response.Data[0]['PeriodoId'];
            }

            this.calendarFormExtend.patchValue({
              Nivel: response.Data[0].Nivel,
              PeriodoId: periodo,
              resolucion: response.Data[0].resolucionExt.Resolucion,
              anno: response.Data[0].resolucionExt.Anno,
              fileResolucion: '',
              selProyectos: this.proyectosParticulares.proyectos,
            });
            this.fileExtId = response.Data[0].resolucionExt.Id;

            this.processesExt = [];
            this.activitiesExt = [];
            const calendarExt = response.Data[0];
            const processes: any[] = calendarExt['proceso'];
            if (processes !== null) {
              processes.forEach((element) => {
                if (Object.keys(element).length !== 0) {
                  const loadedProcess: Proceso = new Proceso();
                  loadedProcess.Nombre = element['Proceso'];
                  loadedProcess.CalendarioId = {
                    Id: parseInt(calendarExt['Id']),
                  };
                  loadedProcess.actividades = new MatTableDataSource();
                  const activities: any[] = element['Actividades'];
                  if (activities !== null) {
                    activities.forEach((element) => {
                      if (
                        Object.keys(element).length !== 0 &&
                        element['EventoPadreId'] == null
                      ) {
                        const loadedActivity: Actividad = new Actividad();
                        loadedActivity.actividadId = element['actividadId'];
                        loadedActivity.TipoEventoId = {
                          Id: element['TipoEventoId']['Id'],
                        };
                        loadedActivity.Nombre = element['Nombre'];
                        loadedActivity.Descripcion = element['Descripcion'];
                        loadedActivity.Activo = element['Activo'];
                        loadedActivity.FechaInicio = moment(
                          element['FechaInicio'],
                          'YYYY-MM-DD'
                        ).format('DD-MM-YYYY');
                        loadedActivity.FechaFin = moment(
                          element['FechaFin'],
                          'YYYY-MM-DD'
                        ).format('DD-MM-YYYY');
                        loadedActivity.responsables = element['Responsable'];
                        loadedActivity['DependenciaId'] = this.validJSONdeps(
                          element['DependenciaId']
                        );
                        loadedProcess.procesoId = element['TipoEventoId']['Id'];
                        loadedProcess.Descripcion =
                          element['TipoEventoId']['Descripcion'];
                        loadedProcess.TipoRecurrenciaId = {
                          Id: element['TipoEventoId']['TipoRecurrenciaId'][
                            'Id'
                          ],
                        };
                        loadedProcess.actividades.data.push(loadedActivity);
                      }
                    });
                    this.processesExt.push(loadedProcess);
                    this.datasourceExtension = new MatTableDataSource(
                      this.processesExt
                    );
                  }
                }
              });

              //this.processTableExt.load(this.processesExt);
              if (!(<boolean>response.Data[0].Activo)) {
                this.popUpManager.showAlert(
                  this.translate.instant('calendario.formulario_extension'),
                  this.translate.instant('calendario.extension_inactiva')
                );
              }
            }
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
  }

  createCalendarForm() {
    this.calendarForm = this.builder.group({
      resolucion: [
        {
          value: '',
          disabled: this.view,
        },
        Validators.required,
      ],
      anno: new FormControl('', {
        validators: [
          Validators.required,
          Validators.maxLength(4),
          Validators.pattern('^[0-9]*$'),
        ],
      }),
      PeriodoId: ['', Validators.required],
      Nivel: '',
      fileResolucion: ['', Validators.required],
    });
  }

  createCalendarFormClone() {
    this.calendarFormClone = this.builder.group({
      PeriodoIdClone: '',
      NivelClone: '',
    });
  }

  createCalendarFormExtend() {
    this.calendarFormExtend = this.builder.group({
      resolucion: ['', Validators.required],
      anno: new FormControl('', {
        validators: [
          Validators.required,
          Validators.maxLength(4),
          Validators.pattern('^[0-9]*$'),
        ],
      }),
      PeriodoId: ['', Validators.required],
      Nivel: ['', Validators.required],
      fileResolucion: ['', Validators.required],
      selProyectos: ['', Validators.required],
    });
  }

  loadSelects() {
    this.proyectoService.get('nivel_formacion?limit=0').subscribe(
      (response: any) => {
        const nombresFiltrados = ['Pregrado', 'Posgrado', 'Doctorado'];
        this.niveles = nombresFiltrados.flatMap((nombre: any) =>
          response.filter((item: any) => item.Nombre === nombre)
        );
      },
      (error) => {
        this.popUpManager.showErrorToast(
          this.translate.instant('ERROR.general')
        );
      }
    );
    this.parametrosService
      .get(
        'periodo?query=CodigoAbreviacion:PA&query=Activo:true&sortby=Id&order=desc&limit=0'
      )
      .subscribe(
        (res: any) => {
          this.periodos = ordenarPorPropiedad(res.Data, 'Nombre', -1);
        },
        (error) => {
          this.popUpManager.showErrorToast(
            this.translate.instant('ERROR.general')
          );
          this.periodos = [{ Id: 15, Nombre: '2019-3' }];
        }
      );

    this.proyectoService
      .get('proyecto_academico_institucion?fields=Id,Nombre&limit=0')
      .subscribe(
        (res) => {
          this.proyectos = <any[]>(<any>res);
        },
        (error) => {
          this.popUpManager.showErrorToast(
            this.translate.instant('ERROR.general')
          );
        }
      );
  }

  loadSelectsClone() {
    this.parametrosService
      .get(
        'periodo?query=CodigoAbreviacion:PA&query=Activo:true&sortby=Id&order=desc&limit=0'
      )
      .subscribe(
        (res: any) => {
          this.periodos = ordenarPorPropiedad(res.Data, 'Nombre', -1);
        },
        (error) => {
          this.popUpManager.showErrorToast(
            this.translate.instant('ERROR.general')
          );
          this.periodosClone = [{ Id: 15, Nombre: '2019-3' }];
        }
      );
  }

  cambiarSelectPeriodoSegunNivel(nivelSeleccionado: any) {
    const idNivelDoctorado = this.niveles.find(
      (nivel) => nivel.Nombre === 'Doctorado'
    )!.Id;
    if (idNivelDoctorado == nivelSeleccionado) {
      this.selectMultipleNivel = true;
      return;
    }
    this.selectMultipleNivel = false;
  }

  onAction(event: any, process: any) {
    switch (event.action) {
      case 'edit':
        this.editActivity(event, process);
        break;
      case 'delete':
        this.deleteActivity(event, process);
        break;
      case 'select':
        this.selectDependencias(event, process);
        break;
      case 'view':
        this.viewActivities(event, process);
        break;
    }
  }

  selectDependencias(event: any, process: any) {
    const activityConfig = new MatDialogConfig();
    activityConfig.width = '600px';
    activityConfig.height = '370px';
    activityConfig.data = {
      calendar: this.calendar,
      activity: event.data,
      dependencias: this.projects,
      vista: 'select',
    };

    const newActivity = this.dialog.open(
      EdicionActividadesProgramasComponent,
      activityConfig
    );
    newActivity.afterClosed().subscribe((DepsEdit: any) => {
      if (DepsEdit != undefined) {
        this.eventoService
          .get('calendario_evento/' + event.data.actividadId)
          .subscribe(
            (respGet: any) => {
              respGet.DependenciaId = JSON.stringify(
                DepsEdit.UpdateDependencias
              );
              this.eventoService.put('calendario_evento', respGet).subscribe(
                (respPut) => {
                  this.popUpManager.showSuccessAlert(
                    this.translate.instant('calendario.actividad_actualizada')
                  );
                  this.loadCalendar();
                },
                (error) => {
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

  viewActivities(event: any, process: any) {
    const activityConfig = new MatDialogConfig();
    activityConfig.width = '800px';
    activityConfig.height = '500px';
    activityConfig.data = {
      activity: event.data,
      projects: this.projects,
      vista: 'view',
    };
    const newActivity = this.dialog.open(
      EdicionActividadesProgramasComponent,
      activityConfig
    );
    newActivity.afterClosed().subscribe((activity: any) => {});
  }

  createCalendar(event: any) {
    event.preventDefault();
    if (this.calendarForNew === false) {
      this.activebutton = true;
      this.popUpManager
        .showConfirmAlert(
          this.translate.instant('calendario.seguro_registrar_calendario')
        )
        .then((ok) => {
          if (ok.value) {
            if (this.fileResolucion) {
              this.calendar = this.calendarForm.value;
              this.eventoService.get('calendario?query=Activo:true').subscribe(
                (response: Calendario[]) => {
                  let calendarExists = false;
                  if (this.selectMultipleNivel == true) {
                    response.forEach((calendar) => {
                      let stringSet = new Set(
                        calendar.MultiplePeriodoId.split(',').map(Number)
                      );
                      const sameElements: boolean =
                        this.calendar.PeriodoId.length === stringSet.size &&
                        this.calendar.PeriodoId.every((element: any) =>
                          stringSet.has(element)
                        );
                      calendarExists = calendarExists || sameElements;
                    });
                  } else {
                    response.forEach((calendar) => {
                      calendarExists =
                        calendarExists ||
                        (this.calendar.Nivel === calendar.Nivel &&
                          this.calendar.PeriodoId === calendar.PeriodoId);
                    });
                  }
                  if (calendarExists) {
                    this.popUpManager.showErrorAlert(
                      this.translate.instant('calendario.calendario_existe')
                    );
                  } else {
                    this.uploadResolutionFile(this.fileResolucion)
                      .then((fileID: any) => {
                        this.calendar.DocumentoId = fileID;
                        this.calendar.DependenciaId = '{}';
                        this.calendar.Activo = true;
                        this.calendar['DependenciaParticularId'] = '{}';
                        this.calendar.Nombre = 'Calendario Académico ';
                        if (this.selectMultipleNivel == true) {
                          // filtra por periodos y solo se queda con la vigencia's
                          const vigenciaS = new Set(
                            this.periodos
                              .filter((periodo: any) =>
                                this.calendar.PeriodoId.includes(periodo.Id)
                              )
                              .map((periodo: any) =>
                                periodo.Nombre.replace(/-\d+/, '')
                              )
                              .sort()
                          );

                          this.calendar.Nombre +=
                            Array.from(vigenciaS).join(', ');
                          this.calendar.MultiplePeriodoId = JSON.stringify(
                            this.calendar.PeriodoId
                          );
                          //console.log(this.calendar.MultiplePeriodoId);
                          const minPeriodoId = Math.min(
                            ...this.periodos
                              .filter((periodo: { Id: any; }) => this.calendar.PeriodoId.includes(periodo.Id))
                              .map((periodo: { Id: any; }) => periodo.Id)
                          );
                          this.calendar.PeriodoId = minPeriodoId;
                          //console.log(this.calendar.PeriodoId);
                          //this.calendar.PeriodoId = 0;
                        } else {
                          this.calendar.Nombre += this.periodos.filter(
                            (periodo: any) =>
                              periodo.Id === this.calendar.PeriodoId
                          )[0].Nombre;
                        }
                        this.calendar.Nombre +=
                          ' ' +
                          this.niveles.filter(
                            (nivel: any) => nivel.Id === this.calendar.Nivel
                          )[0].Nombre;

                        this.eventoService
                          .post('calendario', this.calendar)
                          .subscribe(
                            (response: any) => {
                              this.calendar.calendarioId = response['Id'];
                              this.createdCalendar = true;
                              this.popUpManager.showSuccessAlert(
                                this.translate.instant(
                                  'calendario.calendario_exito'
                                )
                              );
                              this.newCalendar.emit();
                            },
                            (error) => {
                              this.popUpManager.showErrorToast(
                                this.translate.instant(
                                  'calendario.error_registro_calendario'
                                )
                              );
                            }
                          );
                      })
                      .catch((error) => {
                        this.popUpManager.showErrorToast(
                          this.translate.instant('ERROR.error_subir_documento')
                        );
                      });
                  }
                },
                (error: any) => {
                  this.popUpManager.showErrorToast(
                    this.translate.instant('ERROR.general')
                  );
                }
              );
            } else {
              this.popUpManager.showErrorToast(
                this.translate.instant('ERROR.no_documento')
              );
            }
          }
        });
    } else {
      this.activebutton = true;
      this.popUpManager
        .showConfirmAlert(
          this.translate.instant('calendario.seguro_registrar_calendario')
        )
        .then((ok) => {
          if (ok.value) {
            if (this.fileResolucion) {
              this.calendar = this.calendarForm.value;
              this.uploadResolutionFile(this.fileResolucion)
                .then((fileID) => {
                  this.calendar.DocumentoId = fileID;
                  this.calendar.DependenciaId = '{}';
                  this.calendar.Activo = true;

                  this.calendar.Nombre = 'Calendario Académico ';
                  if (this.selectMultipleNivel == true) {
                    // filtra por periodos y solo se queda con la vigencia's
                    const vigenciaS = new Set(
                      this.periodos
                        .filter((periodo: any) =>
                          this.calendar.PeriodoId.includes(periodo.Id)
                        )
                        .map((periodo: any) =>
                          periodo.Nombre.replace(/-\d+/, '')
                        )
                        .sort()
                    );

                    this.calendar.Nombre += Array.from(vigenciaS).join(', ');
                    this.calendar.MultiplePeriodoId = JSON.stringify(
                      this.calendar.PeriodoId
                    );
                    this.calendar.PeriodoId = 0;
                  } else {
                    this.calendar.Nombre += this.periodos.filter(
                      (periodo: any) => periodo.Id === this.calendar.PeriodoId
                    )[0].Nombre;
                  }
                  this.calendar.Nombre +=
                    ' ' +
                    this.niveles.filter(
                      (nivel: any) => nivel.Id === this.calendar.Nivel
                    )[0].Nombre;
                  this.calendar.AplicacionId = 0;
                  this.calendar.FechaCreacion = momentTimezone
                    .tz(this.calendar.FechaCreacion, 'America/Bogota')
                    .format('YYYY-MM-DD HH:mm');
                  this.calendar.FechaModificacion = momentTimezone
                    .tz(this.calendar.FechaModificacion, 'America/Bogota')
                    .format('YYYY-MM-DD HH:mm');
                  this.calendar.CalendarioPadreId = {
                    Id: this.calendarForEditId,
                  };
                  this.sgaCalendarioMidService
                    .post('calendario-academico/padre', this.calendar)
                    .subscribe(
                      (response: any) => {
                        this.calendar.calendarioId = response.Data['Id'];
                        this.clonarPadre();
                      },
                      (error) => {
                        this.popUpManager.showErrorToast(
                          this.translate.instant(
                            'calendario.error_registro_calendario'
                          )
                        );
                      }
                    );
                })
                .catch((error) => {
                  this.popUpManager.showErrorToast(
                    this.translate.instant('ERROR.error_subir_documento')
                  );
                });
            } else {
              this.popUpManager.showErrorToast(
                this.translate.instant('ERROR.no_documento')
              );
            }
          }
        });
    }
  }

  clonarPadre() {
    this.calendarClone = new CalendarioClone();
    this.calendarClone.Id = this.calendar.calendarioId;
    this.calendarClone.Nivel = this.calendar.Nivel;
    this.calendarClone.IdPadre = { Id: this.calendarForEditId };
    if (this.selectMultipleNivel) {
      this.calendarClone.MultiplePeriodoId = JSON.stringify(
        this.calendar.MultiplePeriodoId
      );
      this.calendarClone.PeriodoId = 0;
    } else {
      this.calendarClone.PeriodoId = this.calendar.PeriodoId;
    }

    this.sgaCalendarioMidService
      .post('clonar-calendario/padre', this.calendarClone)
      .subscribe(
        (response: any) => {

          if (response != null && response.Status == '404') {
            this.activebutton = true;
            this.popUpManager.showErrorAlert(
              this.translate.instant('calendario.calendario_clon_error')
            );
          } else if (response != null && response.Status == '400') {
            this.activebutton = true;
            this.popUpManager.showErrorAlert(
              this.translate.instant('calendario.calendario_clon_error')
            );
          } else {
            this.calendarClone.Id = response.Data.Id;
            this.activebutton = false;
            this.activetabsClone = false;
            this.activetabs = true;
            this.calendarForNew = false;
            this.calendarCloneOut.emit(this.calendarClone.Id);
            this.popUpManager.showSuccessAlert(
              this.translate.instant('calendario.calendario_exito')
            );
            this.popUpManager.showInfoToast(
              this.translate.instant('calendario.clonar_calendario_fechas')
            );
          }
        },
        (error) => {
          this.popUpManager.showErrorToast(
            this.translate.instant('calendario.error_registro_calendario')
          );
        }
      );
  }

  uploadResolutionFile(file: any) {
    return new Promise((resolve, reject) => {
      this.newNuxeoService.uploadFiles([file]).subscribe(
        (responseNux: any[]) => {
          if (responseNux[0].Status == '200') {
            resolve(responseNux[0].res.Id);
          } else {
            reject();
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  addPeriod() {
    const periodConfig = new MatDialogConfig();
    periodConfig.width = '800px';
    periodConfig.height = '400px';
    const newPeriod = this.dialog.open(CrudPeriodoComponent, periodConfig);
    newPeriod.afterClosed().subscribe(() => {
      this.loadSelects();
    });
  }

  addProcess(event: any) {
    const processConfig = new MatDialogConfig();
    processConfig.width = '800px';
    processConfig.height = '400px';
    processConfig.data = { calendar: this.calendar };
    const newProcess = this.dialog.open(
      ProcesoCalendarioAcademicoComponent,
      processConfig
    );
    newProcess.afterClosed().subscribe((process: Proceso) => {
      if (process !== undefined) {
        this.eventoService.post('tipo_evento', process).subscribe(
          async (response: any) => {
            process.procesoId = response['Id'];
            process.actividades = new MatTableDataSource<Actividad>();
            this.processes.push(process);
            this.addActivity(null, process);
            //this.processTable.load(this.processes);

            await this.popUpManager.showSuccessAlert(
              this.translate.instant('calendario.proceso_exito')
            );
            await this.popUpManager.showAlert(
              this.translate.instant('calendario.tooltip_crear_actividad'),
              this.translate.instant('calendario.crear_actividad_proceso')
            );
          },
          (error) => {
            this.popUpManager.showErrorToast(
              this.translate.instant('calendario.error_registro_proceso')
            );
          }
        );
      }
    });
  }

  editProcess(event: any) {
    const processConfig = new MatDialogConfig();
    processConfig.width = '800px';
    processConfig.height = '400px';
    processConfig.data = { calendar: this.calendar, editProcess: event.data };
    const editedProcess = this.dialog.open(
      ProcesoCalendarioAcademicoComponent,
      processConfig
    );
    editedProcess.afterClosed().subscribe((process: Proceso) => {
      if (process != undefined) {
        this.eventoService.get('tipo_evento/' + event.data.procesoId).subscribe(
          (response: any) => {
            const processPut = response;
            processPut['Nombre'] = process.Nombre;
            processPut['Descripcion'] = process.Descripcion;
            processPut['TipoRecurrenciaId'] = process.TipoRecurrenciaId;
            this.eventoService.put('tipo_evento', processPut).subscribe(
              (response) => {
                //this.processTable.update(event.data, process)
                this.popUpManager.showSuccessAlert(
                  this.translate.instant('calendario.proceso_actualizado')
                );
              },
              (error) => {
                this.popUpManager.showErrorToast(
                  this.translate.instant('calendario.error_registro_proceso')
                );
              }
            );
          },
          (error: any) => {
            this.popUpManager.showErrorToast(
              this.translate.instant('calendario.error_registro_proceso')
            );
          }
        );
      }
    });
  }

  deleteProcess(event: any) {
    this.popUpManager
      .showConfirmAlert(
        this.translate.instant('calendario.seguro_inactivar_proceso')
      )
      .then((willDelete) => {
        if (willDelete.value) {
          this.eventoService
            .get('tipo_evento/' + event.data.procesoId)
            .subscribe(
              (response: any) => {
                const processInative = response;
                processInative['Activo'] = false;
                this.eventoService.put('tipo_evento', processInative).subscribe(
                  (response) => {
                    //this.processTable.update(event.data, process)
                    this.popUpManager.showSuccessAlert(
                      this.translate.instant('calendario.proceso_desactivado')
                    );
                  },
                  (error) => {
                    this.popUpManager.showErrorToast(
                      this.translate.instant(
                        'calendario.error_inactivar_proceso'
                      )
                    );
                  }
                );
              },
              (error: any) => {
                this.popUpManager.showErrorToast(
                  this.translate.instant('calendario.error_inactivar_proceso')
                );
              }
            );
        }
      });
  }

  addActivity(event: any, process: Proceso) {
    const activityConfig = new MatDialogConfig();
    activityConfig.width = '800px';
    activityConfig.height = '700px';
    activityConfig.data = { process: process, calendar: this.calendar };
    const newActivity = this.dialog.open(
      ActividadCalendarioAcademicoComponent,
      activityConfig
    );
    newActivity.afterClosed().subscribe((activity: any) => {
      if (activity !== undefined) {
        this.sgaCalendarioMidService
          .post('actividad-calendario', activity)
          .subscribe(
            (response: any) => {
              let actividad: Actividad = new Actividad();
              actividad = activity.Actividad;
              actividad.actividadId = response.Data['Id'];
              actividad.responsables = activity.responsable;
              actividad.FechaInicio = moment(
                actividad.FechaInicio,
                'YYYY-MM-DD'
              ).format('DD-MM-YYYY');
              actividad.FechaFin = moment(
                actividad.FechaFin,
                'YYYY-MM-DD'
              ).format('DD-MM-YYYY');
              this.processes
                .filter(
                  (proc: Proceso) => proc.procesoId === process.procesoId
                )[0]
                .actividades.data.push(actividad);
              if (event) {
                event.source.load(process.actividades.data);
              } else {
                this.loadCalendar();
              }
              this.popUpManager.showSuccessAlert(
                this.translate.instant('calendario.actividad_exito')
              );
            },
            (error) => {
              this.popUpManager.showErrorToast(
                this.translate.instant('calendario.error_registro_actividad')
              );
            }
          );
      }
    });
    //this.processTable.load(this.processes);
  }

  editActivity(event: any, process: Proceso) {
    const activityConfig = new MatDialogConfig();
    activityConfig.width = '800px';
    activityConfig.height = '700px';
    activityConfig.data = {
      process: process,
      calendar: this.calendar,
      editActivity: event.data,
    };
    const editedActivity = this.dialog.open(
      ActividadCalendarioAcademicoComponent,
      activityConfig
    );
    editedActivity.afterClosed().subscribe((activity: any) => {
      if (activity !== undefined) {
        this.eventoService
          .get('calendario_evento/' + event.data.actividadId)
          .subscribe(
            (response: any) => {
              const activityPut = response;
              activityPut['Nombre'] = activity.Actividad.Nombre;
              activityPut['Descripcion'] = activity.Actividad.Descripcion;
              activityPut['FechaInicio'] = activity.Actividad.FechaInicio;
              activityPut['FechaFin'] = activity.Actividad.FechaFin;
              this.eventoService
                .put('calendario_evento', activityPut)
                .subscribe(
                  (response) => {
                    this.sgaCalendarioMidService
                      .put('actividad-calendario/calendario/actividad/', {
                        Id: event.data.actividadId,
                        resp: activity.responsable,
                      })
                      .subscribe(
                        (response) => {
                          this.popUpManager.showSuccessAlert(
                            this.translate.instant(
                              'calendario.actividad_actualizada'
                            )
                          );
                          this.ngOnChanges();
                        },
                        (error) => {
                          this.popUpManager.showErrorToast(
                            this.translate.instant(
                              'calendario.error_registro_actividad'
                            )
                          );
                        }
                      );
                  },
                  (error) => {
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

  deleteActivity(event: any, process: Proceso) {
    this.popUpManager
      .showConfirmAlert(
        this.translate.instant('calendario.seguro_inactivar_actividad')
      )
      .then((willDelete) => {
        if (willDelete.value) {
          this.eventoService
            .get('calendario_evento/' + event.data.actividadId)
            .subscribe(
              (response: any) => {
                const activityInactive = response;
                activityInactive['Activo'] = false;
                this.eventoService
                  .put('calendario_evento', activityInactive)
                  .subscribe(
                    (response) => {
                      this.popUpManager.showSuccessAlert(
                        this.translate.instant(
                          'calendario.actividad_desactivada'
                        )
                      );
                      this.ngOnChanges();
                    },
                    (error) => {
                      this.popUpManager.showErrorToast(
                        this.translate.instant(
                          'calendario.error_inactivar_actividad'
                        )
                      );
                    }
                  );
              },
              (error: any) => {
                this.popUpManager.showErrorToast(
                  this.translate.instant('calendario.error_inactivar_actividad')
                );
              }
            );
        }
      });
  }

  openTabs() {
    this.activebutton = false;
    this.activetabs = true;
    this.activetabsClone = false;
  }

  openTabsClone() {
    this.loadSelectsClone();
    this.activetabsClone = true;
    this.activetabs = false;
  }

  cleanURL(oldURL: string): SafeResourceUrl {
    return this.sanitization.bypassSecurityTrustUrl(oldURL);
  }

  onInputFileResolucion(event: any) {
    this.fileResolucion = null;
    if (
      this.calendarForm.get('resolucion').valid &&
      this.calendarForm.get('anno').valid
    ) {
      if (
        event.target.files.length > 0 &&
        event.target.files[0].type === 'application/pdf'
      ) {
        this.fileResolucion = {
          IdDocumento: 14,
          nombre: 'Creación_Calendario',
          metadatos: {
            resolucion: this.calendarForm.value.resolucion,
            anno: this.calendarForm.value.anno,
          },
          descripcion: 'Creación_Calendario',
          file: event.target.files[0],
        };
      } else {
        this.popUpManager.showErrorToast(
          this.translate.instant('ERROR.formato_documento_pdf')
        );
        this.calendarForm.patchValue({
          fileResolucion: '',
        });
      }
    } else {
      this.popUpManager.showErrorToast(
        this.translate.instant('calendario.error_pre_file')
      );
      this.calendarForm.patchValue({
        fileResolucion: '',
      });
    }
  }

  downloadFile(id_documento: any) {
    this.newNuxeoService.get([{ Id: id_documento }]).subscribe((response) => {
      const filesResponse = <any>response;
      const url = filesResponse[0].url;
      window.open(url);
    });
  }

  changeTab(event: any) {
    if (event.tabTitle == 'Extensión Calendario') {
      this.activetab = 1;
    } else {
      this.activetab = 0;
    }
  }

  filterProject(DepIds: any, DepInfo: any) {
    let found = false;
    if (DepIds != undefined) {
      for (let i = 0; i < DepIds.length; i++) {
        if (DepIds[i] == DepInfo) {
          found = true;
        }
      }
    }
    return found;
  }

  extendCalendar(event: any) {
    event.preventDefault();
    var files = [this.fileResolucionExt];
    this.popUpManager
      .showConfirmAlert(
        this.translate.instant('calendario.seguro_extension'),
        this.translate.instant('calendario.formulario_extension')
      )
      .then((accion) => {
        if (accion.value) {
          this.newNuxeoService.uploadFiles(files).subscribe(
            (responseNux: any[]) => {
              if (responseNux[0].Status == '200') {
                this.popUpManager.showInfoToast(
                  this.translate.instant('calendario.archivo_extension_saved')
                );
                var bodyPost = {
                  CalendarioPadre: this.CalendarIdasfather,
                  DocumentoExtensionId: responseNux[0].res.Id,
                  Dependencias: JSON.stringify({
                    proyectos:
                      this.calendarFormExtend.controls.selProyectos.value,
                  }),
                };
                this.sgaCalendarioMidService
                  .post('clonar-calendario/extension', bodyPost)
                  .subscribe(
                    (resp: any) => {
                      if (resp.Status == 200) {
                        if (this.Ext_Extension) {
                          this.sgaCalendarioMidService
                            .put(
                              'calendario-academico/calendario/academico/' +
                                this.selCalendar +
                                '/inhabilitar',
                              JSON.stringify({ id: this.selCalendar })
                            )
                            .subscribe(
                              (response: any) => {
                                if (response.Status != 200) {
                                  this.popUpManager.showErrorToast(
                                    this.translate.instant(
                                      'calendario.calendario_no_inhabilitado'
                                    )
                                  );
                                } else {
                                  this.popUpManager.showInfoToast(
                                    this.translate.instant(
                                      'calendario.calendario_inhabilitado'
                                    )
                                  );
                                }
                              },
                              (error) => {
                                this.popUpManager.showErrorToast(
                                  this.translate.instant(
                                    'calendario.error_registro_calendario'
                                  )
                                );
                              }
                            );
                        }
                        this.popUpManager.showSuccessAlert(
                          this.translate.instant(
                            'calendario.Extension_calendario_ok'
                          )
                        );
                        this.Extension = true;
                        this.loadCalendar();
                        /////////////
                      } else {
                        this.popUpManager.showErrorToast(
                          this.translate.instant('ERROR.general')
                        );
                      }
                    },
                    (error) => {
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
            (errorNux) => {
              this.popUpManager.showErrorToast(
                this.translate.instant('ERROR.general')
              );
            }
          );
        }
      });
  }

  prepareNewExtension() {
    this.calendarFormExtend.patchValue({
      resolucion: '',
      anno: '',
      fileResolucion: '',
      selProyectos: [],
    });
    this.Extension = false;
    this.Ext_Extension = true;
  }

  async onInputFileResolucionExt(event: any) {
    this.fileResolucionExt = null;
    if (
      this.calendarFormExtend.get('resolucion').valid &&
      this.calendarFormExtend.get('anno').valid
    ) {
      if (
        event.target.files.length > 0 &&
        event.target.files[0].type === 'application/pdf'
      ) {
        this.fileResolucionExt = {
          IdDocumento: 14,
          nombre: 'Extension_Calendario',
          metadatos: {
            resolucion: this.calendarFormExtend.value.resolucion,
            anno: this.calendarFormExtend.value.anno,
          },
          descripcion: 'Extension_Calendario',
          file: event.target.files[0],
        };
      } else {
        this.popUpManager.showErrorToast(
          this.translate.instant('ERROR.formato_documento_pdf')
        );
        this.calendarFormExtend.patchValue({
          fileResolucion: '',
        });
      }
    } else {
      this.popUpManager.showErrorToast(
        this.translate.instant('calendario.error_pre_file')
      );
      this.calendarFormExtend.patchValue({
        fileResolucion: '',
      });
    }
  }

  downloadFileExt(id_documento: any) {
    this.newNuxeoService.get([{ Id: id_documento }]).subscribe((response) => {
      const filesResponse = <any>response;
      const url = filesResponse[0].url;
      window.open(url);
    });
  }

  validJSONdeps(DepIds: string) {
    if (DepIds == '') {
      DepIds = '{"proyectos":[],"fechas":[]}';
    }
    let jsoncheck = JSON.parse(DepIds);
    if (!jsoncheck.hasOwnProperty('proyectos')) {
      jsoncheck['proyectos'] = [];
    }
    if (!jsoncheck.hasOwnProperty('fechas')) {
      jsoncheck['fechas'] = [];
    } else {
      jsoncheck.fechas.forEach((f: any) => {
        if (!f.hasOwnProperty('Activo')) {
          f['Activo'] = true;
        }
        if (!f.hasOwnProperty('Modificacion')) {
          f['Modificacion'] = '';
        }
        if (!f.hasOwnProperty('Fin')) {
          f['Fin'] = '';
        }
        if (!f.hasOwnProperty('Inicio')) {
          f['Inicio'] = '';
        }
        if (!f.hasOwnProperty('Id')) {
          f['Id'] = '';
        }
      });
    }
    return jsoncheck;
  }
}
