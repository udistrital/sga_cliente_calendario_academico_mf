import { Tercero } from "./tercero";

export class Vinculacion {
  Id!: number;
  TerceroPrincipalId!: Tercero;
  TerceroRelacionadoId!: Tercero;
  CargoId!: number;
  DependenciaId!: number;
  Soporte!: number;
  PeriodoId!: number;
  FechaInicioVinculacion!: Date;
  FechaFinVinculacion!: Date;
}
