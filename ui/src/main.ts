import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import {
  IPublicClientApplication,
  PublicClientApplication
} from '@azure/msal-browser';
import { MSAL_INSTANCE, MsalService } from '@azure/msal-angular';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { environment } from './environments/environment';

function msalInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.auth.clientId,
      authority: environment.auth.authority,
      redirectUri: environment.auth.redirectUri,
      postLogoutRedirectUri: environment.auth.postLogoutRedirectUri
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false
    }
  });
}

function msalInitializeFactory(instance: IPublicClientApplication): () => Promise<void> {
  return () => instance.initialize();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(appRoutes),
    provideIonicAngular(),
    { provide: MSAL_INSTANCE, useFactory: msalInstanceFactory },
    {
      provide: APP_INITIALIZER,
      useFactory: msalInitializeFactory,
      deps: [MSAL_INSTANCE],
      multi: true
    },
    MsalService
  ]
}).catch((error: unknown) => {
  console.error('Failed to bootstrap Fabric IQ UI', error);
});
