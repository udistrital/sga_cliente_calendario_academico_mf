import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AdministracionCalendarioComponent } from './component/administracion-calendario/administracion-calendario.component';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MatDialogModule } from '@angular/material/dialog';
import { ParametrosService } from './services/parametros.service';
import { RequestManager } from './managers/requestManager';
import { HttpErrorManager } from './managers/errorManager';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatTabsModule} from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
import { PopUpManager } from './managers/popUpManager';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { EdicionActividadesProgramasComponent } from './component/edicion-actividades-programas/edicion-actividades-programas.component';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { ReactiveFormsModule } from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import {MatNativeDateModule, MAT_DATE_LOCALE} from '@angular/material/core';
import { ListCalendarioAcademicoComponent } from './component/list-calendario-academico/list-calendario-academico.component';
import { AsignarCalendarioProyectoComponent } from './component/asignar-calendario-proyecto/asignar-calendario-proyecto.component';
import { DefCalendarioAcademicoComponent } from './component/def-calendario-academico/def-calendario-academico.component';
import { ActividadCalendarioAcademicoComponent } from './component/actividad-calendario-academico/actividad-calendario-academico.component';
import { ProcesoCalendarioAcademicoComponent } from './component/proceso-calendario-academico/proceso-calendario-academico.component';
import { CrudPeriodoComponent } from './component/crud-periodo/crud-periodo.component';
import { DinamicformComponent } from './component/dinamicform/dinamicform.component';
import { DialogPreviewFileComponent } from './component/dialog-preview-file/dialog-preview-file.component';
import { DocumentoService } from './services/documento.service';
import { DetalleCalendarioComponent } from './component/detalle-calendario/detalle-calendario.component';
import { CalendarioProyectoComponent } from './component/calendario-proyecto/calendario-proyecto.component';
import { SgaCalendarioMidService } from './services/sga_calendario_mid.service';
import { EventoService } from './services/evento.service';
import { SgaAdmisionesMidService } from './services/sga_admisiones_mid.service';
import { SpinnerUtilModule } from 'spinner-util';
import { environment } from 'src/environments/environment';
import { FullCalendarModule } from '@fullcalendar/angular';
import {MatDividerModule} from '@angular/material/divider';
import {MatButtonModule} from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu'
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { CustomPaginatorIntl } from './services/CustomPaginatorIntl.service';
import { AdministracionPermisosEventosComponent } from './component/administracion_permisos_eventos/administracion_permisos_eventos.component';
import { SpinnerUtilCounterInterceptor } from './interceptors/spinner-util-counter.interceptor';
import { GestionMasivaActividadesProgramasComponent } from './component/gestion-masiva-actividades-programas/gestion-masiva-actividades-programas.component';
import { GestionExtensionesActividadComponent } from './component/gestion-extensiones-actividad/gestion-extensiones-actividad.component';


export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, environment.apiUrl + 'assets/i18n/', '.json');
}
 

@NgModule({
  declarations: [
    
    AppComponent,
    DinamicformComponent,
    CrudPeriodoComponent,
    DialogPreviewFileComponent,
    DetalleCalendarioComponent,
    CalendarioProyectoComponent,
    DefCalendarioAcademicoComponent,
    ListCalendarioAcademicoComponent,
    AdministracionCalendarioComponent,
    AsignarCalendarioProyectoComponent,
    ProcesoCalendarioAcademicoComponent,
    EdicionActividadesProgramasComponent,
    ActividadCalendarioAcademicoComponent,
    AdministracionPermisosEventosComponent,
    GestionMasivaActividadesProgramasComponent,
    GestionExtensionesActividadComponent,



    
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    MatNativeDateModule,
    MatDialogModule,
    MatInputModule,
    MatCardModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatTableModule,
    MatDatepickerModule,
    MatTabsModule,
    MatPaginatorModule,
    BrowserAnimationsModule,
    MatExpansionModule,
    MatIconModule,
    HttpClientModule,
    SpinnerUtilModule,
    FullCalendarModule,
    MatDividerModule,
    MatButtonModule,
    MatToolbarModule,
    MatTooltipModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatListModule,
    TranslateModule.forRoot({
      loader:{
        provide:TranslateLoader,
        useFactory: (createTranslateLoader),
        deps:[HttpClient]
      }
    })
  ],
  providers: [
    SgaCalendarioMidService,
    EventoService,
    SgaAdmisionesMidService,
    MatSnackBar,
    HttpErrorManager,
    DocumentoService,
    RequestManager,
    ParametrosService,
    PopUpManager,
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    { provide: HTTP_INTERCEPTORS, useClass: SpinnerUtilCounterInterceptor, multi: true },
    { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
