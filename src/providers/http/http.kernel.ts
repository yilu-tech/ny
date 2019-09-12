import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpRequest } from './http.request';


@Injectable()
export class HttpKernel {

    private static MIDDLEWARE: Array<any> = [];

    public constructor(public httpClient: HttpClient, private injector: Injector) {
    }

    public static registerMiddleware(handler: HttpMiddleware | ((request: HttpRequest, next: (request: HttpRequest) => Promise<any>) => Promise<any>)) {
        HttpKernel.MIDDLEWARE.push(handler);
    }

    public next(request: HttpRequest, middleware?: any[]) {
        middleware = HttpKernel.MIDDLEWARE.concat(middleware || []);
        let index = 0;
        let next = (request) => {
            if (index < middleware.length) {
                return this.call(middleware[index++], request, next);
            }
            return this.send(request);
        };
        return next(request);
    }

    private call(handler: any, request: HttpRequest, next: (request: HttpRequest) => Promise<any>) {
        if (Object.getPrototypeOf(handler) === Function.prototype) {
            if (typeof handler.prototype.handle === 'function') {
                return this.injector.get(handler).handle(request, next);
            } else {
                return handler(request, next);
            }
        }
        return Promise.reject(new Error('http middleware defined error.'));
    }

    private send(request: HttpRequest) {
        return this.httpClient.request(request.getMethod(), request.getUrl(), request.getOptions()).toPromise();
    }
}

export interface HttpMiddleware {
    handle(request: HttpRequest, next: (request: HttpRequest) => Promise<any>): Promise<any>
}

export function HttpMiddleware() {
    return function (target: any) {
        HttpKernel.registerMiddleware(target);
    };
}
