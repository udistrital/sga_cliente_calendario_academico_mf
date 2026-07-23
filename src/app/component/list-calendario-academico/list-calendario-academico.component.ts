import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProyectoAcademicoService } from '../../services/proyecto_academico.service'
import { Calendario } from 'src/app/models/calendario-academico/calendario';
import { PopUpManager } from '../../managers/popUpManager';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AsignarCalendarioProyectoComponent } from '../asignar-calendario-proyecto/asignar-calendario-proyecto.component';
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
  niveles: NivelFormacion[] = [];
  displayedColumns: string[] = ['Nombre', 'Periodo_Académico', "Nivel", "Estado", "Acciones" ];
  displayedColumnsTable: string[] = ['Nombre', "Dirigido" ];
  dataSource!: MatTableDataSource<any>;
  view!: boolean

  constructor(
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private proyectoService: ProyectoAcademicoService,
    private dialog: MatDialog,
    private popUpManager: PopUpManager,
    private sgaCalendarioMidService: SgaCalendarioMidService
  ) { }
  recargarDespuesClon(newItem: any) {
    this.calendarForEditId = newItem;
    this.calendarForNew = false;
    this.view = false;
    this.activetab = 1;
  }

  actualizarListadoCalendarios() {
    this.cargarCalendarios();
  }

  private errorMessage(error: any, fallbackKey: string): string {
    return error?.Message || error?.message || this.translate.instant(fallbackKey);
  }

  ngOnInit() {
    this.nivel_load()
  }

  cargarCalendarios() {
    this.sgaCalendarioMidService.get('calendario-academico?limit=0').subscribe({
      next: (response: any) => {
        const r = <any>response;
        if (response !== null && r.Status == 404) {
          this.popUpManager.showErrorToast(this.translate.instant('ERROR.404'));
          this.popUpManager.showErrorAlert(this.translate.instant('calendario.sin_calendarios'));
        } else if (response !== null && r.Status == 400) {
          this.popUpManager.showErrorAlert(this.translate.instant('calendario.sin_calendarios'));
        } else {
          this.data = (response.Data || []).map((calendar: any) => {
            return {
              Id: calendar.Id,
              Nombre: calendar.Nombre,
              Periodo: calendar.Periodo,
              NivelNombre: this.niveles.find(nivel => nivel.Id === calendar.Nivel)?.Nombre || '',
              Estado: calendar.Activo ? this.translate.instant('GLOBAL.activo') : this.translate.instant('GLOBAL.inactivo'),
              Activo: calendar.Activo,
              Nivel: calendar.Nivel,
            };
          });

          this.dataSource = new MatTableDataSource(this.data)
          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          }, 300);

        }
      },
      error: (error: any) => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      },
    });
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
        this.cargarCalendarios();
      
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
    this.view = false;
  }

  onUpdate(event: any) {
    this.activateTab(event.data.Id, true, 1);
  }

  onEdit(event: any) {
    this.view = event.editable
    this.activateTab(event.data.Id, false, 1); // ID del calendario seleccionado para edición
  }

  onDelete(event: any) {
    this.popUpManager.showConfirmAlert(this.translate.instant('calendario.mensaje_estado_calendario'))
      .then(willDelete => {
        if (willDelete.value) {
          this.sgaCalendarioMidService.put('calendario-academico/calendario/' + event.data.Id + '/estado', { Activo: !event.data.Activo }).subscribe(
                (response: any) => {
                  this.popUpManager.showSuccessAlert(this.translate.instant('calendario.calendario_estado_actualizado'));
                  this.ngOnInit();
            },
            (error: any) => {
              this.popUpManager.showErrorToast(this.errorMessage(error, 'calendario.error_registro_calendario'));
            },
          );
        }
      });
  }

  onAssign(event: any) {
    const assignConfig = new MatDialogConfig();
    assignConfig.width = '960px';
    assignConfig.maxWidth = '95vw';
    assignConfig.height = '720px';
    assignConfig.maxHeight = '90vh';

    this.sgaCalendarioMidService.get('calendario-academico/eventos/proceso?limit=0&query=Activo:true,CalendarioID__Id:' + event.data.Id).subscribe(
      (response: any) => {
        if (!Array.isArray(response) || response.length === 0 || Object.keys(response[0] || {}).length === 0) {
          this.popUpManager.showErrorAlert(this.translate.instant('calendario.no_asignable'))
        } else {
          this.sgaCalendarioMidService.get('calendario-academico/eventos/calendario/' + event.data.Id).subscribe(
            (calendar: Calendario) => {
              assignConfig.data = { calendar: calendar, data: event.data };
              const newAssign = this.dialog.open(AsignarCalendarioProyectoComponent, assignConfig);
              newAssign.afterClosed().subscribe((data) => {
                if (data !== undefined) {
                  const proyectos = Array.isArray(data) ? data : data.proyectos;
                  const programas = Array.isArray(data) ? [] : data.programas;
                  this.guardarProgramasCalendario(event.data.Id, proyectos, false, programas);
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

  guardarProgramasCalendario(calendarioId: any, proyectos: any[], forzar: boolean = false, programas: any[] = []) {
    this.sgaCalendarioMidService.put('calendario-academico/calendario/' + calendarioId + '/dependencias', {
      DependenciaId: JSON.stringify({ proyectos: proyectos }),
      Forzar: forzar,
    }).subscribe(
      response => {
        this.popUpManager.showSuccessAlert(this.translate.instant('calendario.proyectos_exito'));
        this.ngOnInit();
      },
      error => {
        const impactos = this.impactosDesasociacion(error);
        if (impactos.length > 0) {
          this.popUpManager.showErrorToast(error?.Message || error?.error?.Message || this.translate.instant('calendario.programas_no_desasociables'));
          return;
        }
        this.popUpManager.showErrorToast(error?.error?.Message || error?.message || this.translate.instant('ERROR.general'));
      },
    );
  }

  impactosDesasociacion(error: any): any[] {
    const data = error?.error?.Data || error?.Data || error?.error?.data;
    const impactos = data?.Impactos || data?.impactos;
    return Array.isArray(impactos) ? impactos : [];
  }

  confirmarRetiroCascada(calendarioId: any, proyectos: any[], impactos: any[], programas: any[]) {
    this.popUpManager.showPopUpGeneric(
      this.translate.instant('calendario.confirmar_retiro_programas_cascada'),
      this.htmlImpactosDesasociacion(impactos, programas),
      'warning',
      true,
    ).then((ok: any) => {
      if (ok.value) {
        this.guardarProgramasCalendario(calendarioId, proyectos, true, programas);
      }
    });
  }

  htmlImpactosDesasociacion(impactos: any[], programas: any[]) {
    const programasPorId = new Map((programas || []).map((programa: any) => [Number(programa.Id), programa.Nombre]));
    const impactosPorPrograma = impactos.reduce((acc: any, impacto: any) => {
      const programaId = Number(impacto.ProgramaId || impacto.programa_id);
      if (!acc[programaId]) {
        acc[programaId] = [];
      }
      acc[programaId].push(impacto);
      return acc;
    }, {});
    const items = Object.keys(impactosPorPrograma).slice(0, 10).map((programaId: string) => {
      const nombrePrograma = programasPorId.get(Number(programaId)) || (this.translate.instant('calendario.programa_academico') + ' ' + programaId);
      const actividades = impactosPorPrograma[programaId].map((impacto: any) => {
        const motivos = [];
        if (impacto.FechaParticular || impacto.fecha_particular) {
          motivos.push(this.translate.instant('calendario.impacto_fecha_particular'));
        }
        if (impacto.ExtensionVigente || impacto.extension_vigente) {
          motivos.push(this.translate.instant('calendario.impacto_extension_vigente'));
        }
        const actividad = impacto.Actividad || impacto.actividad || impacto.ActividadId || impacto.actividad_id || '-';
        return '<li><span style="font-weight:600">' + actividad + '</span><br><small>' + motivos.join(', ') + '</small></li>';
      }).join('');
      return '<div style="border:1px solid #d9e2ec;border-radius:6px;margin:0 0 .75rem;padding:.75rem;text-align:left">' +
        '<div style="font-weight:700;color:#0b4f71;margin-bottom:.35rem">' + nombrePrograma + '</div>' +
        '<ul style="margin:.25rem 0 0 1rem;padding:0">' + actividades + '</ul>' +
        '</div>';
    }).join('');
    const totalProgramas = Object.keys(impactosPorPrograma).length;
    const extra = totalProgramas > 10 ? '<p>' + this.translate.instant('calendario.impactos_adicionales', { total: totalProgramas - 10 }) + '</p>' : '';
    return '<p>' + this.translate.instant('calendario.retiro_programas_cascada_info') + '</p>' +
      '<div style="max-height:300px;overflow:auto">' + items + '</div>' +
      extra +
      '<p><strong>' + this.translate.instant('calendario.retiro_programas_cascada_confirmacion') + '</strong></p>';
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
    if (tab === 0 && this.niveles?.length) {
      this.cargarCalendarios();
    }
    
  }

}
