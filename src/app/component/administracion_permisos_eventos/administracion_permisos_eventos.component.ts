import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { ConfiguracionService } from 'src/app/services/configuracion.service';
import { EventoService } from 'src/app/services/evento.service';

interface PerfilGestion {
  Id: number;
  Nombre: string;
  CodigoAbreviacion?: string;
  Activo?: boolean;
}

interface EventoCatalogoGestion {
  Id: number;
  Nombre: string;
  Descripcion?: string;
  Activo?: boolean;
}

interface RolGestionEventoCatalogo {
  Id: number;
  EventoCatalogoId: any;
  PerfilId: number;
  Activo: boolean;
  FechaCreacion?: string;
  FechaModificacion?: string;
}

@Component({
  selector: 'app-administracion-permisos-eventos',
  templateUrl: './administracion_permisos_eventos.component.html',
  styleUrls: ['./administracion_permisos_eventos.component.scss'],
})
export class AdministracionPermisosEventosComponent implements OnInit {
  eventoCatalogos: EventoCatalogoGestion[] = [];
  perfiles: PerfilGestion[] = [];
  relaciones: RolGestionEventoCatalogo[] = [];
  eventoCatalogoSeleccionado?: EventoCatalogoGestion;
  eventoCatalogoTexto: string | EventoCatalogoGestion = '';
  filtroDisponibles = '';
  filtroAsignados = '';
  cargando = false;
  guardandoPerfilId: number | null = null;

