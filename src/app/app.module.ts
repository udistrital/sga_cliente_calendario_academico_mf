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
import { EventoService } from './services/evento.service';
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
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import {MatNativeDateModule} from '@angular/material/core';
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
import { SgaAdmisionesMidService } from './services/sga_admisiones_mid.service';
import { SpinnerUtilInterceptor, SpinnerUtilModule } from 'spinner-util';
import { environment } from 'src/environments/environment';
import { FullCalendarModule } from '@fullcalendar/angular';
import {MatDividerModule} from '@angular/material/divider';
import {MatButtonModule} from '@angular/material/button';


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



    
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    MatNativeDateModule,
    MatDialogModule,
    MatInputModule,
    MatProgressSpinnerModule,
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
    SgaAdmisionesMidService,
    MatSnackBar,
    HttpErrorManager,
    DocumentoService,
    RequestManager,
    ParametrosService,
    EventoService,
    PopUpManager,
    { provide: HTTP_INTERCEPTORS, useClass: SpinnerUtilInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
