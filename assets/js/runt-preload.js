const { ipcRenderer: ipc } = require("electron");
const axios = require("axios");
const urlRunt =
  "https://www.runt.com.co/consultaCiudadana/publico/automotores/";
const urlSolicitudes =
  "https://www.runt.com.co/consultaCiudadana/publico/automotores/solicitudes";
const urlDatosTecnicos =
  "https://www.runt.com.co/consultaCiudadana/publico/automotores/datosTecnicos";
const urlSoat =
  "https://www.runt.com.co/consultaCiudadana/publico/automotores/soats";
const urlBlindaje =
  "https://www.runt.com.co/consultaCiudadana/publico/automotores/blindaje";
const urlCertificaciones =
  "https://www.runt.com.co/consultaCiudadana/publico/automotores/rtms";
/* Initialize received values */
let userDocument;
let userVehiclePlate;
let userDocumentType;
let procedencia;
/* Declare global variables */
let html;
/* Html to replace RUNT page */
let htmlCode = `<html>
<style>
.runt-container {
  display:flex;
  height: calc(100vh - 130px);
  justify-content: center;
  align-items:center;
  flex-direction: column;
}
</style>
<div class="runt-container">
  <h1> Solucione el captcha para continuar. </h1>
  <form action="?" method="POST">
    <div id="html_element"></div>
  </form>
</div>`;

/* Script with captcha */
let captchaScript = document.createElement("script");
captchaScript.src =
  "https://www.google.com/recaptcha/api.js?onload=onloadCallback&hl=es-149&render=explicit";

/* Method to log events  */
const logEvent = async (message) => {
  ipc.sendTo(1, "logEvent", message);
};

/* Receive data for request */
ipc.on("runt-form-data", async (event, props) => {
  userDocument = props.documentNumber;
  userVehiclePlate = props.plate;
  userDocumentType = props.documentType;
  procedencia = props.procedencia == "Si" ? "EXTRANJERA" : "NACIONAL";
});

