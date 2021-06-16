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

/* Countdown settings */
const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = 10;
const ALERT_THRESHOLD = 5;

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  let seconds = time % 60;

  if (seconds < 10) {
    seconds = `0${seconds}`;
  }

  return `${minutes}:${seconds}`;
};

const COLOR_CODES = {
  info: {
    color: "green",
  },
  warning: {
    color: "orange",
    threshold: WARNING_THRESHOLD,
  },
  alert: {
    color: "red",
    threshold: ALERT_THRESHOLD,
  },
};

const TIME_LIMIT = 30;
let timePassed = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;
let remainingPathColor = COLOR_CODES.info.color;
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
  justify-content: flex-start;
  align-items:center;
  flex-direction: column;
}
body {
  font-family: sans-serif;
  display: grid;
  height: 100vh;
  place-items: center;
}

.base-timer {
  position: relative;
  width: 300px;
  height: 300px;
}

.base-timer__svg {
  transform: scaleX(-1);
}

.base-timer__circle {
  fill: none;
  stroke: none;
}

.base-timer__path-elapsed {
  stroke-width: 7px;
  stroke: grey;
}

.base-timer__path-remaining {
  stroke-width: 7px;
  stroke-linecap: round;
  transform: rotate(90deg);
  transform-origin: center;
  transition: 1s linear all;
  fill-rule: nonzero;
  stroke: currentColor;
}

.base-timer__path-remaining.green {
  color: rgb(65, 184, 131);
}

.base-timer__path-remaining.orange {
  color: orange;
}

.base-timer__path-remaining.red {
  color: red;
}

