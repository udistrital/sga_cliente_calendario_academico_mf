import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { SpinnerUtilService } from 'spinner-util';

@Injectable()
export class SpinnerUtilCounterInterceptor implements HttpInterceptor {
  private activeRequests = 0;
  private hideTimeout?: ReturnType<typeof setTimeout>;

  constructor(private spinnerService: SpinnerUtilService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.activeRequests += 1;
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = undefined;
    }
    this.spinnerService.show();

    return next.handle(req).pipe(
      finalize(() => {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        if (this.activeRequests === 0) {
          this.hideTimeout = setTimeout(() => {
            if (this.activeRequests === 0) {
              this.spinnerService.hide();
            }
          }, 150);
        }
      })
    );
  }
}
