import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NivelFormacion } from 'src/app/models/proyecto_academico/nivel_formacion';
import { ProyectoAcademicoService } from 'src/app/services/proyecto_academico.service';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { SgaCalendarioMidService } from 'src/app/services/sga_calendario_mid.service';

@Component({
  selector: 'calendario-proyecto',
  templateUrl: './calendario-proyecto.component.html',
  styleUrls: ['./calendario-proyecto.component.scss'],
})
export class CalendarioProyectoComponent {

  selectedLevel: FormControl;
  selectedProject: FormControl;
  niveles!: NivelFormacion[];
  projects!: any[];
  calendarioId: string = '';
  projectId: number = 0;
  showCalendar: boolean = false;
  loading: boolean = false;

  constructor(
    private projectService: ProyectoAcademicoService,
    private sgaCalendarioMidService: SgaCalendarioMidService,
    private popUpManager: PopUpManager,
    private translate: TranslateService,
  ) {
    this.selectedLevel = new FormControl('');
    this.selectedProject = new FormControl('');
    this.nivel_load();
  }

  filtrarProyecto(proyecto:any):any {
    if (this.selectedLevel.value === proyecto['NivelFormacionId']['Id']) {
      return true
    }
    if (proyecto['NivelFormacionId']['NivelFormacionPadreId'] !== null) {
      if (proyecto['NivelFormacionId']['NivelFormacionPadreId']['Id'] === this.selectedLevel.value) {
        return true
      }
    } else {
      return false
    }
  }

  onSelectLevel() {
    this.loading = true;
    this.showCalendar = false;
    this.projectService.get('proyecto_academico_institucion?limit=0&fields=Id,Nombre,NivelFormacionId').subscribe(
      (response:any) => {
        if (response[0].Id !== undefined) {
          this.projects = <any[]>response.filter((proyecto:any) => this.filtrarProyecto(proyecto));
        } else {
          this.popUpManager.showErrorAlert(this.translate.instant('calendario.sin_calendarios'));
        }
        this.loading = false;
      },
      error => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
        this.loading = false;
      },
    );
  }

  onSelectProject() {
    this.loading = true;
    this.showCalendar = false;
    this.sgaCalendarioMidService.get('calendario-proyecto/' + this.selectedProject.value).subscribe(
      (response:any) => {
        this.calendarioId = response.data["CalendarioId"];
        this.projectId = this.selectedProject.value
        if (this.calendarioId === "0") {
          this.showCalendar = false;
          this.popUpManager.showAlert('', this.translate.instant('calendario.sin_calendario'))
        } else {
          this.showCalendar = true;
        }
        this.loading = false;
      },
      (error:any) => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
        this.loading = false;
      },
    );
  }

  nivel_load() {
    this.projectService.get('nivel_formacion?limit=0').subscribe(
      // (response: NivelFormacion[]) => {
        (response: any) => {
        this.niveles = response.filter((nivel:any) => nivel.NivelFormacionPadreId === null)
      },
      error => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      }
    );
  }

}
