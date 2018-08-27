import { NgModule } from '@angular/core';

import { Api } from './api';
import { Auth } from './auth';
import { Cache } from './cache';
import { Events, GlobalEvents } from './events';
import { AuthHandler } from './handlers/auth.handler';
import { AuthGuard } from './handlers/auth.guard';

@NgModule({
    providers: [
        Api,
        Auth,
        Cache,
        AuthHandler,
        AuthGuard,
        {provide: GlobalEvents, useClass: Events}
    ]
})
export class NyProviderModule {

}
