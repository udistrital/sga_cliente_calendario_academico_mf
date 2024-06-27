import { NgModule } from '@angular/core';
import { RouterModule, Routes, provideRouter } from '@angular/router';
import { AdministracionCalendarioComponent } from './component/administracion-calendario/administracion-calendario.component';
import { APP_BASE_HREF } from '@angular/common';
import { getSingleSpaExtraProviders } from 'single-spa-angular';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { ListCalendarioAcademicoComponent } from './component/list-calendario-academico/list-calendario-academico.component';
import { CalendarioProyectoComponent } from './component/calendario-proyecto/calendario-proyecto.component';

 const routes: Routes = [
  {
    path: 'lista',
    component: ListCalendarioAcademicoComponent,
},
{
  path: 'administracion',
  component: AdministracionCalendarioComponent,
},
{
  path: 'buscar-por-proyecto',
  component: CalendarioProyectoComponent,
}
 
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [ 
    provideRouter(routes),
    { provide: APP_BASE_HREF, useValue: '/calendario-academico/' },
    getSingleSpaExtraProviders(),
    provideHttpClient(withFetch()) ]
})
export class AppRoutingModule { }
