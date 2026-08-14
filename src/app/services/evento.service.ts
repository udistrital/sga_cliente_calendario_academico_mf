import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestManager } from '../managers/requestManager';

@Injectable()
export class EventoService {

    constructor(private requestManager: RequestManager) {
        this.requestManager.setPath('EVENTO_SERVICE');
    }

    get(endpoint: string): Observable<any> {
        this.requestManager.setPath('EVENTO_SERVICE');
        return this.requestManager.get(endpoint);
    }

    post(endpoint: string, element: any): Observable<any> {
        this.requestManager.setPath('EVENTO_SERVICE');
        return this.requestManager.post(endpoint, element);
    }

    put(endpoint: string, element: any): Observable<any> {
        this.requestManager.setPath('EVENTO_SERVICE');
        return this.requestManager.put(endpoint, element);
    }

    delete(endpoint: string, element: { Id: any; }): Observable<any> {
        this.requestManager.setPath('EVENTO_SERVICE');
        return this.requestManager.delete(endpoint, element.Id);
    }
}
