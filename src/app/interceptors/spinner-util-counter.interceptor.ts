import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { SpinnerUtilService } from 'spinner-util';
import { GlobalLoadingStateService } from '../services/global-loading-state.service';

@Injectable()
export class SpinnerUtilCounterInterceptor implements HttpInterceptor {
  private activeRequests = 0;
  private showTimeout?: ReturnType<typeof setTimeout>;
  private hideTimeout?: ReturnType<typeof setTimeout>;
  private visible = false;

  constructor(
    private spinnerService: SpinnerUtilService,
    private loadingState: GlobalLoadingStateService,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.activeRequests += 1;
    this.loadingState.markBusy();
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = undefined;
    }
    this.scheduleShow();

    return next.handle(req).pipe(
      finalize(() => {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        if (this.activeRequests === 0) {
          if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = undefined;
          }
          this.hideTimeout = setTimeout(() => {
            this.hideTimeout = undefined;
            if (this.activeRequests === 0) {
              if (this.visible) {
                this.visible = false;
                this.spinnerService.hide();
              }
              this.loadingState.markIdle();
            }
          }, 150);
        }
      })
    );
  }

  private scheduleShow(): void {
    if (this.visible || this.showTimeout) {
      return;
    }
    this.showTimeout = setTimeout(() => {
      this.showTimeout = undefined;
      if (this.activeRequests > 0 && !this.visible) {
        this.visible = true;
        this.spinnerService.show();
      }
    });
  }
}
