export class Actividad {
    Nombre!: string;
    Descripcion!: string;
    FechaInicio!: string;
    FechaFin!: string;
    Activo!: boolean;
    responsables!: any[];
    ProcesoId!: any;
    EventoCatalogoId?: any;
    NumeroOcurrencia?: number;
    actividadId!: number;
    DependenciaId!: any;
    Editable!: any;
    PuedeEditar?: boolean;
    MotivoNoEditable?: string;
    FechaInicioOrg!: any;
    FechaFinOrg!: any
    Extensiones!: any[];
    

}
