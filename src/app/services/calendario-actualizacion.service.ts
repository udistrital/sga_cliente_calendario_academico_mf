import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface CalendarioActualizacion {
  calendarioId?: number;
  actividadIds?: number[];
}

@Injectable({
  providedIn: 'root',
})
export class CalendarioActualizacionService {
  private readonly actualizacionSubject = new Subject<CalendarioActualizacion>();
  readonly actualizacion$: Observable<CalendarioActualizacion> = this.actualizacionSubject.asObservable();

  notificar(actualizacion: CalendarioActualizacion) {
    this.actualizacionSubject.next(actualizacion);
  }
}
