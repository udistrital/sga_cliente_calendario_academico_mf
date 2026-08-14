import { Component, OnInit, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ProyectoAcademicoService } from '../../services/proyecto_academico.service';
import { PopUpManager } from '../../managers/popUpManager';

@Component({
  selector: 'asignar-calendario-proyecto',
  templateUrl: './asignar-calendario-proyecto.component.html',
  styleUrls: ['./asignar-calendario-proyecto.component.scss'],
})
export class AsignarCalendarioProyectoComponent implements OnInit {

  selectedProjects: FormControl;
  projects!: any[];
  filtroProgramasAsociados = '';
  filtroProgramasDisponibles = '';
  constructor(
    private projectService: ProyectoAcademicoService,
    private popUpManager: PopUpManager,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<AsignarCalendarioProyectoComponent>,
    @Inject(MAT_DIALOG_DATA) public dat: any,
  ) {
    this.selectedProjects = new FormControl([]);
    this.dialogRef.backdropClick().subscribe(() => this.dialogRef.close());
  }

  ngOnInit() {
    this.projectService.get('proyecto_academico_institucion?limit=0&query=Activo:true').subscribe({
      next: response => {
          this.projects = (<any[]><unknown>response).filter(
          proyecto => this.filtrarProyecto(proyecto),
        );
        this.selectedProjects.setValue(this.proyectosIniciales());
      },
      error: error => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      },
    });
  }

  filtrarProyecto(proyecto:any):any {
    const nivelFormacion = proyecto?.NivelFormacionId;
    const padreFormacion = nivelFormacion?.NivelFormacionPadreId;
    const nivelCalendarioId = Number(this.dat?.calendar?.Nivel || this.dat?.data?.Nivel);

    // si es calendario de un posgrado
    if (nivelCalendarioId === 2){
      return padreFormacion?.CodigoAbreviacion === 'POS' || nivelFormacion?.CodigoAbreviacion === 'POS';
    }
    return Number(nivelFormacion?.Id) === nivelCalendarioId || Number(padreFormacion?.Id) === nivelCalendarioId;
  }

  register() {
    this.popUpManager.showConfirmAlert(this.translate.instant('calendario.seguro_proyectos'))
      .then((ok) => {
        if (ok.value) this.dialogRef.close({ proyectos: this.selectedProjects.value, programas: this.projects });
      });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  proyectosIniciales() {
    if (!this.dat.calendar?.DependenciaId || this.dat.calendar.DependenciaId === '{}') {
      return [];
    }
    try {
      const deps = typeof this.dat.calendar.DependenciaId === 'string' ? JSON.parse(this.dat.calendar.DependenciaId) : this.dat.calendar.DependenciaId;
      return Array.isArray(deps?.proyectos) ? deps.proyectos.map((id: any) => Number(id)) : [];
    } catch (error) {
      return [];
    }
  }

  programasAsociados() {
    const selectedIds = new Set((this.selectedProjects.value || []).map((id: any) => Number(id)));
    return (this.projects || []).filter((project: any) => selectedIds.has(Number(project.Id)));
  }

  programasDisponibles() {
    const selectedIds = new Set((this.selectedProjects.value || []).map((id: any) => Number(id)));
    return (this.projects || []).filter((project: any) => !selectedIds.has(Number(project.Id)));
  }

  programasAsociadosFiltrados() {
    return this.filterPrograms(this.programasAsociados(), this.filtroProgramasAsociados);
  }

  programasDisponiblesFiltrados() {
    return this.filterPrograms(this.programasDisponibles(), this.filtroProgramasDisponibles);
  }

  filterPrograms(programs: any[], filter: string) {
    const normalizedFilter = (filter || '').toLowerCase().trim();
    if (!normalizedFilter) {
      return programs;
    }
    return programs.filter((project: any) => (project.Nombre || '').toLowerCase().includes(normalizedFilter));
  }

  togglePrograma(projectId: any, checked: boolean) {
    const currentIds = (this.selectedProjects.value || []).map((id: any) => Number(id));
    const id = Number(projectId);
    const updatedIds = checked
      ? Array.from(new Set([...currentIds, id]))
      : currentIds.filter((selectedId: number) => selectedId !== id);
    this.selectedProjects.setValue(updatedIds);
    this.selectedProjects.markAsTouched();
  }

  seleccionarProgramasDisponiblesFiltrados() {
    const currentIds = (this.selectedProjects.value || []).map((id: any) => Number(id));
    const availableIds = this.programasDisponiblesFiltrados().map((project: any) => Number(project.Id)).filter((id: number) => id > 0);
    this.selectedProjects.setValue(Array.from(new Set([...currentIds, ...availableIds])));
    this.selectedProjects.markAsTouched();
  }

  deseleccionarProgramasAsociadosFiltrados() {
    const idsARetirar = new Set(this.programasAsociadosFiltrados().map((project: any) => Number(project.Id)));
    const currentIds = (this.selectedProjects.value || []).map((id: any) => Number(id));
    this.selectedProjects.setValue(currentIds.filter((id: number) => !idsARetirar.has(id)));
    this.selectedProjects.markAsTouched();
  }

}
