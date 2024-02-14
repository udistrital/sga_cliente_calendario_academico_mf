import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

import { ProyectoAcademicoService } from '../../services/proyecto_academico.service';
import { PopUpManager } from '../../managers/popUpManager';
import * as moment from 'moment';
import * as momentTimezone from 'moment-timezone';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';



@Component({
  selector: 'edicion-actividades-programas',
  templateUrl: './edicion-actividades-programas.component.html',
  styleUrls: ['./edicion-actividades-programas.component.scss']
})
export class EdicionActividadesProgramasComponent implements OnInit {

  select_proyectos_act: boolean = false;
  actividad_detalle_proyectos: boolean = false;
  vista: string;
  projects!: any[];
  actividad: string = "";
  descripcion_actividad: string = "";
  proceso_detalle: boolean = false;
  editar_actividad: boolean = false;
  nombre_proceso: string = "";
  descripcion_proceso: string = "";
  periodicidad_proceso: string = "";
  periodo: string = "";
  fecha_inicio_org: string = "";
  fecha_fin_org: string = "";
  displayedColumns: string[] = ['ProyectoCurricular', 'FechaInicio', 'FechaFin','FechaEdicion' ];
  dataSource!: MatTableDataSource<any>;
  dataSource2!: MatTableDataSource<any>
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  settings!: Object;


  settings2!: Object;
  //dataSource2!: LocalDataSource;

  SelectorDeps!: FormGroup;
  ActivityEditor!: FormGroup;
  ActividadEditable: boolean = false;

