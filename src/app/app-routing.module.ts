import { NgModule } from '@angular/core';
import { RouterModule, Routes, provideRouter } from '@angular/router';
import { EmptyRouteComponent } from './empty-route/empty-route.component';
import { AdministracionCalendarioComponent } from './component/administracion-calendario/administracion-calendario.component';
import { APP_BASE_HREF } from '@angular/common';
import { getSingleSpaExtraProviders } from 'single-spa-angular';
import { provideHttpClient, withFetch } from '@angular/common/http';

 const routes: Routes = [
  /*{
    path: 'list-calendario-academico',
    component: ListCalendarioAcademicoComponent,
    //canActivate: [AuthGuard],
},*/
{
  path: 'administracion-calendario',
  component: AdministracionCalendarioComponent,
  //canActivate: [AuthGuard],
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