.base-timer__label {
  position: absolute;
  width: 300px;
  height: 300px;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

</style>
<div class="runt-container">
<!--
  <h1> Resolviendo captcha, por favor espera </h1>
  <p> Tiempo de espera aproximado: 30 segundos </p>
  <div id="app">
  <div class="base-timer">
        <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <g class="base-timer__circle">
            <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45"></circle>
            <path
              id="base-timer-path-remaining"
              stroke-dasharray="283"
              class="base-timer__path-remaining ${remainingPathColor}"
              d="
                M 50, 50
                m -45, 0
                a 45,45 0 1,0 90,0
                a 45,45 0 1,0 -90,0
              "
            ></path>
          </g>
        </svg>
        <span id="base-timer-label" class="base-timer__label">${formatTime(
          timeLeft
        )}</span>
      </div></div>
      -->
</div>
</html>`;
/* Script with countdown */
let countdown = document.createElement("script");
countdown.src =
  "https://raw.githubusercontent.com/ImJesusDev/indra-electron/develop/assets/js/countdown.js";
/* Method to log events  */
const logEvent = async (message) => {
  ipc.sendTo(1, "logEvent", message);
};

/* Receive data for request */
ipc.on("runt-form-data", async (event, props) => {
  userDocument = props.documentNumber;
  userVehiclePlate = props.plate;
  userDocumentType = props.documentType;
  procedencia = props.procedencia == "Si" ? "EXTRANJERO" : "NACIONAL";
});

/* On page load, replace html and insert scripts */
document.addEventListener(
  "DOMContentLoaded",
  async (event) => {
    window.ipc = ipc;

    window.onTimesUp = () => {
      clearInterval(timerInterval);
    };

    window.startTimer = () => {
      timerInterval = setInterval(() => {
        timePassed = timePassed += 1;
        timeLeft = TIME_LIMIT - timePassed;
        document.getElementById("base-timer-label").innerHTML =
          formatTime(timeLeft);
        setCircleDasharray();
        setRemainingPathColor(timeLeft);

        if (timeLeft === 0) {
          onTimesUp();
          timePassed = 0;
          timeLeft = TIME_LIMIT;
          startTimer();
        }
      }, 1000);
    };

    window.formatTime = (time) => {
      const minutes = Math.floor(time / 60);
      let seconds = time % 60;

      if (seconds < 10) {
        seconds = `0${seconds}`;
      }

      return `${minutes}:${seconds}`;
    };

    window.setRemainingPathColor = (timeLeft) => {
      const { alert, warning, info } = COLOR_CODES;
      if (timeLeft <= alert.threshold) {
        document
          .getElementById("base-timer-path-remaining")
          .classList.remove(warning.color);
        document
          .getElementById("base-timer-path-remaining")
          .classList.add(alert.color);
      } else if (timeLeft <= warning.threshold) {
        document
          .getElementById("base-timer-path-remaining")
          .classList.remove(info.color);
        document
          .getElementById("base-timer-path-remaining")
          .classList.add(warning.color);
      }
    };

    window.calculateTimeFraction = () => {
      const rawTimeFraction = timeLeft / TIME_LIMIT;
      return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
    };

    window.setCircleDasharray = () => {
      const circleDasharray = `${(
        calculateTimeFraction() * FULL_DASH_ARRAY
      ).toFixed(0)} 283`;
      document
        .getElementById("base-timer-path-remaining")
        .setAttribute("stroke-dasharray", circleDasharray);
    };

    ipc.on("captcha-response", async (event, props) => {
      console.log("captcha response", props);
      /* Function to call when captche is solved */
      let params = {
        tipoDocumento: userDocumentType,
        procedencia: procedencia,
        tipoConsulta: "1",
        vin: null,
        noDocumento: procedencia == "EXTRANJERO" ? null : userDocument,
        noPlaca: userVehiclePlate,
        soat: null,
        codigoSoat: null,
        rtm: null,
        captcha: props,
      };
      await makeRuntRequest(params);
    });

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
        return {
          state: parsedResponse.data[0].estado,
          date: parsedResponse.data[0].fechaVencimiento,
          poliza: parsedResponse.data[0].noPoliza,
          entidad: parsedResponse.data[0].entidadExpideSoat,
        };
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
      let lastRequestState = "N/A";
      let lastRequestEntity = "N/A";
      let lastRequestDate = "N/A";
      console.log(solicitudResponse);
      if (!solicitudResponse.data) {
        return { lastRequestState, lastRequestEntity, lastRequestDate, type };
      }
      let replacedResponse = solicitudResponse.data.replace(")]}'", "");
      let parsedResponse = JSON.parse(replacedResponse);
      logEvent(`[RUNT] Respuesta: ${JSON.stringify(parsedResponse)}`);

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
      logEvent(`[RUNT] Respuesta: ${JSON.stringify(replacedResponse)}`);
      let parsedResponse = JSON.parse(replacedResponse);
      if (parsedResponse.error) {
        ipc.sendTo(1, "runt-error", { message: parsedResponse.mensajeError });
        return;
      }
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
        tipoCarroceria:
          parsedResponse.informacionGeneralVehiculo.tipoCarroceria,
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
        tipoCarroceria: parsedResponse.informacionGeneralVehiculo.tipoCarroceria
          ? parsedResponse.informacionGeneralVehiculo.tipoCarroceria
          : "",
        organismoTransito: parsedResponse.informacionGeneralVehiculo
          .organismoTransito
          ? parsedResponse.informacionGeneralVehiculo.organismoTransito
          : "",
        clasicoAntiguo: parsedResponse.informacionGeneralVehiculo.clasicoAntiguo
          ? parsedResponse.informacionGeneralVehiculo.clasicoAntiguo
          : "",
        puertas: parsedResponse.informacionGeneralVehiculo.puertas
          ? parsedResponse.informacionGeneralVehiculo.puertas
          : "",
        CantPuertas: parsedResponse.informacionGeneralVehiculo.CantPuertas
          ? parsedResponse.informacionGeneralVehiculo.CantPuertas
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
          // html.appendChild(countdown);
        } catch (error) {
          setHtml();
        }
      }, 100);
    };
    setHtml();
    startTimer();
  },
  false
);
