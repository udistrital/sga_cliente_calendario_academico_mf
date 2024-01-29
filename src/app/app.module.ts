import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NbCardModule, NbThemeModule, NbSpinnerModule, NbToastrModule,   } from '@nebular/theme';
import { AdministracionCalendarioComponent } from './component/administracion-calendario/administracion-calendario.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MatDialogModule } from '@angular/material/dialog';
import { ParametrosService } from './services/parametros.service';
import { RequestManager } from './managers/requestManager';
import { HttpErrorManager } from './managers/errorManager';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SgaMidService } from './services/sga_mid.service';
import { EventoService } from './services/evento.service';
import { MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatTabsModule} from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
import { LocalDataSource } from 'ng2-smart-table';
import { PopUpManager } from './managers/popUpManager';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from 'src/environments/environment';
import { FormsModule } from '@angular/forms';




@NgModule({
  declarations: [
    AppComponent,
    AdministracionCalendarioComponent,
  ],
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    BrowserAnimationsModule,
    MatExpansionModule,
    NbCardModule,
    NbSpinnerModule,
    NbToastrModule.forRoot(),
    NbThemeModule.forRoot(),
    HttpClientModule,
    TranslateModule.forRoot({
      loader:{
        provide:TranslateLoader,
        useFactory: (createTranslateLoader),
        deps:[HttpClient]
      }
    })
  ],
  providers: [
    MatSnackBar,
    HttpErrorManager,
    RequestManager,
    ParametrosService,
    SgaMidService,
    EventoService,
    LocalDataSource,
    PopUpManager,
   
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, 'http://localhost:4203/assets/i18n/', '.json');
}
 