import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SgaCalendarioMidService {

    constructor(private requestManager: RequestManager) {
        this.requestManager.setPath('CALENDARIO_MID_SERVICE');
    }

    get(endpoint: string): Observable<any> {
        this.requestManager.setPath('CALENDARIO_MID_SERVICE');
        return this.requestManager.get(endpoint).pipe(map((response: any) => this.normalizeResponse(endpoint, response)));
    }

    post(endpoint: string, element: any): Observable<any> {
        this.requestManager.setPath('CALENDARIO_MID_SERVICE');
        return this.requestManager.post(endpoint, element).pipe(map((response: any) => this.normalizeResponse(endpoint, response)));
    }

    put(endpoint: any, element: any): Observable<any> {
        this.requestManager.setPath('CALENDARIO_MID_SERVICE');
        return this.requestManager.put(endpoint, element).pipe(map((response: any) => this.normalizeResponse(endpoint, response)));
    }

    delete(endpoint: string, element: { Id: any; }): Observable<any> {
        this.requestManager.setPath('CALENDARIO_MID_SERVICE');
        return this.requestManager.delete(endpoint, element.Id).pipe(map((response: any) => this.normalizeResponse(endpoint, response)));
    }

    private normalizeResponse(endpoint: any, response: any): any {
        if (this.shouldUnwrapApiResponse(endpoint) && this.isApiResponseDTO(response)) {
            return response.Data;
        }
        return response;
    }

    private shouldUnwrapApiResponse(endpoint: any): boolean {
        return String(endpoint || '').startsWith('calendario-academico/eventos/');
    }

    private isApiResponseDTO(response: any): boolean {
        return response !== null
            && typeof response === 'object'
            && Object.prototype.hasOwnProperty.call(response, 'Data')
            && (Object.prototype.hasOwnProperty.call(response, 'Success') || Object.prototype.hasOwnProperty.call(response, 'Status'));
    }
}
