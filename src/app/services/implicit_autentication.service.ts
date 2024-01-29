
import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
//import { Md5 } from 'ts-md5';
import { BehaviorSubject, of } from 'rxjs';
import Swal from 'sweetalert2';
import { delay, retry } from 'rxjs/operators';
import { HostListener } from '@angular/core';
import { environment } from '../../environments/environment';
@Injectable({
    providedIn: 'root',
})

export class ImplicitAutenticationService {
    getDocument() {
      throw new Error('Method not implemented.');
    }
    environment = environment.TOKEN;
    logoutUrl: any;
    params: any;
    payload: any;
    timeActiveAlert: number = 4000;
    isLogin = false;
    private user: any;
    private timeLogoutBefore = 1000; // logout before in miliseconds
    private timeAlert = 300000; // alert in miliseconds 5 minutes

    private userSubject = new BehaviorSubject({});
    public user$ = this.userSubject.asObservable();

    private menuSubject = new BehaviorSubject({});
    public menu$ = this.menuSubject.asObservable();

    private logoutSubject = new BehaviorSubject('');
    public logout$ = this.logoutSubject.asObservable();
/*
    httpOptions!: { headers: HttpHeaders; };
    constructor(private httpClient: HttpClient) {
        this.init(this.environment);
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === 'visible') {
                const expires = this.setExpiresAt();
                this.autologout(expires);
            }
        });
    }
    init(entorno:any): any {
        this.environment = entorno;
        const id_token = window.localStorage.getItem('id_token');

        if (window.localStorage.getItem('id_token') === null) {
            var params = {}, queryString = location.hash.substring(1), regex = /([^&=]+)=([^&]*)/g;
            let m;
            while (m = regex.exec(queryString)) {
                params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
            }
            // And send the token over to the server
            const req = new XMLHttpRequest();
            // consider using POST so query isn't logged
            const query = 'https://' + window.location.host + '?' + queryString;
            req.open('GET', query, true);
            if (!!params['id_token']) {
                //if token setear
                const id_token_array = (params['id_token']).split('.');
                const payload = JSON.parse(atob(id_token_array[1]));
                window.localStorage.setItem('access_token', params['access_token']);
                window.localStorage.setItem('expires_in', params['expires_in']);
                window.localStorage.setItem('state', params['state']);
                window.localStorage.setItem('id_token', params['id_token']);
                // this.userSubject.next({ user: payload });
                this.httpOptions = {
                    headers: new HttpHeaders({
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${params['access_token']}`,
                    }),
                };
                this.updateAuth(payload);
            } else {
                this.clearStorage();
            }
            req.onreadystatechange = function (e) {
                if (req.readyState === 4) {
                    if (req.status === 200) {
                        // window.location = params.state;
                    } else if (req.status === 400) {
                        window.alert('There was an error processing the token.');
                    } else {

                    }
                }
            };
        } else {
            const id_token = window.localStorage.getItem('id_token').split('.');
            const payload = JSON.parse(atob(id_token[1]));
            this.updateAuth(payload);
        }
        const expires = this.setExpiresAt();
        this.autologout(expires);
        this.clearUrl();
    }


    updateAuth(payload) {
        const user = localStorage.getItem('user');
        if (user) {
            this.userSubject.next(JSON.parse(atob(user)));
        } else {
            this.httpOptions = {
                headers: new HttpHeaders({
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                }),
            };
            const userTemp = payload.email;
            this.user = { user: userTemp };
            this.httpClient.post<any>(this.environment.AUTENTICACION_MID, {
                user: (payload.email)
            }, this.httpOptions)
                .pipe(retry(3))
                .subscribe((res: any) => {
                    this.clearUrl();
                    localStorage.setItem('user', btoa(JSON.stringify({ ...{ user: payload }, ...{ userService: res } })));
                    this.userSubject.next({ ...{ user: payload }, ...{ userService: res } });
                }, (error) => (console.log(error))
                );
            this.httpOptions = {
                headers: new HttpHeaders({
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                }),
            };
        }
    }

    public logout(action): void {
        const state = localStorage.getItem('state');
        const idToken = localStorage.getItem('id_token');
        if (!!state && !!idToken) {
            this.logoutUrl = this.environment.SIGN_OUT_URL;
            this.logoutUrl += '?id_token_hint=' + idToken;
            this.logoutUrl += '&post_logout_redirect_uri=' + this.environment.SIGN_OUT_REDIRECT_URL;
            this.logoutUrl += '&state=' + state;
            this.clearStorage();
            this.logoutSubject.next(action);
            window.location.replace(this.logoutUrl);
        }
    }

    public getPayload(): any {
        const idToken = window.localStorage.getItem('id_token').split('.');
        const payload = JSON.parse(atob(idToken[1]));
        return payload;
    }
*/
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
    }/*

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

    public logoutValid() {
        var state;
        var valid = true;
        var queryString = location.search.substring(1);
        var regex = /([^&=]+)=([^&]*)/g;
        var m;
        while (!!(m = regex.exec(queryString))) {
            state = decodeURIComponent(m[2]);
        }
        if (window.localStorage.getItem('state') === state) {
            this.clearStorage();
            valid = true;
        } else {
            valid = false;
        }
        return valid;
    }

    // el flag es un booleano que define si habrá boton de login
    public login(flag): boolean {
        if (window.localStorage.getItem('id_token') === 'undefined' ||
            window.localStorage.getItem('id_token') === null || this.logoutValid()) {
            if (!flag) {
                this.getAuthorizationUrl();
            }
            return false;
        } else {
            return true;
        }
    }

    public clearUrl() {
        const clean_uri = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, clean_uri);
    }

    public getAuthorizationUrl() {
        this.params = this.environment;
        if (!this.params.hasOwnProperty('nonce')) {
            const nonceData = this.generateState();
            this.params = { ...this.params, ...{ nonce: nonceData } };
        }
        if (!this.params.state) {
            this.params.state = this.generateState();
        }
        let url = this.params.AUTORIZATION_URL + '?' +
            'client_id=' + encodeURIComponent(this.params.CLIENTE_ID) + '&' +
            'redirect_uri=' + encodeURIComponent(this.params.REDIRECT_URL) + '&' + // + window.location.href + '&' para redirect con regex
            'response_type=' + encodeURIComponent(this.params.RESPONSE_TYPE) + '&' +
            'scope=' + encodeURIComponent(this.params.SCOPE) + '&' +
            'state_url=' + encodeURIComponent(window.location.hash);
        if (this.params.hasOwnProperty('nonce')) {
            url += '&nonce=' + encodeURIComponent(this.params.nonce);
        }
        url += '&state=' + encodeURIComponent(this.params.state);
        window.location.replace(url);
        return url;
    }

    public generateState(): any {
        const text = ((Date.now() + Math.random()) * Math.random()).toString().replace('.', '');
        return Md5.hashStr(text);
    }

    public setExpiresAt(): any {
        const expiresAt = localStorage.getItem('expires_at');
        if (!expiresAt || expiresAt === 'Invalid Date') {
            const expiresAtDate = new Date();
            expiresAtDate.setSeconds(expiresAtDate.getSeconds() + parseInt(window.localStorage.getItem('expires_in'), 10));
            window.localStorage.setItem('expires_at', new Date(expiresAtDate).toUTCString());
            return new Date(expiresAtDate);
        } else {
            return expiresAt === 'Invalid Date' ? false : new Date(expiresAt);
        }
    }

    autologout(expires): void {
        if (expires) {
            this.isLogin = true;
            const expiresIn = ((new Date(expires)).getTime() - (new Date()).getTime());
            if (expiresIn < this.timeLogoutBefore) {
                this.clearStorage();
                this.logoutSubject.next('logout-auto-only-localstorage');
                location.reload();
            } else {
                const timerDelay = expiresIn > this.timeLogoutBefore ? expiresIn - this.timeLogoutBefore : this.timeLogoutBefore;
                if (!isNaN(expiresIn)) {
                    console.log(`%cFecha expiración: %c${new Date(expires)}`, 'color: blue', 'color: green');
                    of(null).pipe(delay(timerDelay - this.timeLogoutBefore)).subscribe((data) => {
                        this.logout('logout-auto');
                    });
                    if (this.timeAlert < timerDelay) {
                        of(null).pipe(delay(timerDelay - this.timeAlert)).subscribe((data) => {
                            Swal.fire({
                                position: 'top-end',
                                icon: 'info',
                                title: `Su sesión se cerrará en ${this.timeAlert / 60000} minutos`,
                                showConfirmButton: false,
                                timer: this.timeActiveAlert
                            });
                        });
                    }
                }
            }
        }
    }
    public expired() {
        return (new Date(window.localStorage.getItem('expires_at')) < new Date());
    }

    public live() {
        return this.isLogin;
    }

    public clearStorage() {
        this.isLogin = false;
        window.localStorage.clear();
        window.sessionStorage.clear();
    }
}*/
}