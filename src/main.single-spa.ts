import { enableProdMode, NgZone, provideZoneChangeDetection } from '@angular/core';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Router, NavigationStart } from '@angular/router';

import { singleSpaAngular, provideSingleSpaPlatform } from 'single-spa-angular';



import { environment } from './environments/environment';
import { singleSpaPropsSubject } from './single-spa/single-spa-props';
import { AppModule } from './app/app.module';

if (environment.production) {
  enableProdMode();
}

const lifecycles = singleSpaAngular({
  bootstrapFunction: singleSpaProps => {
    singleSpaPropsSubject.next(singleSpaProps);
    return platformBrowserDynamic(provideSingleSpaPlatform()).bootstrapModule(AppModule, { applicationProviders: [provideZoneChangeDetection()], });
  },
  template: '<sga-calendarioacademico-mf/>',
  Router,
  NavigationStart,
  NgZone,
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
