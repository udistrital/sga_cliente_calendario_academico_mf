import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectionListChange } from '@angular/material/list';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import * as moment from 'moment';

import { PopUpManager } from 'src/app/managers/popUpManager';
import { CalendarioActualizacionService } from 'src/app/services/calendario-actualizacion.service';
import { NewNuxeoService } from 'src/app/services/new_nuxeo.service';
import { SgaCalendarioMidService } from 'src/app/services/sga_calendario_mid.service';

export interface GestionExtensionesActividadData {
  activity: any;
  calendar: any;
  dependencias: any[];
  readOnly: boolean;
  calendarViewMode: boolean;
}

export interface GestionExtensionesActividadResult {
  action?: 'managePrograms';
  changed: boolean;
  extensiones: any[];
}

@Component({
  selector: 'gestion-extensiones-actividad',
  templateUrl: './gestion-extensiones-actividad.component.html',
  styleUrls: ['./gestion-extensiones-actividad.component.scss'],
})
export class GestionExtensionesActividadComponent implements OnInit {
  @ViewChild('extensionFileInput') extensionFileInput?: ElementRef<HTMLInputElement>;

  extensionForm!: FormGroup;
  extensiones: any[] = [];
  dependencias: any[] = [];
  selectedDependencyRanges: any[] = [];
  rangeDateGroups: Array<{ date: string; programNames: string[]; sortValue: number }> = [];
  programSearch = '';
  extensionFile: any = null;
  editingExtension: any = null;
  extensionMode: 'create' | 'edit' = 'create';
  showEditor = false;
  loadingHistory = false;
  loadingRanges = false;
  saving = false;
  downloadingDocumentId: any = null;
  readOnly = false;
  minExtensionDate: Date | null = null;
  readonly maxExtensionFileSize = 5 * 1024 * 1024;

  private changed = false;
  private rangeRequestVersion = 0;
  private historyRequestVersion = 0;

  constructor(
    public dialogRef: MatDialogRef<GestionExtensionesActividadComponent>,
    private builder: FormBuilder,
    public sgaCalendarioMidService: SgaCalendarioMidService,
    private newNuxeoService: NewNuxeoService,
    private translate: TranslateService,
    public popUpManager: PopUpManager,
    private calendarioActualizacionService: CalendarioActualizacionService,
    @Inject(MAT_DIALOG_DATA) public data: GestionExtensionesActividadData,
  ) {}

  ngOnInit(): void {
    this.readOnly = this.data.readOnly || this.data.activity?.Activo === false;
    this.createExtensionForm();
    this.extensiones = this.normalizeExtensions(this.data.activity?.Extensiones);
    this.dependencias = this.loadExtensionDependencies();
    this.reloadExtensions(false);
  }

  createExtensionForm(): void {
    this.extensionForm = this.builder.group({
      FechaFin: ['', Validators.required],
      HoraFin: ['23:59', Validators.required],
      DocumentoId: [''],
      DocumentoSoporte: [''],
      Descripcion: [''],
      Dependencias: [[], Validators.required],
    });
  }

  closeDialog(): void {
    this.dialogRef.close(this.dialogResult());
  }

  managePrograms(): void {
    if (this.readOnly) {
      return;
    }
    this.dialogRef.close({ ...this.dialogResult(), action: 'managePrograms' });
  }

  dialogResult(): GestionExtensionesActividadResult {
    return {
      changed: this.changed,
      extensiones: this.extensiones,
    };
  }

  activityId(): number {
    return Number(this.data.activity?.actividadId || this.data.activity?.Id || 0);
  }

  activityName(): string {
    return this.data.activity?.Nombre || this.t('calendario.actividad');
  }

  activityDescription(): string {
    return this.data.activity?.Descripcion || '';
  }

  originalRange(): string {
    const start = this.data.activity?.FechaInicioOriginal || this.data.activity?.FechaInicio;
    const end = this.data.activity?.FechaFinOriginal || this.data.activity?.FechaFin;
    return `${this.formatExtensionDate(start)} - ${this.formatExtensionDate(end)}`;
  }

