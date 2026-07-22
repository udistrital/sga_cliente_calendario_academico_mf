import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { SgaCalendarioMidService } from 'src/app/services/sga_calendario_mid.service';

@Component({
  selector: 'gestion-masiva-actividades-programas',
  templateUrl: './gestion-masiva-actividades-programas.component.html',
  styleUrls: ['./gestion-masiva-actividades-programas.component.scss'],
})
export class GestionMasivaActividadesProgramasComponent implements OnInit {
  calendar: any;
  projects: any[] = [];
  procesos: any[] = [];
  procesosCandidatosAsociar: any[] = [];
  procesosCandidatosDesasociar: any[] = [];
  programaIdsSeleccionados: number[] = [];
  programaFiltro = '';
  actividadIdsSeleccionadosPorOperacion = {
    asociar: new Set<number>(),
    desasociar: new Set<number>(),
  };
  totalCandidatasAsociar = 0;
  totalCandidatasDesasociar = 0;
  totalAsociaciones = 0;
  bloqueadasDesasociacion: any[] = [];
  validacionesPorActividad = new Map<number, any>();
  operacionTabIndex = 0;
  validando = false;
  actualizado = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<GestionMasivaActividadesProgramasComponent>,
    private translate: TranslateService,
    private popUpManager: PopUpManager,
    private sgaCalendarioMidService: SgaCalendarioMidService,
  ) { }

  ngOnInit() {
    this.calendar = this.data?.calendar;
    this.projects = Array.isArray(this.data?.projects) ? this.data.projects : [];
    this.procesos = (Array.isArray(this.data?.processes) ? this.data.processes : []).map((proceso: any) => ({
      ...proceso,
      actividadesLista: Array.isArray(proceso?.actividades?.data) ? proceso.actividades.data : [],
    }));
    this.limpiarValidacion();
  }

  cerrar() {
    this.dialogRef.close(this.actualizado);
  }

  totalActividades(): number {
    return this.procesos.reduce((total: number, proceso: any) => total + proceso.actividadesLista.length, 0);
  }

  actividadesSeleccionadas(operacion: 'asociar' | 'desasociar'): number[] {
    return Array.from(this.actividadIdsSeleccionadosPorOperacion[operacion]);
  }

  onProgramasSeleccionadosChange(programaIds: number[]) {
    this.programaIdsSeleccionados = Array.isArray(programaIds) ? programaIds.map((programaId: any) => Number(programaId)).filter((programaId: number) => programaId > 0) : [];
    this.actividadIdsSeleccionadosPorOperacion.asociar.clear();
    this.actividadIdsSeleccionadosPorOperacion.desasociar.clear();
    if (this.programaIdsSeleccionados.length === 0) {
      this.limpiarValidacion();
      return;
    }
    this.validarMasivo();
  }

  programasFiltrados(): any[] {
    const filtro = String(this.programaFiltro || '').trim().toLowerCase();
    return this.projects.filter((project: any) => {
      const projectId = Number(project?.Id);
      const nombre = String(project?.Nombre || '').toLowerCase();
      return projectId > 0 && !this.programaIdsSeleccionados.includes(projectId) && (!filtro || nombre.includes(filtro));
    });
  }

  programasSeleccionadosDetalle(): any[] {
    return this.programaIdsSeleccionados.map((programaId: number) => ({
      Id: programaId,
      Nombre: this.nombrePrograma(programaId),
    }));
  }

  seleccionarProgramaAutocomplete(event: any, input: HTMLInputElement) {
    const programaId = Number(event?.option?.value);
    if (programaId > 0 && !this.programaIdsSeleccionados.includes(programaId)) {
      this.onProgramasSeleccionadosChange([...this.programaIdsSeleccionados, programaId]);
    }
    this.programaFiltro = '';
    input.value = '';
  }

  quitarPrograma(programaId: number) {
    this.onProgramasSeleccionadosChange(this.programaIdsSeleccionados.filter((seleccionado: number) => Number(seleccionado) !== Number(programaId)));
  }

  seleccionarTodosProgramas() {
    this.onProgramasSeleccionadosChange(this.projects.map((project: any) => Number(project.Id)).filter((projectId: number) => projectId > 0));
    this.programaFiltro = '';
  }

  deseleccionarTodosProgramas() {
    this.onProgramasSeleccionadosChange([]);
    this.programaFiltro = '';
  }

  toggleActividad(actividad: any, checked: boolean, operacion: 'asociar' | 'desasociar') {
    const actividadId = Number(actividad?.actividadId);
    if (!actividadId) {
      return;
    }
    if (checked) {
      this.actividadIdsSeleccionadosPorOperacion[operacion].add(actividadId);
    } else {
      this.actividadIdsSeleccionadosPorOperacion[operacion].delete(actividadId);
    }
  }

  actividadSeleccionada(actividad: any, operacion: 'asociar' | 'desasociar'): boolean {
    return this.actividadIdsSeleccionadosPorOperacion[operacion].has(Number(actividad?.actividadId));
  }

  toggleProceso(proceso: any, checked: boolean, operacion: 'asociar' | 'desasociar') {
    (proceso?.actividadesCandidatas || []).forEach((actividad: any) => this.toggleActividad(actividad, checked, operacion));
  }

  procesoSeleccionado(proceso: any, operacion: 'asociar' | 'desasociar'): boolean {
    const actividades = proceso?.actividadesCandidatas || [];
    return actividades.length > 0 && actividades.every((actividad: any) => this.actividadSeleccionada(actividad, operacion));
  }

  procesoParcial(proceso: any, operacion: 'asociar' | 'desasociar'): boolean {
    const actividades = proceso?.actividadesCandidatas || [];
    return actividades.some((actividad: any) => this.actividadSeleccionada(actividad, operacion)) && !this.procesoSeleccionado(proceso, operacion);
  }

  coberturaActividad(actividad: any): { asociadas: number; total: number } {
    const validacion = this.validacionActividad(actividad);
    if (validacion) {
      return { asociadas: (validacion.Asociados || []).length, total: Number(validacion.TotalSeleccionados || this.programaIdsSeleccionados.length) };
    }
    const total = this.programaIdsSeleccionados.length;
    if (total === 0) {
      return { asociadas: 0, total };
    }
    const dependencia = this.normalizarDependenciaActividad(actividad?.DependenciaId);
    const asociados = this.programaIdsSeleccionados.filter((programaId: number) => {
      return dependencia.proyectos.some((proyectoId: any) => Number(proyectoId) === Number(programaId));
    });
    return { asociadas: asociados.length, total };
  }

  claseCobertura(actividad: any): string {
    const cobertura = this.coberturaActividad(actividad);
    if (cobertura.total === 0) {
      return 'neutral';
    }
    if (cobertura.asociadas === 0) {
      return 'empty';
    }
    if (cobertura.asociadas === cobertura.total) {
      return 'full';
    }
    return 'partial';
  }

  textoCobertura(actividad: any): string {
    const cobertura = this.coberturaActividad(actividad);
    if (cobertura.total === 0) {
      return this.translate.instant('calendario.masivo_estado_sin_programa');
    }
    if (cobertura.asociadas === 0) {
      return this.translate.instant('calendario.masivo_estado_no_asociado');
    }
    if (cobertura.asociadas === cobertura.total) {
      return this.translate.instant('calendario.masivo_estado_asociado');
    }
    return this.translate.instant('calendario.masivo_estado_parcial', cobertura);
  }

  actividadesConCambio(operacion: 'asociar' | 'desasociar'): number[] {
    if (this.programaIdsSeleccionados.length === 0) {
      return [];
    }
    return this.actividadesSeleccionadas(operacion).filter((actividadId: number) => {
      const actividad = this.buscarActividadPorId(actividadId);
      return actividad ? this.actividadTieneCambio(actividad, operacion) : false;
    });
  }

  actividadTieneCambio(actividad: any, operacion: 'asociar' | 'desasociar'): boolean {
    const validacion = this.validacionActividad(actividad);
    if (validacion) {
      return operacion === 'asociar' ? !!validacion.PuedeAsociar : !!validacion.PuedeDesasociar;
    }
    if (this.programaIdsSeleccionados.length === 0) {
      return false;
    }
    const dependencia = this.normalizarDependenciaActividad(actividad.DependenciaId);
    return this.programaIdsSeleccionados.some((programaId: number) => {
      const asociada = dependencia.proyectos.some((proyectoId: any) => Number(proyectoId) === Number(programaId));
      return operacion === 'asociar' ? !asociada : asociada;
    });
  }

  actividadesCandidatas(proceso: any, operacion: 'asociar' | 'desasociar'): any[] {
    const actividades = Array.isArray(proceso?.actividadesLista) ? proceso.actividadesLista : [];
    return actividades.filter((actividad: any) => this.actividadTieneCambio(actividad, operacion));
  }

  private construirProcesosCandidatos(operacion: 'asociar' | 'desasociar'): any[] {
    return this.procesos.map((proceso: any) => ({
      ...proceso,
      actividadesCandidatas: this.actividadesCandidatas(proceso, operacion),
    })).filter((proceso: any) => proceso.actividadesCandidatas.length > 0);
  }

  recalcularCandidatos() {
    this.procesosCandidatosAsociar = this.construirProcesosCandidatos('asociar');
    this.procesosCandidatosDesasociar = this.construirProcesosCandidatos('desasociar');
    this.totalCandidatasAsociar = this.procesosCandidatosAsociar.reduce((total: number, proceso: any) => total + proceso.actividadesCandidatas.length, 0);
    this.totalCandidatasDesasociar = this.procesosCandidatosDesasociar.reduce((total: number, proceso: any) => total + proceso.actividadesCandidatas.length, 0);
    this.totalAsociaciones = this.calcularTotalAsociacionesExistentes();
    this.bloqueadasDesasociacion = this.actividadesBloqueadasDesasociacion();
    this.limpiarSeleccionesInvalidas();
  }

  puedeAplicar(operacion: 'asociar' | 'desasociar'): boolean {
    return this.actividadesConCambio(operacion).length > 0;
  }

  totalCruces(operacion: 'asociar' | 'desasociar'): number {
    return this.programaIdsSeleccionados.length * this.actividadesSeleccionadas(operacion).length;
  }

  totalAsociacionesExistentes(): number {
    return this.totalAsociaciones;
  }

  onOperacionTabChange(index: number) {
    this.operacionTabIndex = index;
  }

  actividadesDetalleResumen(operacion: 'asociar' | 'desasociar'): any[] {
    const procesos = operacion === 'asociar' ? this.procesosCandidatosAsociar : this.procesosCandidatosDesasociar;
    const seleccionadas = new Set<number>(this.actividadesSeleccionadas(operacion));
    if (seleccionadas.size === 0) {
      return [];
    }
    return procesos.reduce((items: any[], proceso: any) => {
      (proceso.actividadesCandidatas || []).forEach((actividad: any) => {
        if (!seleccionadas.has(Number(actividad?.actividadId))) {
          return;
        }
        const campo = operacion === 'asociar' ? 'Faltantes' : 'Asociados';
        items.push({
          actividad,
          proceso: proceso.Nombre,
          programas: this.nombresProgramasValidacion(actividad, campo),
        });
      });
      return items;
    }, []);
  }

  private calcularTotalAsociacionesExistentes(): number {
    return this.procesos.reduce((totalProceso: number, proceso: any) => {
      return totalProceso + (proceso.actividadesLista || []).reduce((totalActividad: number, actividad: any) => {
        return totalActividad + this.coberturaActividad(actividad).asociadas;
      }, 0);
    }, 0);
  }

  private nombresProgramasValidacion(actividad: any, campo: 'Asociados' | 'Faltantes'): string[] {
    return this.programaIdsValidacion(actividad, campo).map((programaId: number) => this.nombrePrograma(programaId));
  }

  private programaIdsValidacion(actividad: any, campo: 'Asociados' | 'Faltantes'): number[] {
    const validacion = this.validacionActividad(actividad);
    if (validacion && Array.isArray(validacion[campo])) {
      return validacion[campo].map((programaId: any) => Number(programaId)).filter((programaId: number) => programaId > 0);
    }
    const dependencia = this.normalizarDependenciaActividad(actividad?.DependenciaId);
    return this.programaIdsSeleccionados
      .filter((programaId: number) => {
        const asociada = dependencia.proyectos.some((proyectoId: any) => Number(proyectoId) === Number(programaId));
        return campo === 'Asociados' ? asociada : !asociada;
      });
  }

  private nombrePrograma(programaId: number): string {
    const programa = this.projects.find((project: any) => Number(project?.Id) === Number(programaId));
    return programa?.Nombre || String(programaId);
  }

  aplicar(operacion: 'asociar' | 'desasociar') {
    const actividadIds = this.actividadesConCambio(operacion);
    if (this.programaIdsSeleccionados.length === 0 || actividadIds.length === 0) {
      this.popUpManager.showErrorToast(this.translate.instant('calendario.masivo_programas_seleccion_requerida'));
      return;
    }
    this.popUpManager.showConfirmAlert(this.translate.instant('calendario.masivo_programas_confirmar')).then((ok) => {
      if (!ok.value) {
        return;
      }
      this.sgaCalendarioMidService.post('calendario-academico/calendario/' + this.calendar.calendarioId + '/actividades-programas/masivo', {
        ProgramaIds: this.programaIdsSeleccionados,
        ActividadIds: actividadIds,
        Operacion: operacion,
      }).subscribe(
        (response: any) => {
          const data = response?.Data || response;
          const actualizadas = data?.Actualizadas ?? 0;
          const sinCambios = data?.SinCambios ?? 0;
          this.actividadIdsSeleccionadosPorOperacion[operacion].clear();
          this.actualizado = true;
          this.validarMasivo(false);
          this.popUpManager.showSuccessAlert(
            this.translate.instant('calendario.masivo_programas_exito', { actualizadas, sinCambios })
          );
        },
        (error: any) => {
          this.popUpManager.showErrorToast(this.errorMessage(error, 'calendario.masivo_programas_error'));
        }
      );
    });
  }

  private validarMasivo(mostrarError: boolean = true) {
    const actividadIds = this.todosLosIdsActividad();
    if (this.programaIdsSeleccionados.length === 0 || actividadIds.length === 0) {
      this.limpiarValidacion();
      return;
    }
    this.validando = true;
    this.sgaCalendarioMidService.post('calendario-academico/calendario/' + this.calendar.calendarioId + '/actividades-programas/masivo/validar', {
      ProgramaIds: this.programaIdsSeleccionados,
      ActividadIds: actividadIds,
    }).subscribe(
      (response: any) => {
        const data = response?.Data || response;
        const validaciones = Array.isArray(data?.Actividades) ? data.Actividades : [];
        this.validacionesPorActividad.clear();
        validaciones.forEach((validacion: any) => {
          this.validacionesPorActividad.set(Number(validacion.ActividadId), validacion);
        });
        this.totalCandidatasAsociar = Number(data?.PendientesAsociar || 0);
        this.totalCandidatasDesasociar = Number(data?.DisponiblesDesasociar || 0);
        this.recalcularCandidatos();
        this.validando = false;
      },
      (error: any) => {
        this.validando = false;
        this.limpiarValidacion();
        if (mostrarError) {
          this.popUpManager.showErrorToast(this.errorMessage(error, 'calendario.masivo_validacion_error'));
        }
      }
    );
  }

  private limpiarValidacion() {
    this.validacionesPorActividad.clear();
    this.procesosCandidatosAsociar = [];
    this.procesosCandidatosDesasociar = [];
    this.totalCandidatasAsociar = 0;
    this.totalCandidatasDesasociar = 0;
    this.totalAsociaciones = 0;
    this.bloqueadasDesasociacion = [];
    this.limpiarSeleccionesInvalidas();
  }

  private validacionActividad(actividad: any): any {
    return this.validacionesPorActividad.get(Number(actividad?.actividadId));
  }

  private todosLosIdsActividad(): number[] {
    return this.procesos.reduce((ids: number[], proceso: any) => {
      (proceso.actividadesLista || []).forEach((actividad: any) => {
        const actividadId = Number(actividad?.actividadId);
        if (actividadId > 0) {
          ids.push(actividadId);
        }
      });
      return ids;
    }, []);
  }

  private actividadesBloqueadasDesasociacion(): any[] {
    const bloqueadas: any[] = [];
    this.procesos.forEach((proceso: any) => {
      (proceso.actividadesLista || []).forEach((actividad: any) => {
        const validacion = this.validacionActividad(actividad);
        if (validacion && Array.isArray(validacion.Bloqueos) && validacion.Bloqueos.length > 0) {
          bloqueadas.push({ ...actividad, ValidacionMasiva: validacion });
        }
      });
    });
    return bloqueadas;
  }

  textoBloqueo(actividad: any): string {
    const bloqueos = actividad?.ValidacionMasiva?.Bloqueos || [];
    const tieneInactiva = bloqueos.some((bloqueo: any) => bloqueo.ActividadInactiva);
    const tieneFecha = bloqueos.some((bloqueo: any) => bloqueo.FechaParticular);
    const tieneExtension = bloqueos.some((bloqueo: any) => bloqueo.ExtensionVigente);
    if (tieneInactiva) {
      return this.translate.instant('calendario.masivo_bloqueo_actividad_inactiva');
    }
    if (tieneFecha && tieneExtension) {
      return this.translate.instant('calendario.programa_bloqueado_fechas_extension');
    }
    if (tieneFecha) {
      return this.translate.instant('calendario.programa_bloqueado_fechas');
    }
    if (tieneExtension) {
      return this.translate.instant('calendario.programa_bloqueado_extension');
    }
    return this.translate.instant('calendario.masivo_bloqueo_generico');
  }

  programasBloqueo(actividad: any): string[] {
    const bloqueos = actividad?.ValidacionMasiva?.Bloqueos || [];
    const programaIds = new Set<number>();
    bloqueos.forEach((bloqueo: any) => {
      const programaId = Number(bloqueo?.ProgramaId);
      if (programaId > 0) {
        programaIds.add(programaId);
      }
    });
    return Array.from(programaIds).map((programaId: number) => this.nombrePrograma(programaId));
  }

  private buscarActividadPorId(actividadId: number): any {
    for (const proceso of this.procesos) {
      const actividad = (proceso.actividadesLista || []).find((item: any) => Number(item?.actividadId) === Number(actividadId));
      if (actividad) {
        return actividad;
      }
    }
    return null;
  }

  private limpiarSeleccionesInvalidas() {
    this.limpiarSeleccionInvalida('asociar', this.procesosCandidatosAsociar);
    this.limpiarSeleccionInvalida('desasociar', this.procesosCandidatosDesasociar);
  }

  private limpiarSeleccionInvalida(operacion: 'asociar' | 'desasociar', procesos: any[]) {
    const idsValidos = new Set<number>();
    procesos.forEach((proceso: any) => {
      (proceso.actividadesCandidatas || []).forEach((actividad: any) => idsValidos.add(Number(actividad.actividadId)));
    });
    Array.from(this.actividadIdsSeleccionadosPorOperacion[operacion]).forEach((actividadId: number) => {
      if (!idsValidos.has(actividadId)) {
        this.actividadIdsSeleccionadosPorOperacion[operacion].delete(actividadId);
      }
    });
  }

  private normalizarDependenciaActividad(dependencia: any): any {
    if (!dependencia || dependencia === '{}') {
      return { proyectos: [], fechas: [] };
    }
    if (typeof dependencia === 'string') {
      try {
        const parsed = JSON.parse(dependencia);
        return this.normalizarDependenciaActividad(parsed);
      } catch (error) {
        return { proyectos: [], fechas: [] };
      }
    }
    const proyectos = Array.isArray(dependencia.proyectos) ? dependencia.proyectos : [];
    const fechas = Array.isArray(dependencia.fechas) ? dependencia.fechas : [];
    return { ...dependencia, proyectos, fechas };
  }

  private errorMessage(error: any, fallbackKey: string): string {
    return error?.Message ||
      error?.Data ||
      error?.message ||
      error?.error?.Message ||
      error?.error?.Data ||
      error?.error?.message ||
      this.translate.instant(fallbackKey);
  }
}
