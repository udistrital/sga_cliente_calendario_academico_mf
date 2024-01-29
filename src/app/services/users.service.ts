import { BehaviorSubject, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ImplicitAutenticationService } from './implicit_autentication.service';
import { AnyService } from './any.service';

const path = environment.TERCEROS_SERVICE;

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private user$ = new Subject<[object]>();
  private userSubject = new BehaviorSubject(null);
  public tercero$ = this.userSubject.asObservable();
  public user: any;

  constructor(private anyService: AnyService, private autenticationService: ImplicitAutenticationService) {
    if (window.localStorage.getItem('id_token') !== null && window.localStorage.getItem('id_token') !== undefined) {
       const id_token = window.localStorage.getItem('id_token')!.split('.');
      const payload = JSON.parse(atob(id_token[1])); 
    }
  }
      /*
      let DocIdentificacion = null;
      let CorreoUsuario = null;
      let UsuarioWSO2 = null;

      this.autenticationService.getDocument().then(async (document: string) => {
        if (document) {
          DocIdentificacion = document;
        }
        let payload = this.autenticationService.getPayload();
        UsuarioWSO2 = payload.sub? payload.sub : null;
        CorreoUsuario = payload.email ? payload.email : null;

        let foundId: boolean = false;

        if (DocIdentificacion) {
          await this.findByDocument(DocIdentificacion, UsuarioWSO2, CorreoUsuario).then(found => foundId = true).catch(e => foundId = false);
        }

        if (UsuarioWSO2 && !foundId) {
          await this.findByUserEmail(UsuarioWSO2).then(found => foundId = true).catch(e => foundId = false);
        }

        if (CorreoUsuario && !foundId) {
          await this.findByUserEmail(CorreoUsuario).then(found => foundId = true).catch(e => foundId = false);
        }

        if (!foundId) {
          window.localStorage.setItem('persona_id', '0');
        }

      });
    }
  }

  private findByDocument(DocIdentificacion, Usuario, Correo){
    return new Promise<boolean>((resolve, reject) => {
     this.anyService.get(path, 'datos_identificacion?query=Activo:true,Numero:' + DocIdentificacion + '&sortby=FechaCreacion&order=desc')
      .subscribe((res: any[]) => {
        if (res !== null) {
          if (res.length > 1) {
            let tercero = null;
            for (let i = 0; i < res.length; i++) {
              if (res[i].TerceroId.UsuarioWSO2 == Usuario){
                tercero = res[i].TerceroId;
                break;
              }
            }
            if(tercero == null){
              for (let i = 0; i < res.length; i++) {
                if (res[i].TerceroId.UsuarioWSO2 == Correo){
                  tercero = res[i].TerceroId;
                  break;
                }
              } 
            }
            if(tercero != null) {
              this.user = tercero;
            } else {
              this.user = res[0].TerceroId;
            }
          } else {
            this.user = res[0].TerceroId;
          }
          
          this.user['Documento'] = DocIdentificacion;
          if (Object.keys(this.user).length !== 0) {
            this.user$.next(this.user);
            this.userSubject.next(this.user);              // window.localStorage.setItem('ente', res[0].Ente);
            window.localStorage.setItem('persona_id', this.user.Id);
            resolve(true);
          } else {
            //this.user$.next(this.user);
            window.localStorage.setItem('persona_id', '0');
            reject(false);
          }
        } else {
          reject(false);
        }
      });
    });
  }

  private findByUserEmail(UserEmail){
    return new Promise<boolean>((resolve, reject) => {
    this.anyService.get(path, 'tercero?query=UsuarioWSO2:' + UserEmail)
      .subscribe(res => {
        if (res !== null) {
          this.user = res[0];
          if (Object.keys(this.user).length !== 0) {
            this.user$.next(this.user);
            this.userSubject.next(this.user);
            window.localStorage.setItem('persona_id', this.user.Id);
            resolve(true);
          } else {
            //this.user$.next(this.user);
            window.localStorage.setItem('persona_id', '0');
            reject(false);
          }
        }
        else {
          //this.user$.next(this.user);
          window.localStorage.setItem('persona_id', '0');
          reject(false);
        }
      });
    });
  }

  // public getEnte(): number {
  //   return parseInt(window.localStorage.getItem('ente'), 10);
  // }

  public getPrograma(): number {
    return parseInt(window.localStorage.getItem('programa'), 10);
  }

  public getUsuario(): string {
    return window.localStorage.getItem('usuario').toString();
  }*/

  public getPersonaId(): number {
    return parseInt(window.localStorage.getItem('persona_id')!, 10);
  }
/*

  public getPeriodo(): number {
    return parseInt(window.localStorage.getItem('IdPeriodo'), 10)
  }

  public getUser() {
    return this.user$.asObservable();
  }*/
}


