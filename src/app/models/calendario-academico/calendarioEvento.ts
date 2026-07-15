export class CalendarioEvento {
    Id!: number;
    FechaCreacion!: string;
    FechaModificacion!: string;
    FechaInicio!: string;
    FechaFin!: string;
    Activo!: boolean;
    DependenciaId: any;
    ProcesoId: any;
    EventoCatalogoId?: any;
}