/* On page load, replace html and insert scripts */
document.addEventListener(
  "DOMContentLoaded",
  async (event) => {
    window.ipc = ipc;
    /* Callback to load new captcha */
    window.onloadCallback = function () {
      grecaptcha.render("html_element", {
        sitekey: "6LcPh1EUAAAAAIscNcV6Ru2ZEtoUIgvUn3pCXFcV",
        callback: verifyCallback,
      });
    };
    /* Callback to send events to renderer */
    window.logEvent = async (message) => {
      ipc.sendTo(1, "logEvent", message);
    };
    /* Function to send data to renderer */
    window.sendData = async (type, data) => {
      const dataToSend = {
        type: type,
        data: data,
      };
      ipc.sendTo(1, "vehicleData", dataToSend);
    };

    /* Function to call when captche is solved */
    window.verifyCallback = async function (response) {
      let params = {
        tipoDocumento: userDocumentType,
        procedencia: procedencia,
        tipoConsulta: "1",
        vin: null,
        noDocumento: userDocument,
        noPlaca: userVehiclePlate,
        soat: null,
        codigoSoat: null,
        rtm: null,
        captcha: response,
      };
      await makeRuntRequest(params);
    };
    /* Function to load soat info */
    window.makeSoatRequest = async function (params, token) {
      logEvent("[RUNT] Consultando datos SOAT");
      let config = {
        headers: {
          "Accept-Data": btoa(JSON.stringify(params)),
          Authorization: `Bearer ${token}`,
        },
      };
      let solicitudResponse = await axios.get(
        `${urlSoat}?${new Date().getMilliseconds()}`,
        config
      );
      let replacedResponse = solicitudResponse.data.replace(")]}'", "");
      let parsedResponse = JSON.parse(replacedResponse);
      logEvent(`[RUNT] Respuesta: ${JSON.stringify(parsedResponse)}`);
      if (parsedResponse.data && parsedResponse.data.length) {
        return parsedResponse.data[0].estado;
      }
      return "N/A";
    };
    /* Function to load certifications info */
    window.makeCertificationsRequest = async function (params, token) {
      logEvent("[RUNT] Consultando información de certificaciones");
      let config = {
        headers: {
          "Accept-Data": btoa(JSON.stringify(params)),
          Authorization: `Bearer ${token}`,
        },
      };
      let solicitudResponse = await axios.get(
        `${urlCertificaciones}?${new Date().getMilliseconds()}`,
        config
      );
      let replacedResponse = solicitudResponse.data.replace(")]}'", "");
      let parsedResponse = JSON.parse(replacedResponse);
      logEvent(`[RUNT] Respuesta: ${JSON.stringify(parsedResponse)}`);
      let expiration = "";
      let active = "";
      let type = "";
      if (parsedResponse.data && parsedResponse.data.length) {
        expiration = parsedResponse.data[0].fechaVigente;
        active = parsedResponse.data[0].vigente;
        type = parsedResponse.data[0].tipoRevision;
      }
      return {
        expiration,
        active,
        type,
      };
    };
    /* Function to armored info */
    window.makeArmoredRequest = async function (params, token) {
      logEvent(`[RUNT] Consultando informacion de blindaje`);
      let config = {
        headers: {
          "Accept-Data": btoa(JSON.stringify(params)),
          Authorization: `Bearer ${token}`,
        },
      };
      let solicitudResponse = await axios.get(
        `${urlBlindaje}?${new Date().getMilliseconds()}`,
        config
      );
      let replacedResponse = solicitudResponse.data.replace(")]}'", "");
      let parsedResponse = JSON.parse(replacedResponse);
      logEvent(`[RUNT] Respuesta: ${JSON.stringify(parsedResponse)}`);
      let isArmored = parsedResponse.blindado ? parsedResponse.blindado : "";
      let armorLevel = parsedResponse.nivelBlindaje
        ? parsedResponse.nivelBlindaje
        : "";
      return { isArmored, armorLevel };
    };
    /* Function to load Technical info */
    window.makeTechnicalRequest = async function (params, token) {
      logEvent("[RUNT] Consultando informacion tecnica");
      let config = {
        headers: {
          "Accept-Data": btoa(JSON.stringify(params)),
          Authorization: `Bearer ${token}`,
        },
      };
      let solicitudResponse = await axios.get(
        `${urlDatosTecnicos}?${new Date().getMilliseconds()}`,
        config
      );
      let replacedResponse = solicitudResponse.data.replace(")]}'", "");

      let parsedResponse = JSON.parse(replacedResponse);
      logEvent(`[RUNT] Respuesta: ${JSON.stringify(parsedResponse)}`);
      let totalSeats = parsedResponse.pasajerosTotal
        ? parsedResponse.pasajerosTotal
        : "0";

      let totalLoad = parsedResponse.capacidadCarga
        ? parsedResponse.capacidadCarga
        : "";

      let totalWeight = parsedResponse.pesoBrutoVehicular
        ? parsedResponse.pesoBrutoVehicular
        : "";

      let totalAxis = parsedResponse.noEjes ? parsedResponse.noEjes : "";
      let totalPassengers = parsedResponse.pasajerosSentados
        ? parsedResponse.pasajerosSentados
        : "";

      return { totalSeats, totalLoad, totalWeight, totalAxis, totalPassengers };
    };
    /* Function to load last requests info */
    window.makeRequestsSearch = async function (params, token) {
      logEvent("[RUNT] Consultando ultimas solicitudes del vehículo");
      let config = {
        headers: {
          "Accept-Data": btoa(JSON.stringify(params)),
          Authorization: `Bearer ${token}`,
        },
      };
      let solicitudResponse = await axios.get(
        `${urlSolicitudes}?${new Date().getMilliseconds()}`,
        config
      );
      let replacedResponse = solicitudResponse.data.replace(")]}'", "");
      let parsedResponse = JSON.parse(replacedResponse);
      logEvent(`[RUNT] Respuesta: ${JSON.stringify(parsedResponse)}`);
      let lastRequestState = "N/A";
      let lastRequestEntity = "N/A";
      let lastRequestDate = "N/a";
      let type = "No hay trámites de revisión tecnicomecánica";
      for (const tramite of parsedResponse.data) {
        if (
          tramite.tramitesRealizados == "Tramite revision tecnico mecanica, "
        ) {
          type = "Tramite revision tecnico mecanica";
          lastRequestState = tramite.estado;
          lastRequestEntity = tramite.entidad;
          lastRequestDate = tramite.fechaSolicitud;
        }
      }
      return { lastRequestState, lastRequestEntity, lastRequestDate, type };
    };
    /* Function to make the initial request */
    window.makeRuntRequest = async function (params) {
      logEvent("[RUNT] Consultando datos del vehículo");
      logEvent(JSON.stringify(params));
      let config = {
        headers: {
          "Accept-Data": btoa(JSON.stringify(params)),
        },
      };
      let runtResponse = await axios.post(
        `${urlRunt}?${new Date().getMilliseconds()}`,
        params,
        config
      );
      let replacedResponse = runtResponse.data.replace(")]}'", "");
      let parsedResponse = JSON.parse(replacedResponse);
      logEvent(`[RUNT] Respuesta: ${JSON.stringify(parsedResponse)}`);
      let token = parsedResponse.token;
      await sendData("vehicleInfo", {
        chasisNumber: parsedResponse.informacionGeneralVehiculo.noChasis,
        cylinderCapacity: parsedResponse.informacionGeneralVehiculo.cilidraje,
        plateDate: parsedResponse.informacionGeneralVehiculo.fechaMatricula,
        make: parsedResponse.informacionGeneralVehiculo.marca,
        model: parsedResponse.informacionGeneralVehiculo.modelo,
        line: parsedResponse.informacionGeneralVehiculo.linea,
        color: parsedResponse.informacionGeneralVehiculo.color,
        state: parsedResponse.informacionGeneralVehiculo.estadoDelVehiculo,
        license: parsedResponse.informacionGeneralVehiculo.noLicenciaTransito,
        vehicleClass: parsedResponse.informacionGeneralVehiculo.claseVehiculo,
        serviceType: parsedResponse.informacionGeneralVehiculo.tipoServicio,
        motorNumber: parsedResponse.informacionGeneralVehiculo.noMotor,
        fuelType: parsedResponse.informacionGeneralVehiculo.tipoCombustible,
        vinNumber: parsedResponse.informacionGeneralVehiculo.noVin,
        procedencia: procedencia,
        serieNumber: parsedResponse.informacionGeneralVehiculo.noSerie,
      });

      let lastRequestInfo = await makeRequestsSearch(params, token);
      let soatInfo = await makeSoatRequest(params, token);
      let technicalData = await makeTechnicalRequest(params, token);
      let armoredInfo = await makeArmoredRequest(params, token);
      let certificationsInfo = await makeCertificationsRequest(params, token);
      await sendData("done", {
        chasisNumber: parsedResponse.informacionGeneralVehiculo.noChasis
          ? parsedResponse.informacionGeneralVehiculo.noChasis
          : "",
        cylinderCapacity: parsedResponse.informacionGeneralVehiculo.cilidraje
          ? parsedResponse.informacionGeneralVehiculo.cilidraje
          : "",
        plateDate: parsedResponse.informacionGeneralVehiculo.fechaMatricula
          ? parsedResponse.informacionGeneralVehiculo.fechaMatricula
          : "",
        make: parsedResponse.informacionGeneralVehiculo.marca
          ? parsedResponse.informacionGeneralVehiculo.marca
          : "",
        model: parsedResponse.informacionGeneralVehiculo.modelo
          ? parsedResponse.informacionGeneralVehiculo.modelo
          : "",
        line: parsedResponse.informacionGeneralVehiculo.linea
          ? parsedResponse.informacionGeneralVehiculo.linea
          : "",
        color: parsedResponse.informacionGeneralVehiculo.color
          ? parsedResponse.informacionGeneralVehiculo.color
          : "",
        state: parsedResponse.informacionGeneralVehiculo.estadoDelVehiculo
          ? parsedResponse.informacionGeneralVehiculo.estadoDelVehiculo
          : "",
        license: parsedResponse.informacionGeneralVehiculo.noLicenciaTransito
          ? parsedResponse.informacionGeneralVehiculo.noLicenciaTransito
          : "",
        vehicleClass: parsedResponse.informacionGeneralVehiculo.claseVehiculo
          ? parsedResponse.informacionGeneralVehiculo.claseVehiculo
          : "",
        serviceType: parsedResponse.informacionGeneralVehiculo.tipoServicio
          ? parsedResponse.informacionGeneralVehiculo.tipoServicio
          : "",
        motorNumber: parsedResponse.informacionGeneralVehiculo.noMotor
          ? parsedResponse.informacionGeneralVehiculo.noMotor
          : "",
        fuelType: parsedResponse.informacionGeneralVehiculo.tipoCombustible
          ? parsedResponse.informacionGeneralVehiculo.tipoCombustible
          : "",
        vinNumber: parsedResponse.informacionGeneralVehiculo.noVin
          ? parsedResponse.informacionGeneralVehiculo.noVin
          : "",
        procedencia: procedencia,
        serieNumber: parsedResponse.informacionGeneralVehiculo.noSerie
          ? parsedResponse.informacionGeneralVehiculo.noSerie
          : "",
        certifications: certificationsInfo,
        armoredInfo,
        lastRequest: lastRequestInfo,
        technicalData,
        soat: soatInfo,
      });
    };

    /* Callback to replace runt html */
    window.setHtml = () => {
      setTimeout(() => {
        try {
          html = document.querySelector("body");
          html.innerHTML = htmlCode;
          html.appendChild(captchaScript);
        } catch (error) {
          setHtml();
        }
      }, 100);
    };
    setHtml();
  },
  false
);
