import { Actividad } from './actividad';

export class Proceso {
    Nombre!: string;
    Descripcion!: string;
    TipoRecurrenciaId!: {Id: number, Nombre?: string};
    CalendarioId!: {Id: number}; // id del calendario
    procesoId!: number;
    actividades!: Actividad[];
}
