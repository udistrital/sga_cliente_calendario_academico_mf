// import * as Nuxeo from 'nuxeo';
// import { Injectable } from '@angular/core';
// import { environment } from 'src/environments/environment';
// import { Observable, Subject } from 'rxjs';
// import { Documento } from '../models/documento/documento';
// import { TipoDocumento } from '../models/documento/tipo_documento';
// import { DocumentoService } from './documento.service';
// import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


// @Injectable({
//     providedIn: 'root',
// })
// export class NuxeoService {
//     static nuxeo: Nuxeo;

//     private nuxeo2 = Nuxeo;

//     private documentos$ = new Subject<Documento[]>();
//     private documentos: object;

//     private blobDocument$ = new Subject<[object]>();
//     private blobDocument: object;

//     private updateDoc$ = new Subject<[object]>();
//     private updateDoc: object

//     constructor(
//         private documentService: DocumentoService,
//         private sanitization: DomSanitizer,
//     ) {
//         this.documentos = {};
//         this.blobDocument = {};
//         this.updateDoc = {};
//         // console.info(this.blobDocument);
//         // console.info(this.updateDoc);

//         NuxeoService.nuxeo = new Nuxeo({
//             baseURL: environment.NUXEO.PATH,
//             auth: {
//                 method: 'basic',
//                 username: environment.NUXEO.CREDENTIALS.USERNAME,
//                 password: environment.NUXEO.CREDENTIALS.PASS,
//             },
//         });

//         this.nuxeo2 = new Nuxeo({
//             baseURL: environment.NUXEO.PATH,
//             auth: {
//                 method: 'basic',
//                 username: environment.NUXEO.CREDENTIALS.USERNAME,
//                 password: environment.NUXEO.CREDENTIALS.PASS,
//             },
//         });
//     }

//     public getDocumentos$(file:any, documentoService:any): Observable<Documento[]> {
//         this.saveFiles(file, documentoService, this);
//         return this.documentos$.asObservable();
//     }

//     public getDocumentoById$(Id:any, documentoService:any): Observable<object[]> {
//         this.getFile(Id, documentoService, this);
//         return this.blobDocument$.asObservable();
//     }

//     public updateDocument$(files:any, documentoService:any): Observable<object[]> {
//         this.updateFile(files, documentoService, this);
//         return this.updateDoc$.asObservable();
//     }

//     saveFiles(files:any, documentoService:any, nuxeoservice:any) {
//         this.documentos = {};
//         nuxeoservice.documentos = {};
//         NuxeoService.nuxeo.connect()
//             .then(function (client:any) {
//                 files.forEach((file:any) => {
//                     documentoService.get('tipo_documento/' + file.IdDocumento)
//                         .subscribe((res:any) => {
//                             if (res !== null) {
//                                 const tipoDocumento = <TipoDocumento>res;
//                                 NuxeoService.nuxeo.operation('Document.Create')
//                                     .params({
//                                         type: tipoDocumento.TipoDocumentoNuxeo,
//                                         name: file.nombre,
//                                         properties: 'dc:title=' + file.nombre,
//                                     })
//                                     .input(tipoDocumento.Workspace)
//                                     .execute()
//                                     .then(function (doc:any) {
//                                         const nuxeoBlob = new Nuxeo.Blob({ content: file.file });
//                                         NuxeoService.nuxeo.batchUpload()
//                                             .upload(nuxeoBlob)
//                                             .then(function (response:any) {
//                                                 file.uid = doc.uid
//                                                 NuxeoService.nuxeo.operation('Blob.AttachOnDocument')
//                                                     .param('document', doc.uid)
//                                                     .input(response.blob)
//                                                     .execute()
//                                                     .then(function (respuesta:any) {
//                                                         const documentoPost = new Documento;
//                                                         documentoPost.Enlace = file.uid;
//                                                         documentoPost.Nombre = file.nombre;
//                                                         documentoPost.TipoDocumento = tipoDocumento;
//                                                         documentoPost.Activo = true;
//                                                         documentoPost.Metadatos = file.Metadatos;
//                                                         documentoService.post('documento', documentoPost)
//                                                             .subscribe((resuestaPost:any) => {
//                                                                 nuxeoservice.documentos[file.key] = resuestaPost;
//                                                                 // nuxeoservice.documentos[file.key] = resuestaPost.Body;
//                                                                 nuxeoservice.documentos$.next(nuxeoservice.documentos);
//                                                             })

