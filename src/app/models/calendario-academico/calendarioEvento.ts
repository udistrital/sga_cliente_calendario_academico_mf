export class CalendarioEvento {
    Id!: number;
    Nombre!: string;
    Descripcion: any;
    FechaCreacion!: string;
    FechaModificacion!: string;
    FechaInicio!: string;
    FechaFin!: string;
    Activo!: boolean;
    DependenciaId: any;
    EventoPadreId!: {Id: number};
    TipoEventoId: any;
}
