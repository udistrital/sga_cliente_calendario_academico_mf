import { BehaviorSubject, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { RequestManager } from '../managers/requestManager'; 
import { decrypt } from 'src/utils/util-encrypt'; 

const path = environment.TERCEROS_SERVICE;

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private user$ = new BehaviorSubject(null);

  constructor(private requestManager: RequestManager) {
    this.getUserInfo();
  }

  private getUserInfo() {
    const userLocalStorageEncode = window.localStorage.getItem('user');
    const userLocalStorage = userLocalStorageEncode
      ? JSON.parse(atob(userLocalStorageEncode))
      : null;
    this.user$.next(userLocalStorage);
  }

  public getId() {
    return localStorage.getItem(decrypt('persona_id'));
  }

  public async getPersonaId(): Promise<number | null> {
    return new Promise((resolve, reject) => {
      const personaId = window.localStorage.getItem('persona_id');
      if (personaId === null) {
        resolve(null);
      } else {
        try {
          resolve(decrypt(personaId));
        } catch (error) {
          reject(error);
        }
      }
    });
  }

  public getUser() {
    return this.user$.asObservable();
  }

  public getPayload(): any {
    var payload: any = {};
    const idToken = window.localStorage.getItem('id_token')?.split('.');
    if (idToken != undefined) {
      payload = JSON.parse(atob(idToken[1]));
    }
    return payload;
  }

  public esAutorizado(requiredRoles: string[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getUser().subscribe(
        (user: any) => {
          if (user && user.user && user['user'].role) {
            const roles = [
              ...new Set([...user['user'].role]),
              ...user['userService'].role,
            ];
            const isAuthorized = requiredRoles.some((role) =>
              roles.includes(role)
            );
            resolve(isAuthorized);
          } else {
            resolve(false);
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  public getEmail(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.getUser().subscribe(
        ({ user }: any) => {
          if (user && user.email) {
            resolve(user['email']);
          } else {
            resolve('');
          }
        },
        (error) => {
          console.error('Error al obtener el usuario', error);
          reject(error);
        }
      );
    });
  }

  public getPrograma(): number {
    return parseInt(window.localStorage.getItem('programa')!, 10);
  }

  public getPeriodo(): number {
    return parseInt(window.localStorage.getItem('IdPeriodo')!, 10);
  }
}
