import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ViewChild, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { MatDatepicker } from '@angular/material/datepicker';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { AnyService } from 'src/app/services/any.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogPreviewFileComponent } from '../dialog-preview-file/dialog-preview-file.component';

@Component({
  selector: 'ngx-dinamicform',
  templateUrl: './dinamicform.component.html',
  styleUrls: ['./dinamicform.component.scss'],
})

export class DinamicformComponent implements OnInit, OnChanges {

  @Input('normalform') normalform: any;
  @Input('modeloData') modeloData: any;
  @Input('clean') clean!: boolean;
  @Output() result: EventEmitter<any> = new EventEmitter();
  @Output() resultAux: EventEmitter<any> = new EventEmitter();
  @Output() resultSmart: EventEmitter<any> = new EventEmitter();
  @Output() interlaced: EventEmitter<any> = new EventEmitter();
  @Output() percentage: EventEmitter<any> = new EventEmitter();
  data: any;
  searchTerm$ = new Subject<any>();
  @ViewChild(MatDatepicker, { static: true }) datepicker!: MatDatepicker<Date>;
  @ViewChildren("documento") fileInputs!: QueryList<ElementRef>;

  DocumentoInputVariable!: ElementRef;
  init!: boolean;

  constructor(
    private sanitization: DomSanitizer,
    private anyService: AnyService,
    private matDialog: MatDialog,
  ) {
    this.data = {
      valid: true,
      confirm: true,
      data: {},
      percentage: 0,
      files: [],
    };

    this.searchTerm$
      .pipe(
        debounceTime(700),
        distinctUntilChanged(),
        filter(data => (data.text).length > 3),
        switchMap(({ text, path, query, keyToFilter, field }) => this.searchEntries(text, path, query, keyToFilter, field)),
      ).subscribe((response: any) => {
        let opciones = []
        if (response.queryOptions.hasOwnProperty('Data')) {
          opciones = response.queryOptions.Data;
        } else {
          opciones = response.queryOptions;
        }
        const fieldAutocomplete = this.normalform.campos.filter((field:any) => (field.nombre === response.options.field.nombre));
        fieldAutocomplete[0].opciones = opciones;
        if (opciones.length == 1 && Object.keys(opciones[0]).length == 0) {
          let canEmit = fieldAutocomplete[0].entrelazado ? fieldAutocomplete[0].entrelazado : false;
          if (canEmit) {
            this.interlaced.emit({...fieldAutocomplete[0], noOpciones: true, valorBuscado: response.keyToFilter});
          }
        }
      });
  }

  displayWithFn(field:any) {
    return field ? field.Nombre : '';
  }

  setNewValue({ element, field }:any) {
    field.valor = element.option.value;
    this.validCampo(field);
  }

  searchEntries(text:any, path:any, query:any, keyToFilter:any, field:any) {

    const channelOptions = new BehaviorSubject<any>({ field: field });
    const options$ = channelOptions.asObservable();
    const queryOptions$ = this.anyService.get(path, query.replace(keyToFilter, text))
    return combineLatest([options$, queryOptions$]).pipe(
      map(([options$, queryOptions$]) => ({
        options: options$,
        queryOptions: queryOptions$,
        keyToFilter: text,
      })),
    );
  }

