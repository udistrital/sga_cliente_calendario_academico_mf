import { Periodo } from 'src/app/models/periodo/periodo';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ParametrosService } from 'src/app/services/parametros.service';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { FORM_PERIODO } from './form-periodo';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import * as moment from 'moment';


@Component({
  selector: 'ngx-crud-periodo',
  templateUrl: './crud-periodo.component.html',
  styleUrls: ['./crud-periodo.component.scss'],
})
export class CrudPeriodoComponent implements OnInit {
  periodo_id!: number;

  @Input('periodo_id')
  set name(periodo_id: number) {
    this.periodo_id = periodo_id;
    this.loadPeriodo();
  }

  @Output() eventChange = new EventEmitter();

  //info_periodo!: Periodo;
  info_periodo!: any;
  formPeriodo: any;
  regPeriodo: any;
  clean!: boolean;

  constructor(
    private translate: TranslateService,
    private parametrosService: ParametrosService,
    private popUpManager: PopUpManager,
  ) {
    this.formPeriodo = FORM_PERIODO;
    this.construirForm();
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.construirForm();
    });
  }

  construirForm() {
    this.formPeriodo.titulo = this.translate.instant('GLOBAL.periodo');
    this.formPeriodo.btn = this.translate.instant('GLOBAL.guardar');
    for (let i = 0; i < this.formPeriodo.campos.length; i++) {
      this.formPeriodo.campos[i].label = this.translate.instant(
        'GLOBAL.' + this.formPeriodo.campos[i].label_i18n,
      );
      this.formPeriodo.campos[i].placeholder = this.translate.instant(
        'GLOBAL.placeholder_' + this.formPeriodo.campos[i].label_i18n,
      );
    }
  }

  useLanguage(language: string) {
    this.translate.use(language);
  }

  getIndexForm(nombre: String): number {
    for (let index = 0; index < this.formPeriodo.campos.length; index++) {
      const element = this.formPeriodo.campos[index];
      if (element.nombre === nombre) {
        return index;
      }
    }
    return 0;
  }

  loadPeriodo(): void {
    if (this.periodo_id !== undefined && this.periodo_id !== 0) {
      this.parametrosService
        .get('periodo/' + this.periodo_id)
        .subscribe((res:any) => {
          if (res !== null) {
            this.info_periodo = <Periodo>res['Data'];
            this.info_periodo.InicioVigencia = moment(
              this.info_periodo.InicioVigencia,
            ).format('YYYY-MM-DD');
            this.info_periodo.FinVigencia = moment(
              this.info_periodo.FinVigencia,
            ).format('YYYY-MM-DD');
          }
        });
    } else {
      this.info_periodo = undefined;
      this.clean = !this.clean;
    }
  }

  updatePeriodo(periodo: any): void {
    this.popUpManager
      .showConfirmAlert(
        this.translate.instant('periodo.seguro_actualizar_periodo'),
        this.translate.instant('GLOBAL.actualizar'),
      )
      .then(ok => {
        if (ok.value) {
          const p = <Periodo>periodo;
          this.info_periodo.Year = p.Year;
          this.info_periodo.Ciclo = '' + p.Ciclo;
          this.info_periodo.Nombre =
            this.info_periodo.Year + '-' + this.info_periodo.Ciclo;
          this.info_periodo.InicioVigencia = p.InicioVigencia;
          this.info_periodo.FinVigencia = p.FinVigencia;
          this.info_periodo.Descripcion =
            'Periodo académico ' + this.info_periodo.Nombre;
          this.info_periodo.Activo = true;
          this.info_periodo.InicioVigencia =
            moment(this.info_periodo.InicioVigencia).format(
              'YYYY-MM-DDTHH:mm',
            ) + ':00Z';
          this.info_periodo.FinVigencia =
            moment(this.info_periodo.FinVigencia).format('YYYY-MM-DDTHH:mm') +
            ':00Z';
          this.parametrosService
            .put('periodo', this.info_periodo)
            .subscribe(res => {
              this.loadPeriodo();
              this.eventChange.emit(true);
              this.popUpManager.showSuccessAlert(
                this.translate.instant('periodo.periodo_actualizado'),
              );
            });
        }
      });
  }

  createPeriodo(periodo: any): void {
    this.popUpManager
      .showConfirmAlert(
        this.translate.instant('periodo.seguro_continuar_registrar_periodo'),
        this.translate.instant('GLOBAL.registrar'),
      )
      .then(ok => {
        if (ok.value) {
          this.info_periodo = <Periodo>periodo;
          this.info_periodo.Ciclo = '' + this.info_periodo.Ciclo;
          this.info_periodo.Nombre =
            this.info_periodo.Year + '-' + this.info_periodo.Ciclo;
          this.info_periodo.Descripcion =
            'Periodo académico ' + this.info_periodo.Nombre;
          this.info_periodo.CodigoAbreviacion = 'PA';
          this.info_periodo.Activo = true;
          this.info_periodo.InicioVigencia =
            moment(this.info_periodo.InicioVigencia).format(
              'YYYY-MM-DDTHH:mm',
            ) + ':00Z';
          this.info_periodo.FinVigencia =
            moment(this.info_periodo.FinVigencia).format('YYYY-MM-DDTHH:mm') +
            ':00Z';
          this.info_periodo.AplicacionId = 41; // ID de SGA en Configuracion_CRUD
          this.parametrosService
            .post('periodo', this.info_periodo)
            .subscribe((res:any) => {
              this.info_periodo = <Periodo>res['Data'];
              this.eventChange.emit(true);
              window.location.href = '#/pages/periodo/list-periodo';
              this.popUpManager.showSuccessAlert(
                this.translate.instant('periodo.periodo_creado'),
              );
            });
        }
      });
  }

  ngOnInit() {
    this.loadPeriodo();
  }

  validarForm(event:any) {
    if (event.valid) {
      if (this.info_periodo === undefined) {
        this.createPeriodo(event.data.Periodo);
      } else {
        this.updatePeriodo(event.data.Periodo);
      }
    }
  }
}
