import { Injectable } from '@angular/core';
import { HttpMiddleware } from '../http.kernel';
import { HttpRequest } from '../http.request';
import { CONFIG } from '../../config';

@HttpMiddleware() @Injectable()
export class CompleteUrl implements HttpMiddleware {

    handle(request: HttpRequest, next: (request: HttpRequest) => Promise<any>): Promise<any> {
        const url = request.getUrl();
        if (/^\/?([\w-]+\/?)+(\?(\w+(=.*)?&?)+)?$/.test(url)) {
            request.setUrl(CONFIG.baseUrl + '/' + url.trim());
        }
        return next(request);
    }
}