//                                                     });
//                                             })
//                                             .catch(function (error:any) {
//                                                 console.error(error);
//                                                 return error;
//                                             });
//                                     })
//                                     .catch(function (error:any) {
//                                         console.error(error);
//                                         return error;
//                                     })
//                             }
//                         });
//                 });
//             });
//     }

//     updateFile(files:any, documentoService:any, nuxeoservice:any) {
//         this.updateDoc = {};
//         nuxeoservice.updateDoc = {};
//         files.forEach((file:any) => {
//             if (file.file !== undefined) {
//                 const nuxeoBlob = new Nuxeo.Blob({ content: file.file });
//                 documentoService.get('documento?query=Id:' + file.documento)
//                     .subscribe((res:any) => {
//                         if (res !== null) {
//                             const documento_temp = <any>res[0];
//                             NuxeoService.nuxeo.connect()
//                             NuxeoService.nuxeo.batchUpload()
//                                 .upload(nuxeoBlob)
//                                 .then(function (response:any) {
//                                     NuxeoService.nuxeo.operation('Blob.AttachOnDocument')
//                                         .params({
//                                             type: documento_temp.TipoDocumento.TipoDocumentoNuxeo,
//                                             name: documento_temp.Nombre,
//                                             properties: 'dc:title=' + file.nombre,
//                                         })
//                                         .param('document', documento_temp.Enlace)
//                                         .input(response.blob)
//                                         .execute()
//                                         .then(function (respuesta:any) {
//                                             respuesta.blob()
//                                                 .then(function (responseblob:any) {
//                                                     const url = URL.createObjectURL(responseblob);
//                                                     const response_update = {
//                                                         documento: documento_temp,
//                                                         url: url,
//                                                     };
//                                                     nuxeoservice.updateDoc[file.key] = response_update;
//                                                     nuxeoservice.updateDoc$.next(nuxeoservice.updateDoc);
//                                                 });
//                                         });
//                                 });
//                         }
//                     });
//             }
//         });
//     };

//     getFile(files:any, documentoService:any, nuxeoservice:any) {
//         this.blobDocument = {};
//         nuxeoservice.blobDocument = {};
//         files.forEach((file:any) => {
//             documentoService.get('documento/' + file.Id)
//                 .subscribe((res:any) => {
//                     if (res !== null) {
//                         if (res.Enlace != null) {
//                             NuxeoService.nuxeo.header('X-NXDocumentProperties', '*');
//                             NuxeoService.nuxeo.request('/id/' + res.Enlace)
//                                 .get()
//                                 .then(function (response:any) {
//                                     response.fetchBlob()
//                                         .then(function (blob:any) {
//                                             blob.blob()
//                                                 .then(function (responseblob:any) {
//                                                     const url = URL.createObjectURL(responseblob)
//                                                     nuxeoservice.blobDocument[file.key] = url;
//                                                     nuxeoservice.blobDocument$.next(nuxeoservice.blobDocument);
//                                                 });
//                                         })
//                                         .catch(function (response2:any) {
//                                         });
//                                 })
//                                 .catch(function (response:any) {
//                                 });
//                         }
//                     }
//                 });
//         });
//     }

//     getFilesNew(files:any) {
//         const documentsSubject = new Subject<Documento[]>();
//         const documents$ = documentsSubject.asObservable();

//         const filesData :any = [];

//         files.forEach((file:any, index:any) => {
//             this.documentService.get('documento/' + file.Id)
//                 .subscribe((res:any) => {
//                     if (res !== null) {
//                         if (res.Enlace != null) {
//                             this.nuxeo2.header('X-NXDocumentProperties', '*');
//                             this.nuxeo2.request('/id/' + res.Enlace)
//                                 .get()
//                                 .then((response:any) => {
//                                     response.fetchBlob()
//                                         .then((blob:any) => {
//                                             blob.blob()
//                                                 .then((responseblob:any) => {
//                                                     const url = URL.createObjectURL(responseblob)
//                                                     const objectNext = {
//                                                         ...res,
//                                                         ...{ documentId: res.Id },
//                                                         ...{ key: file.key },
//                                                         ...{ urlUnsafe: url },
//                                                         ...{ safeUrl: this.sanitization.bypassSecurityTrustUrl(url) },
//                                                         ...{ Documento: this.sanitization.bypassSecurityTrustUrl(url) }
//                                                     }
//                                                     filesData.push(objectNext);
//                                                     if ((index + 1) === files.length) {
//                                                         documentsSubject.next(filesData);
//                                                     }
//                                                 });
//                                         })
//                                         .catch(function (response2:any) {
//                                         });
//                                 })
//                                 .catch(function (response:any) {
//                                 });
//                         }
//                     }
//                 });
//         });
//         return documents$;
//     }