  openCreateExtension(): void {
    if (this.readOnly || this.saving || this.dependencias.length === 0) {
      return;
    }
    this.resetExtensionForm();
    this.showEditor = true;
  }

  startEditExtension(extension: any): void {
    if (this.readOnly || this.saving || !this.extensionIsFullyCurrent(extension)) {
      return;
    }
    this.extensionMode = 'edit';
    this.editingExtension = extension;
    this.showEditor = true;
    this.extensionFile = null;
    this.extensionForm.patchValue({
      FechaFin: this.parseActivityDate(extension.FechaFin),
      HoraFin: this.parseActivityTime(extension.FechaFin),
      DocumentoId: extension.DocumentoId || '',
      DocumentoSoporte: '',
      Descripcion: extension.Descripcion || '',
      Dependencias: this.extensionDependencyIds(extension),
    });
    this.extensionForm.get('Dependencias')?.disable({ emitEvent: false });
    this.updateSelectedDependencyRanges();
  }

  cancelEditExtension(): void {
    this.resetExtensionForm();
    this.showEditor = false;
  }

  resetExtensionForm(): void {
    this.rangeRequestVersion += 1;
    this.extensionMode = 'create';
    this.editingExtension = null;
    this.selectedDependencyRanges = [];
    this.rangeDateGroups = [];
    this.programSearch = '';
    this.extensionFile = null;
    this.loadingRanges = false;
    this.minExtensionDate = null;
    this.extensionForm.get('Dependencias')?.enable({ emitEvent: false });
    this.extensionForm.reset({
      FechaFin: '',
      HoraFin: '23:59',
      DocumentoId: '',
      DocumentoSoporte: '',
      Descripcion: '',
      Dependencias: [],
    });
    if (this.extensionFileInput) {
      this.extensionFileInput.nativeElement.value = '';
    }
  }

  selectAllPrograms(): void {
    if (this.readOnly || this.extensionMode === 'edit') {
      return;
    }
    const dependenciesControl = this.extensionForm.get('Dependencias');
    dependenciesControl?.setValue(this.dependencias.map((dependencia) => Number(dependencia.Id)));
    dependenciesControl?.markAsTouched();
    this.updateSelectedDependencyRanges();
  }

  clearPrograms(): void {
    if (this.readOnly || this.extensionMode === 'edit') {
      return;
    }
    const dependenciesControl = this.extensionForm.get('Dependencias');
    dependenciesControl?.setValue([]);
    dependenciesControl?.markAsTouched();
    this.updateSelectedDependencyRanges();
  }

  selectedProgramIds(): number[] {
    const selected = this.extensionForm?.get('Dependencias')?.value;
    return Array.isArray(selected)
      ? selected.map((id: any) => Number(id)).filter((id: number) => id > 0)
      : [];
  }

  filteredDependencies(): any[] {
    const query = this.normalizeSearch(this.programSearch);
    if (!query) {
      return this.dependencias;
    }
    return this.dependencias.filter((dependency: any) => {
      const searchable = this.normalizeSearch(`${dependency?.Nombre || ''} ${dependency?.Id || ''}`);
      return searchable.includes(query);
    });
  }

  isProgramSelected(dependencyId: any): boolean {
    return this.selectedProgramIds().includes(Number(dependencyId));
  }

  onProgramSelectionChange(event: MatSelectionListChange): void {
    if (this.readOnly || this.extensionMode === 'edit') {
      return;
    }
    const selectedIds = new Set(this.selectedProgramIds());
    event.options.forEach((option) => {
      const dependencyId = Number(option.value);
      option.selected ? selectedIds.add(dependencyId) : selectedIds.delete(dependencyId);
    });
    const orderedSelection = this.dependencias
      .map((dependency: any) => Number(dependency.Id))
      .filter((dependencyId: number) => selectedIds.has(dependencyId));
    const dependenciesControl = this.extensionForm.get('Dependencias');
    dependenciesControl?.setValue(orderedSelection);
    dependenciesControl?.markAsTouched();
    this.updateSelectedDependencyRanges();
  }

  clearProgramSearch(): void {
    this.programSearch = '';
  }

