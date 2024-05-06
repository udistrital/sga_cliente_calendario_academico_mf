 
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
 
 
@Injectable({
    providedIn: 'root',
})
 
export class ImplicitAutenticationService {
    logoutUrl: any;
    params: any;
    payload: any;
    timeActiveAlert: number = 4000;
    isLogin = false;
 
    private userSubject = new BehaviorSubject({});
    public user$ = this.userSubject.asObservable();
 
    private menuSubject = new BehaviorSubject({});
    public menu$ = this.menuSubject.asObservable();
 
    private logoutSubject = new BehaviorSubject('');
    public logout$ = this.logoutSubject.asObservable();
 
    constructor(){
        const user:any = localStorage.getItem('user');
        this.userSubject.next(JSON.parse(atob(user)));
    }
 
    public getPayload(): any {
        const idToken = window.localStorage.getItem('id_token')?.split('.');
        const payload = idToken!=undefined?JSON.parse(atob(idToken[1])):null;
        return payload;
    }
 
    public getRole() {
        const rolePromise = new Promise((resolve, reject) => {
            this.user$.subscribe((data: any) => {
                const { user, userService } = data;
                const roleUser = typeof user.role !== 'undefined' ? user.role : [];
                const roleUserService = typeof userService.role !== 'undefined' ? userService.role : [];
                const roles = (roleUser.concat(roleUserService)).filter((data: any) => (data.indexOf('/') === -1));
                resolve(roles);
            });
        });
        return rolePromise;
    }
 
    public getMail() {
        const rolePromise = new Promise((resolve, reject) => {
            this.user$.subscribe((data: any) => {
                const { userService } = data;
                resolve(userService.email);
            });
        });
        return rolePromise;
    }
 
    public getDocument() {
        const rolePromise = new Promise((resolve, reject) => {
            this.user$.subscribe((data: any) => {
                const { userService } = data;
                resolve(userService.documento);
            });
        });
        return rolePromise;
    }
}