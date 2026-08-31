import { MatTableDataSource } from '@angular/material/table';
import { Actividad } from './actividad';

export class Proceso {
    Nombre!: string;
    Descripcion!: string;
    TipoRecurrenciaId!: {Id: number, Nombre?: string};
    ProcesoCatalogoId?: any;
    CalendarioId!: any; // id del calendario
    procesoId!: number;
    Activo!: boolean;
    actividades!:  MatTableDataSource<Actividad>;


}
