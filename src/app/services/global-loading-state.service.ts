import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { filter, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GlobalLoadingStateService {
  private readonly idleSubject = new BehaviorSubject<boolean>(true);

  markBusy(): void {
    if (this.idleSubject.value) {
      this.idleSubject.next(false);
    }
  }

  markIdle(): void {
    if (!this.idleSubject.value) {
      this.idleSubject.next(true);
    }
  }

  runWhenIdle(action: () => void): void {
    this.idleSubject
      .pipe(
        filter((idle) => idle),
        take(1),
      )
      .subscribe(() => action());
  }
}