  constructor(
    private eventoService: EventoService,
    private configuracionService: ConfiguracionService,
    private popUpManager: PopUpManager,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargando = true;
    this.eventoService
      .get('evento_catalogo?query=Activo:true&limit=0')
      .subscribe(
        (eventos: any) => {
          this.eventoCatalogos = this.normalizarLista(eventos)
            .map((evento: any) => this.normalizarEventoCatalogo(evento))
            .filter((evento: EventoCatalogoGestion) => evento.Id > 0)
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre));
          this.cargarPerfiles();
        },
        () => {
          this.cargando = false;
          this.popUpManager.showErrorToast(this.translate.instant('calendario.error_cargar_eventos_catalogo'));
        }
      );
  }

  cargarPerfiles(): void {
    this.configuracionService.get('aplicacion/?query=Alias:SGA_MF&limit=1').subscribe(
      (aplicaciones: any) => {
        const aplicacion = this.normalizarLista(aplicaciones)[0];
        const aplicacionId = this.obtenerId(aplicacion);
        if (!aplicacionId) {
          this.cargando = false;
          this.popUpManager.showErrorToast(this.translate.instant('calendario.error_cargar_perfiles_gestion'));
          return;
        }
        this.configuracionService.get('perfil/?query=Aplicacion.Id:' + aplicacionId + '&limit=0').subscribe(
          (perfiles: any) => {
            this.perfiles = this.normalizarLista(perfiles)
              .map((perfil: any) => this.normalizarPerfil(perfil))
              .filter((perfil: PerfilGestion) => perfil.Id > 0)
              .sort((a, b) => a.Nombre.localeCompare(b.Nombre));
            this.cargando = false;
          },
          () => {
            this.cargando = false;
            this.popUpManager.showErrorToast(this.translate.instant('calendario.error_cargar_perfiles_gestion'));
          }
        );
      },
      () => {
        this.cargando = false;
        this.popUpManager.showErrorToast(this.translate.instant('calendario.error_cargar_perfiles_gestion'));
      }
    );
  }

  onSeleccionarEventoCatalogo(evento: EventoCatalogoGestion): void {
    this.eventoCatalogoSeleccionado = evento;
    this.eventoCatalogoTexto = evento.Nombre;
    this.relaciones = [];
    this.filtroDisponibles = '';
    this.filtroAsignados = '';
    if (!this.eventoCatalogoSeleccionado?.Id) {
      return;
    }
    this.cargarRelaciones();
  }

  onBuscarEventoCatalogo(): void {
    if (typeof this.eventoCatalogoTexto !== 'string') {
      return;
    }
    if (this.eventoCatalogoSeleccionado && this.eventoCatalogoTexto !== this.eventoCatalogoSeleccionado.Nombre) {
      this.eventoCatalogoSeleccionado = undefined;
      this.relaciones = [];
    }
  }

  displayEventoCatalogo(evento: EventoCatalogoGestion | string): string {
    if (typeof evento === 'string') {
      return evento;
    }
    return evento?.Nombre || '';
  }

  cargarRelaciones(): void {
    if (!this.eventoCatalogoSeleccionado?.Id) {
      return;
    }
    this.cargando = true;
    const endpoint = 'evento_catalogo_rol_gestion?query=EventoCatalogoId.Id:' + this.eventoCatalogoSeleccionado.Id + '&limit=0';
    this.eventoService.get(endpoint).subscribe(
      (relaciones: any) => {
        this.relaciones = this.consolidarRelaciones(this.normalizarLista(relaciones)
          .map((relacion: any) => this.normalizarRelacion(relacion))
          .filter((relacion: RolGestionEventoCatalogo) => relacion.Id > 0 && relacion.PerfilId > 0));
        this.cargando = false;
      },
      () => {
        this.cargando = false;
        this.popUpManager.showErrorToast(this.translate.instant('calendario.error_cargar_roles_gestion'));
      }
    );
  }

  get perfilesAsignados(): PerfilGestion[] {
    const idsActivos = new Set(this.relaciones.filter((relacion) => relacion.Activo).map((relacion) => relacion.PerfilId));
    return this.perfiles
      .filter((perfil) => idsActivos.has(perfil.Id))
      .filter((perfil) => this.coincideFiltro(perfil, this.filtroAsignados));
  }

  get eventoCatalogosFiltrados(): EventoCatalogoGestion[] {
    const texto = this.displayEventoCatalogo(this.eventoCatalogoTexto).trim().toLowerCase();
    if (!texto) {
      return this.eventoCatalogos;
    }
    return this.eventoCatalogos.filter((evento) =>
      evento.Nombre.toLowerCase().includes(texto) ||
      String(evento.Descripcion || '').toLowerCase().includes(texto) ||
      String(evento.Id).includes(texto)
    );
  }

  get perfilesDisponibles(): PerfilGestion[] {
    const idsActivos = new Set(this.relaciones.filter((relacion) => relacion.Activo).map((relacion) => relacion.PerfilId));
    return this.perfiles
      .filter((perfil) => !idsActivos.has(perfil.Id))
      .filter((perfil) => this.coincideFiltro(perfil, this.filtroDisponibles));
  }

  agregarPerfil(perfil: PerfilGestion): void {
    if (!this.eventoCatalogoSeleccionado?.Id || this.guardandoPerfilId !== null) {
      return;
    }
    const relacionExistente = this.relaciones.find((relacion) => relacion.PerfilId === perfil.Id);
    if (relacionExistente) {
      this.actualizarRelacion(relacionExistente, true);
      return;
    }
    this.guardandoPerfilId = perfil.Id;
    const payload = {
      EventoCatalogoId: { Id: this.eventoCatalogoSeleccionado.Id },
      PerfilId: perfil.Id,
      Activo: true,
    };
    this.eventoService.post('evento_catalogo_rol_gestion', payload).subscribe(
      (respuesta: any) => {
        const relacionCreada = this.normalizarRelacion(this.extraerEntidad(respuesta));
        if (relacionCreada.Id <= 0 || relacionCreada.PerfilId <= 0) {
          this.guardandoPerfilId = null;
          this.popUpManager.showErrorToast(this.translate.instant('calendario.error_guardar_roles_gestion'));
          return;
        }
        this.relaciones = this.consolidarRelaciones([...this.relaciones, relacionCreada]);
        this.guardandoPerfilId = null;
        this.popUpManager.showSuccessAlert(this.translate.instant('calendario.rol_gestion_asignado'));
        this.cargarRelaciones();
      },
      () => {
        this.guardandoPerfilId = null;
        this.popUpManager.showErrorToast(this.translate.instant('calendario.error_guardar_roles_gestion'));
      }
    );
  }

  retirarPerfil(perfil: PerfilGestion): void {
    const relacion = this.relaciones.find((item) => item.PerfilId === perfil.Id && item.Activo);
    if (!relacion || this.guardandoPerfilId !== null) {
      return;
    }
    this.actualizarRelacion(relacion, false);
  }

  private actualizarRelacion(relacion: RolGestionEventoCatalogo, activo: boolean): void {
    this.guardandoPerfilId = relacion.PerfilId;
    const payload: any = {
      Id: relacion.Id,
      EventoCatalogoId: { Id: this.eventoCatalogoSeleccionado?.Id || this.obtenerId(relacion.EventoCatalogoId) },
      PerfilId: relacion.PerfilId,
      Activo: activo,
    };
    if (relacion.FechaCreacion) {
      payload.FechaCreacion = relacion.FechaCreacion;
    }
    this.eventoService.put('evento_catalogo_rol_gestion/' + relacion.Id, payload).subscribe(
      () => {
        relacion.Activo = activo;
        this.relaciones = this.consolidarRelaciones(this.relaciones);
        this.guardandoPerfilId = null;
        this.popUpManager.showSuccessAlert(
          this.translate.instant(activo ? 'calendario.rol_gestion_asignado' : 'calendario.rol_gestion_retirado')
        );
        this.cargarRelaciones();
      },
      () => {
        this.guardandoPerfilId = null;
        this.popUpManager.showErrorToast(this.translate.instant('calendario.error_guardar_roles_gestion'));
      }
    );
  }

  private coincideFiltro(perfil: PerfilGestion, filtro: string): boolean {
    const texto = (filtro || '').trim().toLowerCase();
    if (!texto) {
      return true;
    }
    return perfil.Nombre.toLowerCase().includes(texto) || String(perfil.Id).includes(texto);
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

  private extraerEntidad(respuesta: any): any {
    if (respuesta?.Data && !Array.isArray(respuesta.Data)) {
      return respuesta.Data;
    }
    return respuesta;
  }

  private consolidarRelaciones(relaciones: RolGestionEventoCatalogo[]): RolGestionEventoCatalogo[] {
    const porPerfil = new Map<number, RolGestionEventoCatalogo>();
    relaciones.forEach((relacion) => {
      const actual = porPerfil.get(relacion.PerfilId);
      if (!actual || this.debeReemplazarRelacion(actual, relacion)) {
        porPerfil.set(relacion.PerfilId, relacion);
      }
    });
    return Array.from(porPerfil.values());
  }

  private debeReemplazarRelacion(actual: RolGestionEventoCatalogo, candidata: RolGestionEventoCatalogo): boolean {
    if (candidata.Activo && !actual.Activo) {
      return true;
    }
    if (candidata.Activo === actual.Activo) {
      return candidata.Id > actual.Id;
    }
    return false;
  }

  private normalizarEventoCatalogo(evento: any): EventoCatalogoGestion {
    return {
      Id: this.obtenerId(evento),
      Nombre: String(evento?.Nombre || evento?.nombre || ''),
      Descripcion: String(evento?.Descripcion || evento?.descripcion || ''),
      Activo: evento?.Activo !== false,
    };
  }

  private normalizarPerfil(perfil: any): PerfilGestion {
    return {
      Id: this.obtenerId(perfil),
      Nombre: String(perfil?.Nombre || perfil?.nombre || ''),
      CodigoAbreviacion: String(perfil?.CodigoAbreviacion || perfil?.codigo_abreviacion || ''),
      Activo: perfil?.Activo !== false,
    };
  }

  private normalizarRelacion(relacion: any): RolGestionEventoCatalogo {
    return {
      Id: this.obtenerId(relacion),
      EventoCatalogoId: relacion?.EventoCatalogoId || relacion?.evento_catalogo_id,
      PerfilId: Number(relacion?.PerfilId || relacion?.perfil_id || 0),
      Activo: relacion?.Activo !== false,
      FechaCreacion: relacion?.FechaCreacion || relacion?.fecha_creacion,
      FechaModificacion: relacion?.FechaModificacion || relacion?.fecha_modificacion,
    };
  }

  private obtenerId(valor: any): number {
    if (typeof valor === 'number') {
      return valor;
    }
    return Number(valor?.Id || valor?.id || 0);
  }
}
