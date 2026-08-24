import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ImplicitAutenticationService } from './implicit_autentication.service';
import { OikosService } from './oikos.service';
import { ParametrosService } from './parametros.service';
import { ProyectoAcademicoService } from './proyecto_academico.service';
import { SgaAdmisionesMidService } from './sga_admisiones_mid.service';
import { SgaCalendarioMidService } from './sga_calendario_mid.service';
import { UserService } from './users.service';

export interface CalendarioFiltroOption {
  Id: number;
  Nombre: string;
}

export interface CalendarioProgramaOption extends CalendarioFiltroOption {
  FacultadId: number;
  NivelFormacionId: any;
}

export interface CalendarioFiltrosAlcance {
  periodos: CalendarioFiltroOption[];
  facultades: CalendarioFiltroOption[];
  niveles: CalendarioFiltroOption[];
  programas: CalendarioProgramaOption[];
}

@Injectable({
  providedIn: 'root',
})
export class CalendarioFiltrosAlcanceService {
  private readonly rolesGlobales = ['ADMIN_SGA', 'VICERRECTOR', 'ASESOR_VICE', 'ADMISIONES_REG'];
  private readonly rolesPrograma = ['COORDINADOR', 'COORDINADOR_PREGADO', 'COORDINADOR_POSGRADO', 'ASIS_PROYECTO'];
  private readonly rolesSecretario = ['SECRETARIA_ACADEMICA', 'SECRETARIO_ACADEMICO'];

  private programasPermitidos: CalendarioProgramaOption[] = [];
  private facultadesCache = new Map<number, Promise<CalendarioFiltroOption>>();

  constructor(
    private authService: ImplicitAutenticationService,
    private userService: UserService,
    private parametrosService: ParametrosService,
    private proyectoAcademicoService: ProyectoAcademicoService,
    private sgaAdmisionesMidService: SgaAdmisionesMidService,
    private sgaCalendarioMidService: SgaCalendarioMidService,
    private oikosService: OikosService
  ) {}

  async cargarAlcance(): Promise<CalendarioFiltrosAlcance> {
    const roles = await this.obtenerRoles();
    const periodos = await this.cargarPeriodosActivos();
    const programasActivos = await this.cargarProgramasActivos();
    this.programasPermitidos = await this.filtrarProgramasPorRol(roles, programasActivos);
    const facultades = await this.construirFacultades(this.programasPermitidos);
    const niveles = this.nivelesPorFacultad(facultades.length === 1 ? facultades[0].Id : null);

    return {
      periodos,
      facultades,
      niveles,
      programas: this.programasPermitidos,
    };
  }

  nivelesPorFacultad(facultadId: number | null): CalendarioFiltroOption[] {
    const programas = this.programasPermitidos.filter((programa) => !facultadId || programa.FacultadId === facultadId);
    const niveles = new Map<number, CalendarioFiltroOption>();
    programas.forEach((programa) => {
      const nivel = this.nivelFiltroPrograma(programa);
      if (nivel.Id > 0) {
        niveles.set(nivel.Id, nivel);
      }
    });
    return Array.from(niveles.values()).sort((a, b) => a.Nombre.localeCompare(b.Nombre));
  }

  programasPorFacultadNivel(facultadId: number | null, nivelId: number | null): CalendarioProgramaOption[] {
    return this.programasPermitidos
      .filter((programa) => !facultadId || programa.FacultadId === facultadId)
      .filter((programa) => !nivelId || this.programaPerteneceNivel(programa, nivelId))
      .sort((a, b) => a.Nombre.localeCompare(b.Nombre));
  }

  facultadesDeProgramas(programas: any[]): Promise<CalendarioFiltroOption[]> {
    return this.construirFacultades(Array.isArray(programas) ? programas : []);
  }

  filtrarProgramasPorFacultad(programas: any[], facultadId: number | null): any[] {
    if (!facultadId) {
      return Array.isArray(programas) ? programas : [];
    }
    return (Array.isArray(programas) ? programas : [])
      .filter((programa: any) => this.facultadIdPrograma(programa) === Number(facultadId));
  }

  facultadIdPrograma(programa: any): number {
    return this.obtenerId(programa?.FacultadId || programa?.facultad_id);
  }

  private async obtenerRoles(): Promise<string[]> {
    const roles = await this.authService.getRole();
    return Array.isArray(roles) ? roles.map((rol) => this.normalizarRol(rol)).filter((rol) => !!rol) : [];
  }

  private normalizarRol(rol: any): string {
    return String(rol || '').split('/').pop()?.trim().toUpperCase() || '';
  }

  private async cargarPeriodosActivos(): Promise<CalendarioFiltroOption[]> {
    const respuesta = await firstValueFrom(this.parametrosService.get('periodo?query=Activo:true,CodigoAbreviacion:PA&sortby=Id&order=desc&limit=0'));
    return this.normalizarLista(respuesta)
      .map((periodo: any) => ({ Id: this.obtenerId(periodo), Nombre: String(periodo?.Nombre || periodo?.nombre || '') }))
      .filter((periodo) => periodo.Id > 0 && periodo.Nombre)
      .sort((a, b) => b.Id - a.Id);
  }

