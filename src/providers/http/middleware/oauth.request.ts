import { Injectable } from '@angular/core';
import { HttpMiddleware } from '../http.kernel';
import { HttpRequest } from '../http.request';
import { AuthToken } from '../../auth/auth.token';

@HttpMiddleware() @Injectable()
export class OauthRequest implements HttpMiddleware {

    public constructor(private authToken: AuthToken) {

    }

    handle(request: HttpRequest, next: (request: HttpRequest) => Promise<any>): Promise<any> {
        if (!this.authToken.exists()) {
            request.addHeader('Authorization', this.authToken.getAuthorization());
        }
        return next(request).catch((errorResponse) => {
            if (errorResponse.status == 401) {
                this.authToken.clear();
            }
            throw errorResponse;
        });
    }
}