  updateSelectedDependencyRanges(): void {
    const actividadId = this.activityId();
    const dependencias = this.selectedProgramIds();
    const requestVersion = ++this.rangeRequestVersion;
    this.selectedDependencyRanges = [];
    this.rangeDateGroups = [];
    this.minExtensionDate = null;

    if (!actividadId || dependencias.length === 0) {
      this.loadingRanges = false;
      return;
    }

    this.loadingRanges = true;
    const requests = dependencias.map((dependenciaId) =>
      this.sgaCalendarioMidService.get(`actividad-calendario/${actividadId}/rango-dependencia/${dependenciaId}`),
    );
    forkJoin(requests).subscribe(
      (responses: any[]) => {
        if (requestVersion !== this.rangeRequestVersion) {
          return;
        }
        this.selectedDependencyRanges = responses.map((response: any) => response?.Data || response);
        this.loadingRanges = false;
        this.updateMinimumExtensionDate();
        this.updateRangeDateGroups();
      },
      () => {
        if (requestVersion !== this.rangeRequestVersion) {
          return;
        }
        this.loadingRanges = false;
        this.selectedDependencyRanges = [];
        this.rangeDateGroups = [];
        this.popUpManager.showErrorToast(this.t('calendario.error_consultar_rangos_programas'));
      },
    );
  }

  updateMinimumExtensionDate(): void {
    const validDates = this.selectedDependencyRanges
      .map((range) => this.parseFlexibleDate(range?.RangoPermitido?.FechaFin))
      .filter((date) => date.isValid());
    if (validDates.length === 0) {
      this.minExtensionDate = null;
      return;
    }
    const latest = validDates.reduce((current, candidate) => candidate.isAfter(current) ? candidate : current);
    this.minExtensionDate = this.localDateFromMoment(latest);
  }

  updateRangeDateGroups(): void {
    const groups = new Map<string, { date: string; programNames: string[]; sortValue: number }>();
    this.selectedDependencyRanges.forEach((range: any) => {
      const rawDate = range?.RangoPermitido?.FechaFin;
      const parsedDate = this.parseFlexibleDate(rawDate);
      const sortValue = parsedDate.isValid() ? parsedDate.valueOf() : 0;
      const key = parsedDate.isValid() ? String(sortValue) : String(rawDate || '');
      const group = groups.get(key) || {
        date: this.formatExtensionDate(rawDate),
        programNames: [],
        sortValue,
      };
      group.programNames.push(this.rangeDependencyName(range));
      groups.set(key, group);
    });
    this.rangeDateGroups = Array.from(groups.values()).sort((left, right) => left.sortValue - right.sortValue);
  }

  hasDifferentCurrentEnds(): boolean {
    return this.rangeDateGroups.length > 1;
  }

  private normalizeSearch(value: any): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  canShowDateStep(): boolean {
    return this.selectedProgramIds().length > 0;
  }

  canShowSupportStep(): boolean {
    return this.canShowDateStep() && !!this.extensionForm?.get('FechaFin')?.value;
  }

  canReviewExtension(): boolean {
    const selected = this.selectedProgramIds();
    if (
      this.readOnly ||
      this.extensionForm?.invalid ||
      this.loadingRanges ||
      selected.length === 0 ||
      this.selectedDependencyRanges.length !== selected.length
    ) {
      return false;
    }
    return this.extensionMode === 'edit' || this.extensionDateIsValid(false);
  }

