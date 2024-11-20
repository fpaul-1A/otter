import { ApiFetchClient } from '@ama-sdk/client-fetch';
import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { PetApi } from '../../../../libs/sdk/src/api';
import { additionalModules } from '../environments/environment';
import { routes } from './app.routes';

function petApiFactory() {
  /* Create an ApiFetchClient and return a PetApi object */
  const apiFetchClient = new ApiFetchClient(
    {
      basePath: 'https://petstore3.swagger.io/api/v3',
      requestPlugins: [],
      fetchPlugins: []
    }
  );
  return new PetApi(apiFetchClient);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(additionalModules),
    importProvidersFrom(BrowserAnimationsModule),
    {provide: PetApi, useFactory: petApiFactory}
  ]
};