  ngOnChanges(changes:any) {
    if (changes.normalform !== undefined) {
      if (changes.normalform.currentValue !== undefined) {
        this.normalform = changes.normalform.currentValue;
      }
    }
    if (changes.modeloData !== undefined) {
      if (changes.modeloData.currentValue !== undefined) {
        this.modeloData = changes.modeloData.currentValue;
        if (this.normalform.campos) {
          this.normalform.campos.forEach((element:any) => {
            for (const i in this.modeloData) {
              if (this.modeloData.hasOwnProperty(i)) {
                if (i === element.nombre && this.modeloData[i] !== null) {
                  switch (element.etiqueta) {
                    case 'selectmultiple':
                      element.valor = [];
                      if (this.modeloData[i].length > 0) {
                        this.modeloData[i].forEach((e1:any) => element.opciones.forEach((e2:any) => {
                          if (e1.Id === e2.Id) {
                            element.valor.push(e2);
                          }
                        }));
                      }
                      break;
                    case 'select':
                      if (element.hasOwnProperty('opciones')) {
                        if (element.opciones != undefined) {
                          element.opciones.forEach((e1:any) => {
                            if (this.modeloData[i].Id !== null || this.modeloData[i].Id !== undefined) {
                              if (e1.Id === this.modeloData[i].Id) {
                                element.valor = e1;
                              }
                            }
                          });
                        }
                      }
                      break;
                    case 'mat-date':
                      element.valor = new Date(this.modeloData[i]);
                      break;
                    case 'file':
                      element.url = this.cleanURL(this.modeloData[i]);
                      element.urlTemp = this.modeloData[i];
                      break;
                    default:
                      element.valor = this.modeloData[i];
                  }
                  this.validCampo(element);
                }
              }
            }
          });
          this.setPercentage()
        }
      }
    }
    if (changes.clean !== undefined && this.init) {
      this.clearForm();
      this.clean = false;
    }
  }

  ngAfterViewInit() {
    this.fileInputs.changes.subscribe(x => {
      if (x.length) {
        this.DocumentoInputVariable = x.first;
      }
    })
  }

  download(url:any, title:any, w:any, h:any, previewForm?:any, message?:any) {
    if (previewForm !== undefined) {
      switch (previewForm) {
        case "preview":
          this.preview(url, title, message);
          break;
        case "nopreview":
          this.nopreview(url, title);
          break;
        case "both":
          const spliturl = url.split('|');
          this.preview(spliturl[0], title, message);
          this.nopreview(spliturl[1], title);
          break;
        default:
          this.preview(url, title, message);
          break;
      }
    } else {
      this.preview(url, title, message);
    }
  }

  preview(url:any, title:any, message:any) {
    const dialogDoc = new MatDialogConfig();
    dialogDoc.width = '80vw';
    dialogDoc.height = '90vh';
    dialogDoc.data = {url, title, message};
    this.matDialog.open(DialogPreviewFileComponent, dialogDoc);
  }

  nopreview(url:any, title:any) {
    const download = document.createElement("a");
    download.href = url;
    download.download = title;
    document.body.appendChild(download);
    download.click();
    document.body.removeChild(download);
  }

  onChange(event:any, c:any) {
    if (c.valor !== undefined) {
      c.urlTemp = URL.createObjectURL(event.srcElement.files[0])
      c.url = this.cleanURL(c.urlTemp);
      c.valor = event.srcElement.files[0];
      this.validCampo(c);
      c.File = event.srcElement.files[0];
    }
    // Tipo file
    if (c.valor === undefined && c.etiqueta === 'file') {
      c.urlTemp = URL.createObjectURL(event.srcElement.files[0])
      c.url = this.cleanURL(c.urlTemp);
      c.valor = event.srcElement.files[0];
      this.validCampo(c);
      c.File = event.srcElement.files[0];
    }
  }

  onChange2(event:any, c:any) {
    if (event.srcElement.files.length > 0) {
      c.File = event.srcElement.files[0];
      c.urlTemp = URL.createObjectURL(event.srcElement.files[0]);
      c.url = this.cleanURL(c.urlTemp);
    } else {
      c.File = undefined, c.urlTemp = undefined, c.url = undefined;
    }
    this.validCampo(c);
  }

  cleanURL(oldURL: string): SafeResourceUrl {
    return this.sanitization.bypassSecurityTrustUrl(oldURL);
  }

  validlog1(event:any) {
    const camposLog1 = this.normalform.campos.filter((campo: any) => (campo.etiqueta === 'inputConfirmacion'));
    // if (camposLog1[0].valor> )

  }

