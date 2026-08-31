import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestManager } from '../managers/requestManager';

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionService {
  constructor(private requestManager: RequestManager) {}

  get(endpoint: string): Observable<any> {
    this.requestManager.setPath('CONFIGURACION_SERVICE');
    return this.requestManager.get(endpoint);
  }
}
