import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ProyectoAcademicoService } from '../../services/proyecto_academico.service';
import { PopUpManager } from '../../managers/popUpManager';

@Component({
  selector: 'asignar-calendario-proyecto',
  templateUrl: './asignar-calendario-proyecto.component.html',
  styleUrls: ['./calendario-academico.component.scss'],
})
export class AsignarCalendarioProyectoComponent implements OnInit {

  selectedProjects: FormControl;
  projects!: any[];
  constructor(
    private projectService: ProyectoAcademicoService,
    private popUpManager: PopUpManager,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<AsignarCalendarioProyectoComponent>,
    @Inject(MAT_DIALOG_DATA) public dat: any,
  ) {
    this.selectedProjects = new FormControl([], Validators.required);
    this.dialogRef.backdropClick().subscribe(() => this.dialogRef.close());
  }

  ngOnInit() {
    this.projectService.get('proyecto_academico_institucion?limit=0&query=Activo:true').subscribe(
      response => {
          this.projects = (<any[]><unknown>response).filter(
          proyecto => this.filtrarProyecto(proyecto),
        );
        if (this.dat.calendar.DependenciaId !== '{}') {
          const deps = JSON.parse(this.dat.calendar.DependenciaId);
          this.selectedProjects.setValue(deps['proyectos']);
        }
      },
      error => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      },
    );
  }

  filtrarProyecto(proyecto:any):any {
    if (this.dat.data.Dependencia === proyecto['NivelFormacionId']['Nombre']) {
      return true
    }
    return false
  }

  register() {
    this.popUpManager.showConfirmAlert(this.translate.instant('calendario.seguro_proyectos'))
      .then((ok) => {
        if (ok.value) this.dialogRef.close(this.selectedProjects.value);
      });
  }

}
