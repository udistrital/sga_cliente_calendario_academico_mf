import { MatTableDataSource } from '@angular/material/table';
import { Actividad } from './actividad';

export class Proceso {
    Nombre!: string;
    Descripcion!: string;
    TipoRecurrenciaId!: {Id: number, Nombre?: string};
    CalendarioId!: any; // id del calendario
    procesoId!: number;
    actividades!:  MatTableDataSource<Actividad>;


}
