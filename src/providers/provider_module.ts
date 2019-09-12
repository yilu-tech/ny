import { NgModule } from '@angular/core';

import { Http, HttpKernel, CompleteUrl, OauthRequest } from './http';
import { Auth, AuthToken, AuthGuard } from './auth';
import { Cache } from './cache';
import { Events, GlobalEvents } from './events';

@NgModule({
    providers: [
        Http,
        HttpKernel,
        Auth,
        Cache,
        AuthToken,
        AuthGuard,

        CompleteUrl,
        OauthRequest,

        {provide: GlobalEvents, useClass: Events}
    ]
})
export class NyProviderModule {

}
