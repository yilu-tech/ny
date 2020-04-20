import { Injectable } from '@angular/core';
import { HttpMiddleware } from '../http.kernel';
import { HttpRequest } from '../http.request';
import { CONFIG } from '../../config';

@HttpMiddleware() @Injectable()
export class CompleteUrl implements HttpMiddleware {

    handle(request: HttpRequest, next: (request: HttpRequest) => Promise<any>): Promise<any> {
        let urlInfo = request.getUrlInfo();
        if (!urlInfo.domain) {
            request.setUrl(CONFIG.baseUrl + '/' + urlInfo.path);
        }
        return next(request);
    }
}
