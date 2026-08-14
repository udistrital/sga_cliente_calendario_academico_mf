import { Injectable } from '@angular/core';
import { RequestManager } from '../managers/requestManager';
import { from, Observable, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UserService } from './users.service';

@Injectable()
export class SgaCalendarioMidService {

    constructor(private requestManager: RequestManager, private userService: UserService) {
        this.requestManager.setPath('CALENDARIO_MID_SERVICE');
    }

    get(endpoint: string): Observable<any> {
        this.requestManager.setPath('CALENDARIO_MID_SERVICE');
        return this.requestManager.get(endpoint);
    }

    post(endpoint: string, element: any): Observable<any> {
        return this.withTerceroId(element).pipe(
            switchMap((payload) => {
                this.requestManager.setPath('CALENDARIO_MID_SERVICE');
                return this.requestManager.post(endpoint, payload);
            }),
        );
    }

    put(endpoint: any, element: any): Observable<any> {
        return this.withTerceroId(element).pipe(
            switchMap((payload) => {
                this.requestManager.setPath('CALENDARIO_MID_SERVICE');
                return this.requestManager.put(endpoint, payload);
            }),
        );
    }

    delete(endpoint: string, element: { Id: any; }): Observable<any> {
        return this.withTerceroId(element).pipe(
            switchMap((payload) => {
                this.requestManager.setPath('CALENDARIO_MID_SERVICE');
                return this.requestManager.delete(endpoint, payload.Id, payload);
            }),
        );
    }

    private withTerceroId(element: any): Observable<any> {
        return from(this.userService.getTerceroId()).pipe(
            switchMap((terceroId) => {
                const payload = element && typeof element === 'object' && !Array.isArray(element)
                    ? { ...element, TerceroId: Number(terceroId) }
                    : element;
                if (!payload || !Number.isInteger(Number(payload.TerceroId)) || Number(payload.TerceroId) <= 0) {
                    return throwError(() => new Error('No fue posible obtener un TerceroId válido'));
                }
                return of(payload);
            }),
        );
    }
}
