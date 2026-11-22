import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { SpinnerUtilService } from 'spinner-util';

@Component({
    selector: 'udistrital-cargando',
    templateUrl: './cargando.component.html',
    styleUrls: ['./cargando.component.scss'],
    standalone: false
})
export class CargandoComponent {
  cargando$: Observable<boolean>;

  constructor(spinnerService: SpinnerUtilService) {
    this.cargando$ = spinnerService.isLoading$;
  }
}
