/**
 * Ordena una lista de objetos por una propiedad específica en orden ascendente o descendente.
 * @param {any[]} data - La lista de objetos que se va a ordenar.
 * @param {string} propiedad - La propiedad por la cual se va a ordenar la lista.
 * @param {1 | -1} orden - El orden de la clasificación (1 para ascendente, -1 para descendente).
 * @returns {any[]} - La lista ordenada.
 */
export function ordenarPorPropiedad(data: any[], propiedad: string, orden: 1 | -1): any[] {
    return data.sort((a: any, b: any) => {
      const valorA = a[propiedad];
      const valorB = b[propiedad];
      if (valorA < valorB) return -1 * orden;
      if (valorA > valorB) return 1 * orden;
      return 0;
    });
  }
  