  saveExtension(): void {
    if (this.readOnly || this.saving) {
      return;
    }
    if (this.extensionForm.invalid) {
      this.extensionForm.markAllAsTouched();
      this.popUpManager.showErrorToast(this.t('calendario.error_extension_formulario'));
      return;
    }
    if (this.loadingRanges || this.selectedDependencyRanges.length !== this.selectedProgramIds().length) {
      this.popUpManager.showErrorToast(this.t('calendario.espere_consulta_rangos_programas'));
      return;
    }
    if (this.extensionMode === 'create' && !this.extensionDateIsValid(true)) {
      return;
    }

    const fechaFinExtension = this.proposedEndDate();
    const payload: any = {
      FechaFin: this.formatGmtMinus5(fechaFinExtension),
      DocumentoId: this.extensionForm.get('DocumentoId')?.value || null,
      Descripcion: this.extensionForm.get('Descripcion')?.value || '',
      Dependencias: this.selectedProgramIds(),
    };
    const editingExtensionId = this.extensionId(this.editingExtension);
    this.setSaving(true);
    this.uploadExtensionFileIfNeeded()
      .then((documentoId: any) => {
        payload.DocumentoId = documentoId || payload.DocumentoId;
        if (documentoId) {
          this.extensionForm.patchValue({ DocumentoId: documentoId, DocumentoSoporte: '' });
          this.extensionFile = null;
          if (this.extensionFileInput) {
            this.extensionFileInput.nativeElement.value = '';
          }
        }
        this.persistExtension(editingExtensionId, payload);
      })
      .catch((error: any) => {
        this.setSaving(false);
        this.popUpManager.showErrorToast(error?.message || this.t('ERROR.error_subir_documento'));
      });
  }

  persistExtension(editingExtensionId: any, payload: any): void {
    const actividadId = this.activityId();
    const saveMode = this.extensionMode;
    const request = saveMode === 'edit' && editingExtensionId
      ? this.sgaCalendarioMidService.put(`actividad-calendario/${actividadId}/extension/${editingExtensionId}`, payload)
      : this.sgaCalendarioMidService.post(`actividad-calendario/${actividadId}/extension`, payload);

    request.subscribe(
      () => {
        const message = saveMode === 'edit'
          ? this.t('calendario.extension_actualizada')
          : this.t('calendario.extension_registrada');
        this.setSaving(false);
        this.changed = true;
        this.popUpManager.showSuccessAlert(message);
        this.resetExtensionForm();
        this.showEditor = false;
        this.notifyCalendarUpdate();
        this.reloadExtensions(true);
      },
      (error: any) => {
        this.setSaving(false);
        this.popUpManager.showErrorToast(this.errorMessage(error, 'calendario.error_guardar_extension'));
      },
    );
  }

  reloadExtensions(showError = true): void {
    const actividadId = this.activityId();
    if (!actividadId) {
      return;
    }
    const requestVersion = ++this.historyRequestVersion;
    this.loadingHistory = true;
    this.sgaCalendarioMidService.get(`actividad-calendario/${actividadId}/extension`).subscribe(
      (response: any) => {
        if (requestVersion !== this.historyRequestVersion) {
          return;
        }
        this.extensiones = this.normalizeExtensions(response?.Data || response);
        this.data.activity.Extensiones = this.extensiones;
        this.loadingHistory = false;
      },
      () => {
        if (requestVersion !== this.historyRequestVersion) {
          return;
        }
        this.loadingHistory = false;
        if (showError) {
          this.popUpManager.showErrorToast(this.t('calendario.error_recargar_extensiones'));
        }
      },
    );
  }

  deleteExtension(extension: any): void {
    if (this.readOnly || this.saving) {
      return;
    }
    if (!this.extensionIsFullyCurrent(extension)) {
      this.popUpManager.showErrorToast(this.t('calendario.extension_parcial_no_editable'));
      return;
    }
    const extensionId = this.extensionId(extension);
    if (!extensionId) {
      this.popUpManager.showErrorToast(this.t('calendario.error_identificar_extension_anular'));
      return;
    }
    const programs = this.extensionDependencyNames(extension);
    this.popUpManager
      .showConfirmAlert(this.t('calendario.confirmar_anular_extension_impacto', { programas: programs }))
      .then((ok) => {
        if (!ok.value) {
          return;
        }
        this.setSaving(true);
        this.sgaCalendarioMidService
          .put(`actividad-calendario/${this.activityId()}/extension/${extensionId}/anular`, {})
          .subscribe(
            () => {
              this.setSaving(false);
              this.changed = true;
              this.popUpManager.showSuccessAlert(this.t('calendario.extension_anulada'));
              this.resetExtensionForm();
              this.showEditor = false;
              this.notifyCalendarUpdate();
              this.reloadExtensions(true);
            },
            (error: any) => {
              this.setSaving(false);
              this.popUpManager.showErrorToast(this.errorMessage(error, 'calendario.error_anular_extension'));
            },
          );
      });
  }