  constructor(
    private projectService: ProyectoAcademicoService,
    private popUpManager: PopUpManager,
    private builder: FormBuilder,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<EdicionActividadesProgramasComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
   // this.dataSource = new LocalDataSource();
   // this.dataSource2 = new LocalDataSource();
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.createTable();
      this.createTable2();
    })
    this.vista = this.data.vista;
    if(this.vista == "select"){
      this.select_proyectos_act = true;
      this.actividad_detalle_proyectos = false;
      this.proceso_detalle = false;
      this.editar_actividad = false;
    }
    if(this.vista == "view"){
      this.select_proyectos_act = false;
      this.actividad_detalle_proyectos = true;
      this.proceso_detalle = false;
      this.editar_actividad = false;
    }
    if(this.vista == "process"){
      this.select_proyectos_act = false;
      this.actividad_detalle_proyectos = false;
      this.proceso_detalle = true;
      this.editar_actividad = false;
    }
    if(this.vista == "edit_act"){
      this.select_proyectos_act = false;
      this.actividad_detalle_proyectos = false;
      this.proceso_detalle = false;
      this.editar_actividad = true;
    }
    this.dialogRef.backdropClick().subscribe(() => this.closeDialog());
  }

  ngOnInit() {

    // Seleccion de proyectos a editar fechas actividades
    if (this.select_proyectos_act) {
      this.SelectorDeps = this.builder.group({
        Dependencias: ['', Validators.required],
      });
      this.projects = this.data.dependencias;
 
      let dependenciasJSON = this.data.activity.DependenciaId;
      console.log("deps:", dependenciasJSON.proyectos)
      this.SelectorDeps.patchValue({
        Dependencias: dependenciasJSON.proyectos,
      })
    }

    if(this.actividad_detalle_proyectos){
      this.createTable();
      this.actividad = this.data.activity.Nombre;
      this.descripcion_actividad = this.data.activity.Descripcion;
      let deps = this.data.activity.DependenciaId;
      let tablaFechas: any[] = [];
      deps.fechas.forEach((fdep: { Id: any; Inicio: moment.MomentInput; Fin: moment.MomentInput; Modificacion: moment.MomentInput; }) => {
        tablaFechas.push({
          ProyectoCurricular: this.data.projects.find((p: { Id: any; }) => p.Id == fdep.Id).Nombre,
          FechaInicio:  moment(fdep.Inicio,'YYYY-MM-DDTHH:mm:ss[Z]').format('DD-MM-YYYY'),
          FechaFin: moment(fdep.Fin,'YYYY-MM-DDTHH:mm:ss[Z]').format('DD-MM-YYYY'),
          FechaEdicion: moment(fdep.Modificacion,'YYYY-MM-DDTHH:mm:ss[Z]').format('DD-MM-YYYY'),
        })
      })
      console.log(tablaFechas)
      this.dataSource = new MatTableDataSource(tablaFechas);
    
    }
    if(this.proceso_detalle){
      console.log(this.data)
      this.nombre_proceso = this.data.process.Nombre;
      this.descripcion_proceso = this.data.process.Descripcion;
      this.periodicidad_proceso = this.data.process.TipoRecurrenciaId.Nombre;
    }
    if(this.editar_actividad){
      console.log(this.data)
      this.ActividadEditable = this.data.activity.Editable;
      this.ActivityEditor = new FormGroup({
          fecha_inicio_org: new FormControl(''),
          fecha_fin_org: new FormControl(''),
          fecha_inicio_new: new FormControl(''),
          fecha_fin_new: new FormControl(''),
      });
      console.log(this.data)
      this.nombre_proceso = this.data.process.Nombre;
      this.periodo = this.data.periodo;
      this.actividad = this.data.activity.Nombre;
      this.descripcion_actividad = this.data.activity.Descripcion;
      this.fecha_inicio_org = this.data.activity.FechaInicioOrg;
      this.fecha_fin_org = this.data.activity.FechaFinOrg;
      this.createTable2();
    //  this.dataSource2.load(this.data.activity.responsables);
        console.log(this.data)
        // this.dataSource2 = new MatTableDataSource(this.data.activity.responsables)
      this.ActivityEditor.patchValue({
        fecha_inicio_org: moment(this.fecha_inicio_org,"DD-MM-YYYY").toDate(),
        fecha_fin_org: moment(this.fecha_fin_org,"DD-MM-YYYY").toDate(),
        fecha_inicio_new: moment(this.data.activity.FechaInicio,"DD-MM-YYYY").toDate(),
        fecha_fin_new: moment(this.data.activity.FechaFin,"DD-MM-YYYY").toDate(),
      });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  regresar() {
    this.dialogRef.close();
  }

  guardar() {
    if (this.select_proyectos_act) {
      let selected_deps = this.SelectorDeps.controls['Dependencias'].value;
      let updated_deps = this.buildJSONdeps(this.data.activity.DependenciaId,selected_deps)
      this.dialogRef.close({UpdateDependencias: updated_deps})
    }
    if(this.editar_actividad){
      this.data.activity.DependenciaId.fechas.forEach((fd: { Id: any; Inicio: string; Fin: string; Modificacion: string; }) => {
        if(fd.Id == this.data.dependencia){
          fd.Inicio = moment(this.ActivityEditor.controls['fecha_inicio_new'].value, 'America/Bogota').format('YYYY-MM-DDTHH:mm:ss[Z]');
          fd.Fin = moment(this.ActivityEditor.controls['fecha_fin_new'].value, 'America/Bogota').format('YYYY-MM-DDTHH:mm:ss[Z]');
          fd.Modificacion = moment(new Date(), 'America/Bogota').format('YYYY-MM-DDTHH:mm:ss[Z]');
        }
        console.log("ver fechas que quedaron: ", fd)
      });
      this.dialogRef.close({UpdateDependencias: this.data.activity.DependenciaId})
    }
  }

  createTable() {
    this.settings = {
      columns: {
        ProyectoCurricular: {
          title: this.translate.instant('calendario.proyecto_curricular'),
          editable: false,
          width: '40%',
          filter: false,
        },
        FechaInicio: {
          title: this.translate.instant('calendario.fecha_inicio'),
          editable: false,
          width: '20%',
          filter: false,
        },
        FechaFin: {
          title: this.translate.instant('calendario.fecha_fin'),
          editable: false,
          width: '20%',
          filter: false,
        },
        FechaEdicion: {
          title: this.translate.instant('calendario.fecha_edicion'),
          editable: false,
          width: '20%',
          filter: false,
        },
      },
      mode: 'external',
      actions: false,
      noDataMessage: this.translate.instant('calendario.sin_proyectos_actividades')
    };
  }

  createTable2(){
    this.settings2 ={
      columns: {
        Nombre: {
          title: this.translate.instant('GLOBAL.nombre'),
          editable: false,
          width: '40%',
          filter: false,
        },
      },
      mode: 'external',
      actions: false,
      noDataMessage: this.translate.instant('calendario.sin_responsables')
    };
  }

  

  buildJSONdeps(OrgDeps: any, NewSelect: Number[]) {
    let output: any[] = [];
    NewSelect.forEach(sel => {
      let fe = OrgDeps.fechas.find((f: { Id: Number; }) => f.Id == sel)
      if (fe == undefined) {
        fe = { 
          Id: sel, 
          Inicio: momentTimezone.tz(moment(this.data.activity.FechaInicio,"DD-MM-YYYY").toDate(), 'America/Bogota').format('YYYY-MM-DDTHH:mm:ss[Z]'),
          Fin: momentTimezone.tz(moment(this.data.activity.FechaFin,"DD-MM-YYYY").toDate(), 'America/Bogota').format('YYYY-MM-DDTHH:mm:ss[Z]'), 
          Modificacion: momentTimezone.tz(new Date(), 'America/Bogota').format('YYYY-MM-DDTHH:mm:ss[Z]'), 
          Activo: true
        }
      }
      output.push(fe)
    })
    OrgDeps.proyectos = NewSelect;
    OrgDeps.fechas = output;
    return OrgDeps
  }



}
