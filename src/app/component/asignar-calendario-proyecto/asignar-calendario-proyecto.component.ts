import { Component, OnInit, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ProyectoAcademicoService } from '../../services/proyecto_academico.service';
import { PopUpManager } from '../../managers/popUpManager';
import { CalendarioFiltroOption, CalendarioFiltrosAlcanceService } from '../../services/calendario-filtros-alcance.service';

@Component({
    selector: 'asignar-calendario-proyecto',
    templateUrl: './asignar-calendario-proyecto.component.html',
    styleUrls: ['./asignar-calendario-proyecto.component.scss'],
    standalone: false
})
export class AsignarCalendarioProyectoComponent implements OnInit {

  selectedProjects: FormControl;
  projects!: any[];
  facultades: CalendarioFiltroOption[] = [];
  facultadSeleccionada: number | null = null;
  filtroProgramas = '';
  idsIniciales = new Set<number>();
  constructor(
    private projectService: ProyectoAcademicoService,
    private filtrosAlcanceService: CalendarioFiltrosAlcanceService,
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
        const iniciales = this.proyectosIniciales();
        this.idsIniciales = new Set(iniciales);
        this.selectedProjects.setValue(iniciales);
        this.cargarFacultades();
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
    return this.programasPorFacultad().filter((project: any) => selectedIds.has(Number(project.Id)));
  }

  programasDisponibles() {
    const selectedIds = new Set((this.selectedProjects.value || []).map((id: any) => Number(id)));
    return this.programasPorFacultad().filter((project: any) => !selectedIds.has(Number(project.Id)));
  }

  programasPorFacultad() {
    return this.filtrosAlcanceService.filtrarProgramasPorFacultad(this.projects, this.facultadSeleccionada);
  }

  programasAsociadosFiltrados() {
    return this.filterPrograms(this.programasAsociados(), this.filtroProgramas);
  }

  programasDisponiblesFiltrados() {
    return this.filterPrograms(this.programasDisponibles(), this.filtroProgramas);
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

  idsSeleccionados(): number[] {
    return (this.selectedProjects.value || []).map((id: any) => Number(id));
  }

  esNuevo(projectId: any): boolean {
    const id = Number(projectId);
    return !this.idsIniciales.has(id) && this.idsSeleccionados().includes(id);
  }

  seRetirara(projectId: any): boolean {
    const id = Number(projectId);
    return this.idsIniciales.has(id) && !this.idsSeleccionados().includes(id);
  }

  totalNuevos(): number {
    return this.idsSeleccionados().filter((id: number) => !this.idsIniciales.has(id)).length;
  }

  totalRetirados(): number {
    const seleccionados = new Set(this.idsSeleccionados());
    return Array.from(this.idsIniciales).filter((id: number) => !seleccionados.has(id)).length;
  }

  hayCambios(): boolean {
    return this.totalNuevos() > 0 || this.totalRetirados() > 0;
  }

  nombreFacultad(project: any): string {
    const facultadId = this.filtrosAlcanceService.facultadIdPrograma(project);
    return this.facultades.find((facultad: CalendarioFiltroOption) => Number(facultad.Id) === facultadId)?.Nombre || '';
  }

  private async cargarFacultades() {
    this.facultades = await this.filtrosAlcanceService.facultadesDeProgramas(this.projects);
  }

}
