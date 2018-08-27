import { Injectable } from '@angular/core';
import { Auth } from '../auth';
import {
    Router,
    CanActivate,
    CanActivateChild,
    ActivatedRouteSnapshot,
    RouterStateSnapshot
} from '@angular/router';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {

    public lastUrl: string;

    constructor(public router: Router, private auth: Auth) {

    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
        this.lastUrl = state.url;
        return this.checkState(this.auth.check());
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
        return this.canActivate(route, state);
    }

    private checkState(check): boolean | Promise<boolean> {
        if (typeof check === 'boolean') {
            if (check === false) {
                this.router.navigate(['/login']);
            }
            return check;
        } else {
            return check.then((ret) => {
                if (!ret) {
                    this.router.navigate(['/login']);
                }
                return ret;
            }).catch((error) => {
                this.router.navigate(['/login']);
                return false;
            });
        }
    }
}
