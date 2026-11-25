import * as moment from 'moment';
import { Actividad } from 'src/app/models/calendario-academico/actividad';

export function fechaActividad(valor: any): number {
  const fecha = moment(valor, ['DD/MM/YYYY HH:mm', moment.ISO_8601]);
  return fecha.isValid() ? fecha.valueOf() : 0;
}

export function ordenarPorInicio(actividades: Actividad[]): Actividad[] {
  return [...actividades].sort(
    (a: Actividad, b: Actividad) => fechaActividad(a.FechaInicio) - fechaActividad(b.FechaInicio)
  );
}

export function estadoTemporal(actividad: Actividad): string | null {
  const inicio = fechaActividad(actividad.FechaInicio);
  const fin = fechaActividad(actividad.FechaFin);
  if (!inicio || !fin) {
    return null;
  }
  const ahora = Date.now();
  if (ahora < inicio) {
    return 'proxima';
  }
  if (ahora > fin) {
    return 'finalizada';
  }
  return 'en_curso';
}

export function avanceActividad(actividad: Actividad): number {
  const inicio = fechaActividad(actividad.FechaInicio);
  const fin = fechaActividad(actividad.FechaFin);
  if (!inicio || !fin || fin <= inicio) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(((Date.now() - inicio) * 100) / (fin - inicio))));
}

export function duracionDias(actividad: Actividad): number {
  const inicio = fechaActividad(actividad.FechaInicio);
  const fin = fechaActividad(actividad.FechaFin);
  if (!inicio || !fin || fin < inicio) {
    return 0;
  }
  return Math.max(1, Math.round((fin - inicio) / 86400000));
}