//     getDocByInfo(info:any) {
//         const documentsSubject = new Subject<Documento[]>();
//         const documents$ = documentsSubject.asObservable();
//         if (info.Enlace != null) {
//             this.nuxeo2.header('X-NXDocumentProperties', '*');
//             this.nuxeo2.request('/id/' + info.Enlace)
//                 .get()
//                 .then((response:any) => {
//                     response.fetchBlob()
//                         .then((blob:any) => {
//                             blob.blob()
//                                 .then((responseblob:any) => {
//                                     const url = URL.createObjectURL(responseblob)
//                                     const objectNext = {
//                                         ...info,
//                                         ...{ documentId: info.Id },
//                                         ...{ key: info.key },
//                                         ...{ urlUnsafe: url },
//                                         ...{ safeUrl: this.sanitization.bypassSecurityTrustUrl(url) },
//                                         ...{ Documento: this.sanitization.bypassSecurityTrustUrl(url) }
//                                     }
//                                     documentsSubject.next(objectNext);
//                                 });
//                         })
//                         .catch(function (response2:any) {
//                         });
//                 })
//                 .catch(function (response:any) {
//                 });
//         }
//         return documents$;
//     }

//     saveFilesNew(files:any) {
//         const documentsSubject = new Subject<Documento[]>();
//         const documents$ = documentsSubject.asObservable();

//         const documentos: any = [];
//         this.nuxeo2.connect()
//             .then((client:any) => {
//                 files.forEach((file:any, index:any) => {
//                     this.documentService.get('tipo_documento/' + file.IdDocumento)
//                         .subscribe((res:any) => {
//                             if (res !== null) {
//                                 const tipoDocumento = <TipoDocumento>res;
//                                 this.nuxeo2.operation('Document.Create')
//                                     .params({
//                                         type: tipoDocumento.TipoDocumentoNuxeo,
//                                         name: file.nombre,
//                                         properties: 'dc:title=' + file.nombre,
//                                     })
//                                     .input(tipoDocumento.Workspace)
//                                     .execute()
//                                     .then((doc:any) => {
//                                         const nuxeoBlob = new Nuxeo.Blob({ content: file.file });
//                                         this.nuxeo2.batchUpload()
//                                             .upload(nuxeoBlob)
//                                             .then((response:any) => {
//                                                 file.uid = doc.uid
//                                                 this.nuxeo2.operation('Blob.AttachOnDocument')
//                                                     .param('document', doc.uid)
//                                                     .input(response.blob)
//                                                     .execute()
//                                                     .then((respuesta:any) => {
//                                                         const documentoPost = new Documento;
//                                                         documentoPost.Enlace = file.uid;
//                                                         documentoPost.Nombre = file.nombre;
//                                                         documentoPost.TipoDocumento = tipoDocumento;
//                                                         documentoPost.Activo = true;
//                                                         documentoPost.Metadatos = file.Metadatos;
//                                                         this.documentService.post('documento', documentoPost)
//                                                             .subscribe(resuestaPost => {
//                                                                 documentos.push(resuestaPost)
//                                                                 // nuxeoservice.documentos[file.key] = resuestaPost.Body;
//                                                                 if ((index + 1) === files.length) {
//                                                                     documentsSubject.next(documentos);
//                                                                 }
//                                                             })

//                                                     });
//                                             })
//                                             .catch(function (error:any) {
//                                                 console.error(error);
//                                                 return error;
//                                             });
//                                     })
//                                     .catch(function (error:any) {
//                                         console.error(error);
//                                         return error;
//                                     })
//                             }
//                         });
//                 });
//             });
//         return documents$;
//     }
// }
