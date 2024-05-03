import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Documento } from '../models/documento/documento';
import { Subject } from 'rxjs';
import { DocumentoService } from './documento.service';
import { AnyService } from './any.service';
import { mergeMap } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpEventType } from '@angular/common/http';


@Injectable({
    providedIn: 'root',
})
export class NewNuxeoService {

    private documentsList: any[] = [];

    private mimeTypes:any = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/bmp": ".bmp",
        "image/webp": ".webp",
        "image/svg+xml": ".svg",
        "application/pdf": ".pdf",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.ms-excel": ".xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
        "application/vnd.ms-powerpoint": ".ppt",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
        "text/plain": ".txt",
        "text/html": ".html",
        "text/css": ".css",
        "text/javascript": ".js",
        "application/json": ".json",
        "application/xml": ".xml"
      };
      

    constructor(
        private anyService: AnyService,
        private sanitization: DomSanitizer,
        private documentService: DocumentoService,
    ) {

    }

    clearLocalFiles() {
        this.documentsList = [];
    }

    getUrlFile(base64:any, minetype:any) {
        return new Promise<string>((resolve, reject) => {
            const url = `data:${minetype};base64,${base64}`;
            fetch(url)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "File name", { type: minetype })
                    const url = URL.createObjectURL(file);
                    resolve(url);
                })
        });
    }

    fileToBase64(file:any) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                let encoded = reader.result!.toString().replace(/^data:(.*,)?/, '');
                if ((encoded.length % 4) > 0) {
                    encoded += '='.repeat(4 - (encoded.length % 4));
                }
                resolve(encoded);
            };
            reader.onerror = error => reject(error);
        });
    }

    getManyFiles(query: string) {
        const documentsSubject = new Subject<any>();
        const documents$ = documentsSubject.asObservable();
        this.anyService.getp(environment.NUXEO_SERVICE, '/document'+query).subscribe(
            async (response: any) => {
                if (response.type === HttpEventType.DownloadProgress) {
                    const downloadProgress = 100 * response.loaded / response.total;
                    documentsSubject.next({"downloadProgress": downloadProgress});
                }
                if (response.type === HttpEventType.Response) {
                    //no estoy seguro
                    let listaDocsRaw = <Array<any>>response.body.Data;
                    let listaDocs = await Promise.all(listaDocsRaw.map(async doc => {
                        if (doc.Nuxeo) {
                            return {
                                Id: doc.Id,
                                Nombre: doc.Nombre,
                                Enlace: doc.Enlace,
                                Url: await this.getUrlFile(doc.Nuxeo.file, doc.Nuxeo['file:content']['mime-type']),
                                TipoArchivo: this.mimeTypes[doc.Nuxeo['file:content']['mime-type']],
                            }
                        }
                        else{
                            return null;
                        }
                    }));
                    this.documentsList.push.apply(this.documentsList, listaDocs);
                    documentsSubject.next(listaDocs);
                }
            },
            (error: any) => {
                documentsSubject.error(error)
            }
        );
        return documents$;
    }

    getByIdLocal(id: number) {
        const documentsSubject = new Subject<any>();
        const documents$ = documentsSubject.asObservable();
        const doc = this.documentsList.find(doc => doc.Id === id);
        if (doc != undefined) {
            setTimeout(() => {
                documentsSubject.next({"Id": doc.Id, "nombre": doc.Nombre, "url": doc.Url, "type": doc.TipoArchivo});
            }, 1);
        } else {
            documentsSubject.error("Document not found");
        }
        return documents$
    }

    uploadFiles(files:any) {
        const documentsSubject = new Subject<Documento[]>();
        const documents$ = documentsSubject.asObservable();

        const documentos :any[] = [];

        files.map(async (file:any) => {
            const sendFileData = [{
                IdTipoDocumento: file.IdDocumento,
                nombre: file.nombre.replace(/[\.]/g),
                metadatos: file.metadatos ? file.metadatos : {},
                descripcion: file.descripcion ? file.descripcion : "",
                file: await this.fileToBase64(file.file)
            }]

            this.anyService.post(environment.NUXEO_SERVICE, 'document/uploadAnyFormat', sendFileData)
                .subscribe((dataResponse) => {
                    documentos.push(dataResponse);
                    if (documentos.length === files.length) {
                        documentsSubject.next(documentos);
                    }
                })
        });

        return documents$;
    }

    uploadFilesElectronicSign(files: Array<any>) {
        const documentsSubject = new Subject<any[]>();
        const documents$ = documentsSubject.asObservable();

        const documentos : any[] = [];

        files.map(async (file) => {
            const sendFileDataandSigners = [{
                IdTipoDocumento: file.IdDocumento,
                nombre: file.nombre.replace(/[\.]/g),
                metadatos: file.metadatos ? file.metadatos : {},
                descripcion: file.descripcion ? file.descripcion : "",
                file: file.base64 ? file.base64 : await this.fileToBase64(file.file),
                firmantes: file.firmantes ? file.firmantes : [],
                representantes: file.representantes ? file.representantes : []
              }];
              
            this.anyService.post(environment.NUXEO_SERVICE, '/document/firma_electronica', sendFileDataandSigners)
                .subscribe((dataResponse) => {
                    documentos.push(dataResponse);
                    if (documentos.length === files.length) {
                    documentsSubject.next(documentos);
                    }
                }, (error) => {
                    documentsSubject.error(error);
                })
        });

        return documents$
    }

    get(files:any) {
        const documentsSubject = new Subject<Documento[]>();
        const documents$ = documentsSubject.asObservable();
        const documentos = files;
        let i = 0;
        files.map((file:any, index:any) => {
            this.documentService.get('documento/' + file.Id)
            .subscribe((doc:any) => {
                this.anyService.get(environment.NUXEO_SERVICE, '/document/' + doc.Enlace)
                .subscribe(async (f: any) => {
                    const url = await this.getUrlFile(f.file, file.ContentType ? file.ContentType : f['file:content']['mime-type'])
                    documentos[index] = { ...documentos[index], ...{ url: url }, ...{ Documento: this.sanitization.bypassSecurityTrustUrl(url) },
                                          ...{ Nombre: doc.Nombre }, ...{ Metadatos: doc.Metadatos } }           
                    i+=1;
                    if(i === files.length){
                        documentsSubject.next(documentos);
                    }
                })
            })
        });
        return documents$;
    }

    getByUUID(uuid:any) {
        const documentsSubject = new Subject<Documento[]>();
        const documents$ = documentsSubject.asObservable();
        let documento:any = null;
        this.anyService.get(environment.NUXEO_SERVICE, '/document/' + uuid)
            .subscribe(async (f: any) => {
                const url = await this.getUrlFile(f.file, f['file:content']['mime-type']);
                documento = url
                documentsSubject.next(documento);
            }, (error) => {
                documentsSubject.next(error);
            })
        return documents$;
    }

    deleteByUUID(uuid:any) {
        const documentsSubject = new Subject<any>();
        const documents$ = documentsSubject.asObservable();
        const versionar = true;
        this.anyService.delete2(environment.NUXEO_SERVICE, '/document/' + uuid + '?versionar=' + versionar)
            .subscribe(r => {
                documentsSubject.next(r)
            }, e => {
                documentsSubject.error(e)
            })
        return documents$;
    }

    deleteByIdDoc(Id:any, relacion:any) {
        const documentsSubject = new Subject<any>();
        const documents$ = documentsSubject.asObservable();
        this.documentService.get('documento/'+Id).subscribe((doc: any) => {
            doc.Activo = false;
            doc.Descripcion = "id_relacionado: " + relacion;
            this.documentService.put('documento/', doc).subscribe((doc: any) => {
                documentsSubject.next(doc)
            }, e => {
                documentsSubject.error(e)
            })
        }, e => {
            documentsSubject.error(e)
        });
        return documents$;
    }
}
