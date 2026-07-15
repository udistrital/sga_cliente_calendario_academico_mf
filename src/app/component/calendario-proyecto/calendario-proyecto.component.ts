import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { SgaCalendarioMidService } from 'src/app/services/sga_calendario_mid.service';
import { CalendarioFiltroOption, CalendarioFiltrosAlcanceService, CalendarioProgramaOption } from 'src/app/services/calendario-filtros-alcance.service';

@Component({
  selector: 'calendario-proyecto',
  templateUrl: './calendario-proyecto.component.html',
  styleUrls: ['./calendario-proyecto.component.scss'],
})
export class CalendarioProyectoComponent {

  selectedPeriod: FormControl;
  selectedFaculty: FormControl;
  selectedLevel: FormControl;
  selectedProject: FormControl;
  periodos: CalendarioFiltroOption[] = [];
  facultades: CalendarioFiltroOption[] = [];
  niveles: CalendarioFiltroOption[] = [];
  projects: CalendarioProgramaOption[] = [];
  calendarioId: string = '';
  projectId: number = 0;
  showCalendar: boolean = false;

  constructor(
    private filtrosAlcanceService: CalendarioFiltrosAlcanceService,
    private sgaCalendarioMidService: SgaCalendarioMidService,
    private popUpManager: PopUpManager,
    private translate: TranslateService,
  ) {
    this.selectedPeriod = new FormControl('');
    this.selectedFaculty = new FormControl({ value: '', disabled: true });
    this.selectedLevel = new FormControl({ value: '', disabled: true });
    this.selectedProject = new FormControl({ value: '', disabled: true });
    this.cargarAlcance();
  }

  cargarAlcance(): void {
    this.filtrosAlcanceService.cargarAlcance()
      .then((alcance) => {
        this.periodos = alcance.periodos;
        this.facultades = alcance.facultades;
        this.niveles = [];
        this.projects = [];
      })
      .catch(() => {
        this.periodos = [];
        this.facultades = [];
        this.niveles = [];
        this.projects = [];
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      });
  }

  onSelectPeriod(): void {
    this.showCalendar = false;
    this.calendarioId = '';
    this.projectId = 0;
    this.resetControl(this.selectedFaculty, !this.selectedPeriod.value);
    this.resetControl(this.selectedLevel, true);
    this.resetControl(this.selectedProject, true);
    this.niveles = [];
    this.projects = [];
  }

  onSelectFaculty(): void {
    this.showCalendar = false;
    this.calendarioId = '';
    this.projectId = 0;
    this.resetControl(this.selectedLevel, !this.selectedFaculty.value);
    this.resetControl(this.selectedProject, true);
    this.projects = [];
    this.niveles = this.filtrosAlcanceService.nivelesPorFacultad(Number(this.selectedFaculty.value));
  }

  onSelectLevel(): void {
    this.showCalendar = false;
    this.calendarioId = '';
    this.projectId = 0;
    this.resetControl(this.selectedProject, !this.selectedLevel.value);
    this.projects = this.filtrosAlcanceService.programasPorFacultadNivel(
      Number(this.selectedFaculty.value),
      Number(this.selectedLevel.value)
    );
  }

  resetControl(control: FormControl, disabled: boolean): void {
    control.setValue('');
    if (disabled) {
      control.disable();
    } else {
      control.enable();
    }
  }

  onSelectProject() {
    this.showCalendar = false;
    const periodoId = Number(this.selectedPeriod.value);
    const programaId = Number(this.selectedProject.value);
    if (!periodoId || !programaId) {
      return;
    }
    this.sgaCalendarioMidService.get('calendario-proyecto/' + programaId + '?id-periodo=' + periodoId).subscribe(
      (response:any) => {
        this.calendarioId = String(response?.Data?.CalendarioId || response?.CalendarioId || '0');
        this.projectId = programaId;
        if (this.calendarioId === '0') {
          this.showCalendar = false;
          this.popUpManager.showAlert('', this.translate.instant('calendario.sin_calendario'));
        } else {
          this.showCalendar = true;
        }
      },
      (error:any) => {
        this.popUpManager.showErrorToast(this.translate.instant('ERROR.general'));
      },
    );
  }

}