  confirmacion(event:any) {
    this.checkConfirmacion();
    if(event.entrelazado){
      this.interlaced.emit(event);
    }
  }

  checkConfirmacion() {
    let valido = true;

    const camposAValidar = this.normalform.campos.filter((campo: any) => (campo.etiqueta === 'inputConfirmacion'));
    let l = camposAValidar.length;

    if (l % 2 == 0) {
      for (let i = 0; i < l; i+=2) {
        if (!(camposAValidar[i].valor === camposAValidar[i+1].valor)) {
          camposAValidar[i].clase = 'form-control form-control-danger';
          camposAValidar[i+1].clase = 'form-control form-control-danger';
          camposAValidar[i].alerta = camposAValidar[i].mensajeIguales;
          camposAValidar[i+1].alerta = camposAValidar[i+1].mensajeIguales;
          valido = false;
        } else {
          camposAValidar[i].clase = 'form-control form-control-success';
          camposAValidar[i+1].clase = 'form-control form-control-success';
          camposAValidar[i].alerta = '';
          camposAValidar[i+1].alerta = '';
        }
      }
    } else {
      console.warn('Error, algún campo de confirmacion no tiene pareja');
    }

    return valido;

  }

  ngOnInit() {
    this.init = true;
    if (!this.normalform.tipo_formulario) {
      this.normalform.tipo_formulario = 'grid';
    }

    this.normalform.campos = this.normalform.campos.map((d:any) => {
      d.clase = 'form-control';
      if (d.relacion === undefined) {
        d.relacion = true;
      }
      if (!d.valor) {
        d.valor = '';
      }
      if (!d.deshabilitar) {
        d.deshabilitar = false;
      }
      if (d.etiqueta === 'fileRev') {
        d.File = undefined;
        d.urlTemp = undefined;
      }
      return d;
    });
  }

  onChangeDate(event:any, c:any) {
    c.valor = event.value;
  }