  private async cargarProgramasActivos(): Promise<CalendarioProgramaOption[]> {
    const respuesta = await firstValueFrom(
      this.proyectoAcademicoService.get('proyecto_academico_institucion?query=Activo:true&limit=0')
    );
    return this.normalizarLista(respuesta)
      .map((programa: any) => ({
        Id: this.obtenerId(programa),
        Nombre: String(programa?.Nombre || programa?.nombre || ''),
        FacultadId: this.obtenerId(programa?.FacultadId || programa?.facultad_id),
        NivelFormacionId: programa?.NivelFormacionId || programa?.nivel_formacion_id,
      }))
      .filter((programa) => programa.Id > 0 && programa.Nombre && programa.FacultadId > 0);
  }

  private async filtrarProgramasPorRol(roles: string[], programas: CalendarioProgramaOption[]): Promise<CalendarioProgramaOption[]> {
    if (roles.some((rol) => this.rolesGlobales.includes(rol))) {
      return programas;
    }

    const programasPermitidos = new Map<number, CalendarioProgramaOption>();

    if (roles.some((rol) => this.rolesPrograma.includes(rol))) {
      const idsProgramas = await this.programasVinculadosUsuario();
      programas
        .filter((programa) => idsProgramas.includes(programa.Id))
        .forEach((programa) => programasPermitidos.set(programa.Id, programa));
    }

    if (roles.some((rol) => this.rolesSecretario.includes(rol))) {
      const facultades = await this.facultadesSecretario();
      programas
        .filter((programa) => facultades.includes(programa.FacultadId))
        .forEach((programa) => programasPermitidos.set(programa.Id, programa));
    }

    if (roles.includes('DECANO')) {
      const facultades = await this.facultadesDecano();
      programas
        .filter((programa) => facultades.includes(programa.FacultadId))
        .forEach((programa) => programasPermitidos.set(programa.Id, programa));
    }

    return Array.from(programasPermitidos.values());
  }

  private async programasVinculadosUsuario(): Promise<number[]> {
    const personaId = Number(await this.userService.getPersonaId());
    if (!personaId) {
      return [];
    }
    const respuesta: any = await firstValueFrom(this.sgaAdmisionesMidService.get('admision/dependencia_vinculacion_tercero/' + personaId));
    const dependencias = respuesta?.Data?.Data?.DependenciaId || respuesta?.Data?.DependenciaId || [];
    return Array.isArray(dependencias) ? dependencias.map((id: any) => Number(id)).filter((id: number) => id > 0) : [];
  }

  private async facultadesSecretario(): Promise<number[]> {
    const documento = await this.authService.getDocument();
    if (!documento) {
      return [];
    }
    const respuesta = await firstValueFrom(this.sgaCalendarioMidService.get('calendario-academico/secretario-academico/' + documento + '/facultades'));
    return this.normalizarIdsFacultad(respuesta);
  }

  private async facultadesDecano(): Promise<number[]> {
    const documento = await this.authService.getDocument();
    if (!documento) {
      return [];
    }
    const respuesta = await firstValueFrom(this.sgaCalendarioMidService.get('calendario-academico/decano/' + documento + '/facultades'));
    return this.normalizarIdsFacultad(respuesta);
  }

  private normalizarIdsFacultad(respuesta: any): number[] {
    const facultades = respuesta?.Facultades || respuesta?.Data?.Facultades || respuesta?.Data || [];
    return Array.isArray(facultades) ? facultades.map((facultad: any) => Number(facultad)).filter((facultad: number) => facultad > 0) : [];
  }

  private async construirFacultades(programas: any[]): Promise<CalendarioFiltroOption[]> {
    const ids = Array.from(new Set(programas.map((programa) => this.facultadIdPrograma(programa)))).filter((id) => id > 0);
    const facultades = await Promise.all(ids.map((id) => this.facultadPorId(id)));
    return facultades.sort((a, b) => a.Nombre.localeCompare(b.Nombre));
  }

  private facultadPorId(id: number): Promise<CalendarioFiltroOption> {
    if (!this.facultadesCache.has(id)) {
      this.facultadesCache.set(id, this.consultarFacultad(id));
    }
    return this.facultadesCache.get(id)!;
  }

  private async consultarFacultad(id: number): Promise<CalendarioFiltroOption> {
    try {
      const respuesta = await firstValueFrom(this.oikosService.get('dependencia/' + id));
      return { Id: id, Nombre: String(respuesta?.Nombre || respuesta?.Data?.Nombre || 'Facultad ' + id) };
    } catch (error) {
      return { Id: id, Nombre: 'Facultad ' + id };
    }
  }

  private nivelFiltroPrograma(programa: CalendarioProgramaOption): CalendarioFiltroOption {
    const nivel = programa.NivelFormacionId || {};
    const nivelPadre = nivel.NivelFormacionPadreId || nivel.nivel_formacion_padre_id;
    if (nivelPadre && this.obtenerId(nivelPadre) > 0) {
      return { Id: this.obtenerId(nivelPadre), Nombre: String(nivelPadre.Nombre || nivelPadre.nombre || '') };
    }
    return { Id: this.obtenerId(nivel), Nombre: String(nivel.Nombre || nivel.nombre || '') };
  }

  private programaPerteneceNivel(programa: CalendarioProgramaOption, nivelId: number): boolean {
    const nivel = programa.NivelFormacionId || {};
    const nivelPadre = nivel.NivelFormacionPadreId || nivel.nivel_formacion_padre_id;
    return this.obtenerId(nivel) === nivelId || this.obtenerId(nivelPadre) === nivelId;
  }

  private normalizarLista(respuesta: any): any[] {
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

  private obtenerId(valor: any): number {
    if (!valor) {
      return 0;
    }
    if (typeof valor === 'number') {
      return valor;
    }
    return Number(valor?.Id || valor?.id || 0);
  }
}
