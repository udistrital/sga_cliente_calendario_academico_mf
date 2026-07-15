import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { HttpErrorManager } from './errorManager'

/**
 * This class manage the http connections with internal REST services. Use the response format {
 *  Code: 'xxxxx',
 *  Body: 'Some Data' (this element is returned if the request is success)
 *  ...
 * }
 */
@Injectable({
  providedIn: 'root',
})
export class RequestManager {
  private path!: any;
  constructor(private http: HttpClient, private errManager: HttpErrorManager) {}

  private getHttpOptions(): any {
    const acces_token = window.localStorage.getItem('access_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    if (acces_token !== null) {
      headers = headers.set('Authorization', `Bearer ${acces_token}`);
    }
    return { headers };
  }


  /**
   * Use for set the source path of the service (service's name must be present at src/environment/environment.ts)
   * @param service: string
   */
  public setPath(service: string) {
    this.path = environment[service as keyof typeof environment];
  }


  /**
   * Perform a GET http request
   * @param endpoint service's end-point
   * @param params (an Key, Value object with que query params for the request)
   * @returns Observable<any>
   */
  get(endpoint: any) {
    return this.http.get<any>(`${this.path}${endpoint}`, this.getHttpOptions()).pipe(
      map(
        (res) => {
          if (res.hasOwnProperty('Body')) {
            return res;
          } else {
            return res;
          }
        },
      ),
      catchError(this.errManager.handleError.bind(this)),
    );
  }

  /**
   * Perform a POST http request
   * @param endpoint service's end-point
   * @param element data to send as JSON
   * @returns Observable<any>
   */
  post(endpoint: any, element: any) {
    return this.http.post<any>(`${this.path}${endpoint}`, element, this.getHttpOptions()).pipe(
      catchError(this.errManager.handleError),
    );
  }

  /**
   * Perform a POST http request
   * @param endpoint service's end-point
   * @param element data to send as JSON
   * @returns Observable<any>
   */
  post_file(endpoint: any, element: any) {
    const acces_token = window.localStorage.getItem('access_token');
    let headers = new HttpHeaders({
      'Content-Type': 'multipart/form-data',
    });
    if (acces_token !== null) {
      headers = headers.set('Authorization', `Bearer ${acces_token}`);
    }
    return this.http.post<any>(`${this.path}${endpoint}`, element, { headers }).pipe(
      catchError(this.errManager.handleError),
    );
  }

  /**
   * Perform a PUT http request
   * @param endpoint service's end-point
   * @param element data to send as JSON, With the id to UPDATE
   * @returns Observable<any>
   */
  put(endpoint: any, element: { Id: any; }) {
    const endpointPath = String(endpoint).replace(/\/$/, '');
    const elementId = element?.Id;
    const path = (elementId && !endpointPath.endsWith(`/${elementId}`)) ? `${this.path}${endpointPath}/${elementId}` : `${this.path}${endpointPath}`;
    return this.http.put<any>(path, element, this.getHttpOptions()).pipe(
      catchError(this.errManager.handleError),
    );
  }

  /**
   * Perform a DELETE http request
   * @param endpoint service's end-point
   * @param id element's id for remove
   * @returns Observable<any>
   */
  delete(endpoint: any, id: any) {
    return this.http.delete<any>(`${this.path}${endpoint}/${id}`, this.getHttpOptions()).pipe(
      catchError(this.errManager.handleError),
    );
  }
};
