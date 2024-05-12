import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProyectoAcademicoService } from '../../services/proyecto_academico.service'
import { Calendario } from 'src/app/models/calendario-academico/calendario';
import { PopUpManager } from '../../managers/popUpManager';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AsignarCalendarioProyectoComponent } from '../asignar-calendario-proyecto/asignar-calendario-proyecto.component';
import { EventoService } from '../../services/evento.service';
import { NivelFormacion } from '../../models/proyecto_academico/nivel_formacion';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { SgaCalendarioMidService } from 'src/app/services/sga_calendario_mid.service';

@Component({
  selector: 'list-calendario-academico',
  templateUrl: './list-calendario-academico.component.html',
  styleUrls: ['./list.calendario-academico.component.scss'],
})
export class ListCalendarioAcademicoComponent implements OnInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  settings: any;
  data: any[] = [];
  //fix
  activetab = 0;
  calendars: Calendario[] = [];
  calendarForEditId: number = 0;
  calendarForNew: boolean = false;
  niveles!: NivelFormacion[];
  displayedColumns: string[] = ['Nombre', 'Periodo_Académico', "Tipo_de_dependencia", "Estado", "Acciones" ];
  displayedColumnsTable: string[] = ['Nombre', "Dirigido" ];
  dataSource!: MatTableDataSource<any>;
  view!: boolean

  constructor(
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private eventoService: EventoService,
    private proyectoService: ProyectoAcademicoService,
    private dialog: MatDialog,
    private popUpManager: PopUpManager,
    private sgaCalendarioMidService: SgaCalendarioMidService
  ) {
    this.nivel_load()
  }
  recargarDespuesClon(newItem: any) {
    this.calendarForEditId = newItem
    this.ngOnInit()
  }

  ngOnInit() {
    this.data = []
    this.sgaCalendarioMidService.get('calendario-academico?limit=0').subscribe(
      (response: any) => {
        const r = <any>response;
        if (response !== null && r.Status == 404) {
          this.popUpManager.showErrorToast(this.translate.instant('ERROR.404'));
          this.popUpManager.showErrorAlert(this.translate.instant('calendario.sin_calendarios'));
        } else if (response !== null && r.Status == 400) {
          this.popUpManager.showErrorAlert(this.translate.instant('calendario.sin_calendarios'));
        } else {
          response.Data.map((calendar: any) => {
            this.data.push({
              Id: calendar.Id,
              Nombre: calendar.Nombre,
              Periodo: calendar.Periodo,
              Dependencia: this.niveles.filter(nivel => nivel.Id === calendar.Nivel)[0].Nombre,
              Estado: calendar.Activo ? this.translate.instant('GLOBAL.activo') : this.translate.instant('GLOBAL.inactivo'),
            });
          });

          this.dataSource = new MatTableDataSource(this.data)
          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          }, 300);

        }
      },
      (error: any) => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      },
    );
  }

  applyFilterProces(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }


  nivel_load() {
    this.proyectoService.get('nivel_formacion?limit=0').subscribe(
      // (response: NivelFormacion[]) => {
      (response: any) => {
        const nombresFiltrados = ["Pregrado", "Posgrado", "Doctorado"];
        this.niveles = nombresFiltrados.flatMap((nombre:any) => response.filter((item:any) => item.Nombre === nombre));
      
      },
      error => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      },
    );
  }

  onAction(event: any) {

    switch (event.action) {
      case 'view':
        this.onEdit(event);
        break;
      case 'edit':
        this.onEdit(event);
        break;
      case 'clone':
        this.onUpdate(event);
        break;
      case 'delete':
        this.onDelete(event);
        break;
      case 'assign':
        this.onAssign(event);
        break;
    }
  }

  onCreate(event: any) {
    this.activateTab(0, false, 1)
  }

  onUpdate(event: any) {
    this.activateTab(event.data.Id, true, 1);
  }

  onEdit(event: any) {
    this.view = event.editable
    this.activateTab(event.data.Id, false, 1); // ID del calendario seleccionado para edición
  }

  onDelete(event: any) {
    this.popUpManager.showConfirmAlert(this.translate.instant('calendario.seguro_continuar_inhabilitar_calendario'))
      .then(willDelete => {
        if (willDelete.value) {
          this.sgaCalendarioMidService.put('calendario-academico/calendario/academico/' + event.data.Id + '/inhabilitar', JSON.stringify({ 'id': event.data.Id })).subscribe(
            (response: any) => {
              if (response.status != 200) {
                this.popUpManager.showErrorAlert(this.translate.instant('calendario.calendario_no_inhabilitado'));
              } else {
                this.popUpManager.showSuccessAlert(this.translate.instant('calendario.calendario_inhabilitado'));
                this.ngOnInit();
              }
            },
            error => {
              this.popUpManager.showErrorToast(this.translate.instant('calendario.error_registro_calendario'));
            },
          );
        }
      });
  }

  onAssign(event: any) {
    const assignConfig = new MatDialogConfig();
    assignConfig.width = '800px';
    assignConfig.height = '300px';

    this.eventoService.get('tipo_evento?limit=0&query=CalendarioID__Id:' + event.data.Id).subscribe(
      (response: any) => {
        if (Object.keys(response[0]).length === 0) {
          this.popUpManager.showErrorAlert(this.translate.instant('calendario.no_asignable'))
        } else {
          this.eventoService.get('calendario/' + event.data.Id).subscribe(
            (calendar: Calendario) => {
              assignConfig.data = { calendar: calendar, data: event.data };
              const newAssign = this.dialog.open(AsignarCalendarioProyectoComponent, assignConfig);
              newAssign.afterClosed().subscribe((data) => {
                if (data !== undefined) {
                  calendar.DependenciaId = JSON.stringify({ proyectos: data })
                  this.eventoService.put('calendario', calendar).subscribe(
                    response => {
                      this.popUpManager.showSuccessAlert(this.translate.instant('calendario.proyectos_exito'));
                    },
                    error => {
                      this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
                    },
                  );
                }
              });
            },
            (error: any) => {
              this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
            },
          );
        }
      },
      (error: any) => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      },
    );
  }

  changeTab(event: any) {
    if (event.tab.textLabel === this.translate.instant('GLOBAL.lista')) {
      //this.activetab = false;
    } else {
      // this.activetab = true;
    }
  }

  tabChanged(tabChangeEvent: MatTabChangeEvent): void {
    if (tabChangeEvent.index === 0) {
      this.activateTab();
    }
  }

  activateTab(calendarId = 0, calendarState = false, tab = 0) {
    this.activetab = tab;
    this.calendarForEditId = calendarId;
    this.calendarForNew = calendarState;
  }

}
