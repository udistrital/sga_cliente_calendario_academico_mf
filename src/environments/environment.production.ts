/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const environment = {
    production: false,
    apiUrl:"",
    NUXEO: {
      PATH: 'https://documental.portaloas.udistrital.edu.co/nuxeo/',
      CREDENTIALS: {
        USERNAME: 'xxx',
        PASS: 'xxx',
  
      },
    },
    NUXEO_SERVICE:'https://autenticacion.portaloas.udistrital.edu.co/apioas/gestor_documental_mid/v1',
    CONFIGURACION_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/configuracion_crud_api/v1/',
    NOTIFICACION_SERVICE: 'wss://pruebasapi.portaloas.udistrital.edu.co:8116/ws',
    CONF_MENU_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/configuracion_crud_api/v1/menu_opcion_padre/ArbolMenus/',
    TOKEN: {
      AUTORIZATION_URL: 'https://autenticacion.portaloas.udistrital.edu.co/oauth2/authorize',
      CLIENTE_ID: 'Mg40MfT62GA_vcPMIJurpX3pzx4a',
      RESPONSE_TYPE: 'id_token token',
      SCOPE: 'openid email role documento',
      REDIRECT_URL: 'https://sga.portaloas.udistrital.edu.co',
      SIGN_OUT_URL: 'https://autenticacion.portaloas.udistrital.edu.co/oidc/logout',
      SIGN_OUT_REDIRECT_URL: 'https://sga.portaloas.udistrital.edu.co',
      AUTENTICACION_MID: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/autenticacion_mid/v1/token/userRol',
    },
    TERCEROS_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/terceros_crud/v1/',
    PERSONA_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/personas_crud/v1/',
    PRODUCCION_ACADEMICA_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/produccion_academica_crud/v2/',
    DOCUMENTO_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/documento_crud/v2/',
    CAMPUS_MID: 'http://localhost:8095/v1/',
    SPAGOBI: {
      PROTOCOL: 'https',
      HOST: 'inteligenciainstitucional.portaloas.udistrital.edu.co',
      PORT: '443',
      CONTEXTPATH: 'knowage',
      USER: 'desarrollooas',
      PASSWORD: 'desarrollooas',
      TIPO_REPORTE: 'Prod',
    },
    CORE_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/core_crud/v1/',
    EVENTO_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/sesiones_crud/v2/',
    OIKOS_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/oikos_crud_api/v1/',
    PROYECTO_ACADEMICO_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/proyecto_academico_crud/v1/',
    SGA_MID_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/sga_mid/v1/',
    CLIENTE_HABILITAR_PERIODO_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/core_crud/v1/',
    OFERTA_ACADEMICA_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/sesiones_crud/v1/',
    INSCRIPCION_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/inscripcion_crud/v2/',
    UBICACION_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/ubicaciones_crud/v2/',
    DOCUMENTO_PROGRAMA_SERVICE: 'https://autenticacion.udistrital.edu.co/apioas/documento_programa_crud/v1/',
    EXPERIENCIA_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/experiencia_laboral_crud/v1/',
    FORMACION_ACADEMICA_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/formacion_academica_crud/v1/',
    IDIOMA_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/idiomas_crud/v2/',
    DESCUENTO_ACADEMICO_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/matriculas_descuentos_crud/v2/',
    CIDC_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/siciud_crud/v1/',
    EVALUACION_INSCRIPCION_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/evaluacion_inscripcion_crud/v2/',
    PARAMETROS_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/parametros/v1/',
    PSE_SERVICE: 'https://funcionarios.portaloas.udistrital.edu.co/botonPago/index.php?',
    GOOGLE_MID_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/google_mid/v1/',
    ESPACIOS_ACADEMICOS_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/espacios_academicos_crud/v1/',
    PLAN_TRABAJO_DOCENTE_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/plan_trabajo_docente_crud/v1/',
    PLAN_ESTUDIOS_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/planes_estudios_crud/v1/',
  };
  