  validCampo(c:any, emit = true): boolean {
    if (c.etiqueta === 'fileRev' && !c.ocultar) {
      if (c.requerido && !c.valor && (c.File === undefined || c.File === null || c.File === '' ||
          c.urlTemp === undefined || c.urlTemp === null || c.urlTemp === '')) {
            c.alerta = '** Debe llenar este campo'
            c.clase = 'form-control form-control-danger';
            return false;
      }
      if (c.File) {
        if (c.tamanoMaximo) {
          if (c.File.size > c.tamanoMaximo * 1024000) {
            c.clase = 'form-control form-control-danger';
            c.alerta = 'El tamaño del archivo es superior a : ' + c.tamanoMaximo + 'MB. ';
            return false;
          }
        }
        if (c.tipo) {
          if (c.tipo.indexOf(c.File.type.split('/')[1]) === -1) {
            c.clase = 'form-control form-control-danger';
            c.alerta = 'Solo se admiten los siguientes formatos: ' + c.formatos;
            return false;
          }
        }
      }
      c.clase = 'form-control form-control-success';
      c.alerta = '';
      return true;
    }
    if (c.etiqueta === 'file' && !!c.ocultar) {
      return true;
      // console.info((c.etiqueta === 'file' && (c.valor)?true:c.valor.name === undefined));
    }
    if (c.requerido && ((c.valor === '' && c.etiqueta !== 'file') || c.valor === null || c.valor === undefined ||
      (JSON.stringify(c.valor) === '{}' && c.etiqueta !== 'file') || JSON.stringify(c.valor) === '[]')
      || ((c.etiqueta === 'file' && c.valor.name === undefined) && (c.etiqueta === 'file' && (c.urlTemp === undefined || c.urlTemp === '')))
      || ((c.etiqueta === 'file' && c.valor.name === null) && (c.etiqueta === 'file' && (c.urlTemp === null || c.urlTemp === '')))) {
      if (c.entrelazado && emit) {
        this.interlaced.emit(c);
        return true;
      }
      c.alerta = '** Debe llenar este campo';
      c.clase = 'form-control form-control-danger';
      return false;
    }
    if ((c.etiqueta === 'input' || c.etiqueta === 'inputConfirmacion') && c.tipo === 'number') {
      c.valor = parseInt(c.valor, 10);
      if (c.valor < c.minimo) {
        c.clase = 'form-control form-control-danger';
        c.alerta = 'El valor no puede ser menor que ' + c.minimo;
        return false;
      }
    }
    if ((c.etiqueta === 'input' || c.etiqueta === 'inputConfirmacion') && c.tipo === 'number') {
      c.valor = parseInt(c.valor, 10);
      if (c.valor > c.maximolog) {
        c.clase = 'form-control form-control-danger';
        c.alerta = 'El valor no puede ser mayor que ' + c.maximolog;
        return false;
      }
    }
    if ((c.etiqueta === 'input' || c.etiqueta === 'inputConfirmacion') && c.tipo === 'email') {
      const pattern: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      let esValido: boolean = c.valor.match(pattern) ? true : false;
      if(!esValido) {
        c.clase = 'form-control form-control-danger';
        c.alerta = 'No es un correo válido';
        return false;
      }
    }
    if (c.etiqueta === 'radio') {
      if (c.valor.Id === undefined) {
        c.clase = 'form-control form-control-danger';
        c.alerta = 'Seleccione el campo';
        return false;
      }
    }
    if (c.etiqueta === 'select') {
      if (c.valor == null) {
        c.clase = 'form-control form-control-danger';
        c.alerta = 'Seleccione el campo';
        return false;
      }
    }
    if (c.etiqueta === 'file' && c.valor !== null && c.valor !== undefined && c.valor !== '' && !c.ocultar) {
      if (c.valor.size > c.tamanoMaximo * 1024000) {
        c.clase = 'form-control form-control-danger';
        c.alerta = 'El tamaño del archivo es superior a : ' + c.tamanoMaximo + 'MB. ';
        return false;
      }
      if (c.valor.type) {
        if (c.formatos.indexOf(c.valor.type.split('/')[1]) === -1) {
          c.clase = 'form-control form-control-danger';
          c.alerta = 'Solo se admiten los siguientes formatos: ' + c.formatos;
          return false;
        }
      }
    }
    if (c.entrelazado && emit) {
      if (c.valor) {
        this.interlaced.emit(c);
      }
    }
    if (c.etiqueta === 'textarea') {
      const caracteresEspeciales1: RegExp = /[\"\\\/\b\f]/g;  // pueden romper JSON string in api GO
      const caracteresEspeciales2: RegExp = /[\t\n\r]/g;  // pueden romper JSON string in api GO
      const multiespacio: RegExp = /\s\s+/g; // bonus: quitar muchos espacios juntos
      c.valor = c.valor.replace(caracteresEspeciales1,'');
      c.valor = c.valor.replace(caracteresEspeciales2,' '); // tabs y enter se reemplazan por espacio
      c.valor = c.valor.replace(multiespacio, ' ');
      if (c.cantidadCaracteres) {
        if (c.valor.length > c.cantidadCaracteres) {
          c.clase = 'form-control form-control-danger'
          c.alerta = 'El texto supera el máximo de caracteres permitido (máximo: ' +  c.cantidadCaracteres + ', actualmente: ' + c.valor.length +')';
          return false;
        }
      }
    }
    // if (!this.normalform.btn) {
    //   if (this.validForm().valid) {
    //     this.resultSmart.emit(this.validForm());
    //   }
    // }
    c.clase = 'form-control form-control-success';
    c.alerta = '';
    return true;
  }

  clearForm() {
    this.normalform.campos.forEach((d:any) => {
      d.valor = null;
      if (d.etiqueta === 'file') {
        const nativeElement = this.DocumentoInputVariable ? this.DocumentoInputVariable.nativeElement ? this.DocumentoInputVariable.nativeElement : null : null;
        nativeElement ? nativeElement.value = '' : '';
        d.File = undefined;
        d.url = "";
        d.urlTemp = "";
        d.valor = "";
      }
      if (d.etiqueta === 'fileRev') {
        d.File = undefined, d.urlTemp = undefined, d.url = undefined, d.valor = undefined;
      }
      if (d.etiqueta === 'autocomplete') {
        const e = document.querySelectorAll('.inputAuto');
        // e.forEach((e: HTMLInputElement) => { e.value = ''; });
        e.forEach((e: any) => { e.value = ''; });
        d.opciones = [];
      }
      d.alerta = "";
      d.clase = 'form-control form-control-success';
  });
    this.percentage.emit(0);
  }

  validForm() {
    const result:any = {};
    let requeridos = 0;
    let resueltos = 0;
    this.data.data = {};
    this.data.percentage = 0;
    this.data.files = [];
    this.data.valid = true;

    this.normalform.campos.forEach((d:any) => {
      requeridos = d.requerido && !d.ocultar ? requeridos + 1 : requeridos;
      if (this.validCampo(d, false)) {
        if ((d.etiqueta === 'file' || d.etiqueta === 'fileRev') && !d.ocultar) {
          result[d.nombre] = { nombre: d.nombre, file: d.File, url: d.url, IdDocumento: d.tipoDocumento };
          // result[d.nombre].push({ nombre: d.name, file: d.valor });
        } else if (d.etiqueta === 'select') {
          result[d.nombre] = d.relacion ? d.valor : d.valor.Id;
        } else {
          result[d.nombre] = d.valor;
        }
        resueltos = d.requerido ? resueltos + 1 : resueltos;
      } else {
        this.data.valid = false;
      }
    });

    this.data.valid = this.data.valid && this.checkConfirmacion();

    if (this.data.valid && (resueltos / requeridos) >= 1) {
      if (this.normalform.modelo) {
        this.data.data[this.normalform.modelo] = result;
      } else {
        this.data.data = result;
      }
    }

    this.data.percentage = (resueltos / requeridos);
    for (const key in this.modeloData) {  // Agrega parametros faltantes del modelo
      if (this.data.data[this.normalform.modelo] !== undefined && !this.data.data[this.normalform.modelo].hasOwnProperty(key)) {
        this.data.data[this.normalform.modelo][key] = this.modeloData[key];
      }
    }

    if (this.normalform) {
      if (this.normalform.nombre) {
        this.data.nombre = this.normalform.nombre;
      }
    }

    this.result.emit(this.data);
    if (this.data.valid)
      this.percentage.emit(this.data.percentage);
    return this.data;
  }

  auxButton(c:any) {
    const result:any = {};
    this.normalform.campos.forEach((d:any) => {
      if (d.etiqueta === 'file') {
        result[d.nombre] = { nombre: d.nombre, file: d.File };
      } else if (d.etiqueta === 'select') {
        result[d.nombre] = d.relacion ? d.valor : d.valor.Id;
      } else {
        result[d.nombre] = d.valor;
      }
    });
    const dataTemp = {
      data: result,
      button: c.nombre,
    }
    if (c.resultado) {
      this.result.emit(dataTemp)
    } else {
      this.resultAux.emit(dataTemp);
    }
  }

  setPercentage(): void {
    let requeridos = 0;
    let resueltos = 0;
    this.normalform.campos.forEach((form_element:any) => {
      if (form_element.requerido && !form_element.ocultar) {
        requeridos = requeridos + 1;
        resueltos = form_element.valor ? resueltos + 1 : resueltos;
      }
    });
    this.percentage.emit(resueltos / requeridos);
  }

  isEqual(obj1:any, obj2:any) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  ngOnDestroy() {
    this.clearForm();
  }
}