  notifyCalendarUpdate(): void {
    this.calendarioActualizacionService.notificar({
      calendarioId: Number(this.data.calendar?.calendarioId),
      actividadIds: [this.activityId()],
    });
  }

  private setSaving(saving: boolean): void {
    this.saving = saving;
    this.dialogRef.disableClose = saving;
  }

  uploadExtensionFileIfNeeded(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.extensionFile) {
        resolve(null);
        return;
      }
      this.newNuxeoService.uploadFiles([this.extensionFile]).subscribe(
        (responseNux: any[]) => {
          if (responseNux[0]?.Status == '200') {
            resolve(responseNux[0].res.Id);
          } else {
            reject(new Error(this.t('ERROR.error_subir_documento')));
          }
        },
        (error: any) => reject(error),
      );
    });
  }

  onInputFileExtension(event: Event): void {
    this.extensionFile = null;
    const selectedFile = (event.target as HTMLInputElement).files?.[0];
    if (!selectedFile) {
      return;
    }
    if (selectedFile.type !== 'application/pdf') {
      this.popUpManager.showErrorToast(this.t('ERROR.formato_documento_pdf'));
      this.extensionForm.patchValue({ DocumentoSoporte: '' });
      (event.target as HTMLInputElement).value = '';
      return;
    }
    if (selectedFile.size > this.maxExtensionFileSize) {
      this.popUpManager.showErrorToast(this.t('calendario.documento_soporte_supera_limite'));
      this.extensionForm.patchValue({ DocumentoSoporte: '' });
      (event.target as HTMLInputElement).value = '';
      return;
    }
    this.extensionFile = {
      IdDocumento: 14,
      nombre: 'Extension_Actividad_Calendario',
      metadatos: this.extensionFileMetadata(),
      descripcion: 'Extension_Actividad_Calendario',
      file: selectedFile,
    };
  }

  extensionFileMetadata(): any {
    const metadata: any = {};
    if (this.data.calendar?.resolucion !== undefined && this.data.calendar?.resolucion !== null) {
      metadata.resolucion = String(this.data.calendar.resolucion);
    }
    if (this.data.calendar?.anno !== undefined && this.data.calendar?.anno !== null) {
      metadata.anno = String(this.data.calendar.anno);
    }
    if (this.activityId()) {
      metadata.actividad_id = String(this.activityId());
    }
    const extensionId = this.extensionId(this.editingExtension);
    if (extensionId) {
      metadata.extension_id = String(extensionId);
    }
    return metadata;
  }

  downloadExtensionFile(idDocumento: any): void {
    if (!idDocumento || this.downloadingDocumentId) {
      return;
    }
    this.downloadingDocumentId = idDocumento;
    this.newNuxeoService.get([{ Id: idDocumento }]).subscribe(
      (response: any) => {
        this.downloadingDocumentId = null;
        const url = response?.[0]?.url;
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      },
      () => {
        this.downloadingDocumentId = null;
        this.popUpManager.showErrorToast(this.t('ERROR.error_cargar_documento'));
      },
    );
  }

  loadExtensionDependencies(): any[] {
    const dependenciaId = this.data.activity?.DependenciaId || this.data.calendar?.DependenciaId;
    const parsed = typeof dependenciaId === 'string' ? this.safeParseJson(dependenciaId) : dependenciaId;
    const projects = Array.isArray(parsed?.proyectos) ? parsed.proyectos : [];
    const ids = Array.from(new Set<number>(
      projects.map((id: any) => Number(id)).filter((id: number) => id > 0),
    ));
    const catalog = new Map(
      (Array.isArray(this.data.dependencias) ? this.data.dependencias : [])
        .map((dependencia: any) => [Number(dependencia.Id), dependencia]),
    );
    return ids.map((id) => catalog.get(id) || {
      Id: id,
      Nombre: `${this.t('calendario.programa_academico')} ${id}`,
    });
  }

  safeParseJson(value: string): any {
    try {
      return JSON.parse(value);
    } catch (_) {
      return {};
    }
  }

  normalizeExtensions(value: any): any[] {
    const rawExtensions = Array.isArray(value) ? value : (Array.isArray(value?.Data) ? value.Data : []);
    const grouped = new Map<number, any>();

    rawExtensions.forEach((raw: any) => {
      if (!raw || Object.keys(raw).length === 0) {
        return;
      }
      const nested = raw.CalendarioEventoExtensionId;
      const source = nested || raw;
      const id = Number(source?.Id || source?.id || 0);
      if (!id) {
        return;
      }
      const existing = grouped.get(id) || {
        ...source,
        Id: id,
        NumeroExtension: source?.NumeroExtension || source?.numero_extension,
        FechaFin: source?.FechaFin || source?.fecha_fin,
        DocumentoId: source?.DocumentoId || source?.documento_id,
        Descripcion: source?.Descripcion || source?.descripcion,
        Programas: [],
      };
      const programs = nested ? [raw] : (Array.isArray(raw.Programas) ? raw.Programas : []);
      const knownProgramIds = new Set(existing.Programas.map((program: any) => Number(program.Id || program.id)));
      programs.forEach((program: any) => {
        const programId = Number(program.Id || program.id || 0);
        if (!programId || !knownProgramIds.has(programId)) {
          existing.Programas.push(program);
          if (programId) {
            knownProgramIds.add(programId);
          }
        }
      });
      grouped.set(id, existing);
    });

    return Array.from(grouped.values()).sort(
      (left, right) => Number(right.NumeroExtension || 0) - Number(left.NumeroExtension || 0),
    );
  }

  extensionId(extension: any): number {
    return Number(extension?.Id || extension?.id || extension?.CalendarioEventoExtensionId?.Id || 0);
  }

  extensionHasCurrentPrograms(extension: any): boolean {
    return extension?.Activo !== false && this.activeExtensionPrograms(extension).some(
      (program: any) => program?.Vigente === true,
    );
  }

  extensionIsFullyCurrent(extension: any): boolean {
    const programs = this.activeExtensionPrograms(extension);
    return extension?.Activo !== false && programs.length > 0 && programs.every(
      (program: any) => program?.Vigente === true,
    );
  }

  extensionIsPartiallyCurrent(extension: any): boolean {
    return this.extensionHasCurrentPrograms(extension) && !this.extensionIsFullyCurrent(extension);
  }

  activeExtensionPrograms(extension: any): any[] {
    const programs = Array.isArray(extension?.Programas) ? extension.Programas : [];
    return programs.filter((program: any) => program?.Activo !== false);
  }

  activeExtensionCount(): number {
    return this.extensiones.filter((extension) => this.extensionHasCurrentPrograms(extension)).length;
  }

  extensionDependencyIds(extension: any): number[] {
    const programs = Array.isArray(extension?.Programas) ? extension.Programas : [];
    return programs
      .map((program: any) => Number(program.DependenciaId || program.dependencia_id || 0))
      .filter((id: number) => id > 0);
  }

  dependencyName(id: any): string {
    const dependencia = this.dependencias.find((item) => Number(item.Id) === Number(id));
    return dependencia?.Nombre || `${this.t('calendario.programa_academico')} ${id}`;
  }

  extensionDependencyNames(extension: any): string {
    const names = this.extensionDependencyIds(extension).map((id) => this.dependencyName(id));
    return names.join(', ') || '-';
  }

  rangeDependencyName(range: any): string {
    return this.dependencyName(range?.DependenciaId);
  }

  rangeCurrentEnd(range: any): string {
    return this.formatExtensionDate(range?.RangoPermitido?.FechaFin);
  }

  proposedEndDate(): moment.Moment {
    return this.combineDateAndTime(
      this.extensionForm.get('FechaFin')?.value,
      this.extensionForm.get('HoraFin')?.value,
    );
  }

  proposedEndFormatted(): string {
    const proposed = this.proposedEndDate();
    return proposed.isValid() ? proposed.format('DD/MM/YYYY HH:mm') : '-';
  }

  latestCurrentEnd(): string {
    const validDates = this.selectedDependencyRanges
      .map((range) => this.parseFlexibleDate(range?.RangoPermitido?.FechaFin))
      .filter((date) => date.isValid());
    if (validDates.length === 0) {
      return '-';
    }
    const latest = validDates.reduce((current, candidate) => candidate.isAfter(current) ? candidate : current);
    return latest.format('DD/MM/YYYY HH:mm');
  }

  extensionDateIsValid(showMessage: boolean): boolean {
    const proposed = this.proposedEndDate();
    if (!proposed.isValid()) {
      return false;
    }
    const invalidRanges = this.selectedDependencyRanges.filter((range: any) => {
      const currentEnd = this.parseFlexibleDate(range?.RangoPermitido?.FechaFin);
      return !currentEnd.isValid() || !proposed.isAfter(currentEnd);
    });
    if (invalidRanges.length > 0 && showMessage) {
      const names = invalidRanges.map((range) => this.rangeDependencyName(range)).join(', ');
      this.popUpManager.showErrorToast(this.t('calendario.fecha_fin_extension_mayor_vigente', { programas: names }));
    }
    return invalidRanges.length === 0;
  }

  parseActivityDate(date: any): Date {
    const parsedDate = this.parseFlexibleDate(date);
    return parsedDate.isValid() ? this.localDateFromMoment(parsedDate) : moment(date).toDate();
  }

  parseActivityTime(date: any): string {
    const parsedDate = this.parseFlexibleDate(date);
    return parsedDate.isValid() ? parsedDate.format('HH:mm') : '00:00';
  }

  parseFlexibleDate(date: any): moment.Moment {
    const value = this.extractDateValue(date);
    return moment.parseZone(value, [
      moment.ISO_8601,
      'YYYY-MM-DDTHH:mm:ss[Z]',
      'YYYY-MM-DDTHH:mm:ssZ',
      'YYYY-MM-DDTHH:mm:ss',
      'YYYY-MM-DD HH:mm:ss ZZ',
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD HH:mm',
      'YYYY-MM-DD',
      'DD/MM/YYYY HH:mm',
      'DD/MM/YYYY',
      'DD-MM-YYYY HH:mm',
      'DD-MM-YYYY',
    ], true);
  }

  localDateFromMoment(date: moment.Moment): Date {
    return new Date(date.year(), date.month(), date.date());
  }

  extractDateValue(date: any): any {
    if (date === null || date === undefined || date instanceof Date || typeof date === 'string' || typeof date === 'number') {
      return typeof date === 'string' ? this.cleanDateText(date) : date;
    }
    return this.extractDateValue(
      date.FechaFin || date.fecha_fin || date.FechaInicio || date.fecha_inicio || date.Time || date.time || date.String || date.string || '',
    );
  }

  cleanDateText(date: string): string {
    return date.trim()
      .replace(/ ([+-]\d{4}) [+-]\d{4}$/, '')
      .replace(/([T ]\d{2}:\d{2}:\d{2})(?:\.\d+)?\s+[+-]\d{4}$/, '$1')
      .replace(/([T ]\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/, '$1');
  }

  combineDateAndTime(date: any, time: string): moment.Moment {
    const parsedDate = moment(date);
    const [hours, minutes] = (time || '00:00').split(':').map((value: string) => Number(value));
    return parsedDate.hours(hours || 0).minutes(minutes || 0).seconds(0).milliseconds(0);
  }

  formatGmtMinus5(date: moment.Moment): string {
    return date.clone().format('YYYY-MM-DDTHH:mm:ss');
  }

  formatExtensionDate(date: any): string {
    const parsedDate = this.parseFlexibleDate(date);
    return parsedDate.isValid() ? parsedDate.format('DD/MM/YYYY HH:mm') : '-';
  }

  errorMessage(error: any, fallbackKey: string): string {
    return error?.error?.Message
      || error?.error?.Data
      || error?.Message
      || error?.message
      || this.t(fallbackKey);
  }

  t(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }
}
