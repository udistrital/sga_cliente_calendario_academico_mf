import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

const httpOptions = {
    headers: new HttpHeaders({
        'Accept': 'application/json',
    }),
}

@Injectable({
  providedIn: 'root',
})

export class AnyService {

    constructor(private http: HttpClient) {
    }

    get(path: string, endpoint: string) {
        return this.http.get(path + endpoint, httpOptions).pipe(
          catchError(this.handleError),
        );
    }

    getp(path: any, endpoint: any) {
      return this.http.get(path + endpoint, { ...httpOptions, reportProgress: true, observe: 'events' }).pipe(
        catchError(this.handleError),
      );
  }

    post(path: any, endpoint: any, element: any) {
        return this.http.post(path + endpoint, element, httpOptions).pipe(
          catchError(this.handleError),
        );
    }

    put(path: any, endpoint: any, element: any) {
        return this.http.put(path + endpoint + '/', element, httpOptions).pipe(
          catchError(this.handleError),
        ); // + element.Id
    }
    put2(path: any, endpoint: any, element: { Id: string; }) {
      return this.http.put(path + endpoint + '/' + element.Id, element, httpOptions).pipe(
        catchError(this.handleError),
      );
    }

    delete(path: any, endpoint: any, element: { Id: string; }) {
        return this.http.delete(path + endpoint + '/' + element.Id, httpOptions).pipe(
          catchError(this.handleError),
        );
    }

    delete2(path: any, endpoint: any) {
      return this.http.delete(path + endpoint, httpOptions).pipe(
        catchError(this.handleError),
      );
  }

    private handleError(error: HttpErrorResponse) {
        if (error.error instanceof ErrorEvent) {
          // A client-side or network error occurred. Handle it accordingly.
          console.error('An error occurred:', error.error.message);
        } else {
          // The backend returned an unsuccessful response code.
          // The response body may contain clues as to what went wrong,
          console.error(
            `Backend returned code ${error.status}, ` +
            `body was: ${error.error}`);
        }
        // return an observable with a user-facing error message
        return throwError({
          status: error.status,
          message: 'Something bad happened; please try again later.',
        });
    };
}
