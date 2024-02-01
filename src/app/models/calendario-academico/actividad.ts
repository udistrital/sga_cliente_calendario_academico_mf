export class Actividad {
    Nombre!: string;
    Descripcion!: string;
    FechaInicio!: string;
    FechaFin!: string;
    Activo!: boolean;
    responsables!: any[];
    TipoEventoId!: any; // id del proceso
    actividadId!: number;
    EventoPadreId!: any;
    DependenciaId!: any;
    Editable!: any;
    FechaInicioOrg!: any;
    FechaFinOrg!: any
    

}
