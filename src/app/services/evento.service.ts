import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from './../../environments/environment';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { RequestManager } from '../managers/requestManager';

const httpOptions = {
    headers: new HttpHeaders({
        'Accept': 'application/json',
    }),
}

@Injectable()
export class EventoService {

  constructor(private requestManager: RequestManager) {
    this.requestManager.setPath('EVENTO_SERVICE');
  }
  get(endpoint: string) :any {
    this.requestManager.setPath('EVENTO_SERVICE');
    return this.requestManager.get(endpoint);
  }
  post(endpoint: string, element: any) {
    this.requestManager.setPath('EVENTO_SERVICE');
    return this.requestManager.post(endpoint, element);
  }
  put(endpoint: string, element: any) {
    this.requestManager.setPath('EVENTO_SERVICE');
    return this.requestManager.put(endpoint, element);
  }
  delete(endpoint: string, element: any) {
    this.requestManager.setPath('EVENTO_SERVICE');
    return this.requestManager.delete(endpoint, element.Id);
  }
}
