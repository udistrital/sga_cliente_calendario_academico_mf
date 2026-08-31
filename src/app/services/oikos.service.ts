import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestManager } from '../managers/requestManager';

@Injectable({
  providedIn: 'root',
})
export class OikosService {
  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('OIKOS_SERVICE');
  }

  get(endpoint: string): Observable<any> {
    this.requestManager.setPath('OIKOS_SERVICE');
    return this.requestManager.get(endpoint);
  }
}
