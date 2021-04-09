const { ipcRenderer: ipc } = require("electron");
const axios = require("axios");
const urlRunt =
  "https://www.runt.com.co/consultaCiudadana/publico/automotores/";
/* Initialize received values */
let userDocument;
let userVehiclePlate;
let userDocumentType;
/* Declare global variables */
let html;
/* Html to replace RUNT page */
let htmlCode = `
<style>
.runt-container {
  display:flex;
  height: calc(100vh - 130px);
  justify-content: center;
  align-items:center;
}
</style>
<div class="runt-container">
  <form action="?" method="POST">
    <div id="html_element"></div>
  </form>
</div>`;

/* Script with captcha */
let captchaScript = document.createElement("script");
captchaScript.src =
  "https://www.google.com/recaptcha/api.js?onload=onloadCallback&hl=es-149";

/* Method to log events  */
const logEvent = async (message) => {
  ipc.sendTo(1, "logEvent", message);
};

/* Receive data for request */
ipc.on("runt-form-data", async (event, props) => {
  userDocument = props.documentNumber;
  userVehiclePlate = props.plate;
  userDocumentType = props.documentType;
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

    /* Function to call when captche is solved */
    window.verifyCallback = async function (response) {
      let params = {
        tipoDocumento: userDocumentType,
        procedencia: "NACIONAL",
        tipoConsulta: "1",
        vin: null,
        noDocumento: userDocument,
        noPlaca: userVehiclePlate,
        soat: null,
        codigoSoat: null,
        rtm: null,
        captcha: response,
      };
      console.log(params);
      logEvent("Consultando datos");
      logEvent(JSON.stringify(params));
      let runtResponse = await axios.post(
        `${urlRunt}?${new Date().getMilliseconds()}`,
        params
      );
      console.log(runtResponse);
    };

    /* Callback to replace runt html */
    window.setHtml = () => {
      setTimeout(() => {
        try {
          html = document.querySelector(
            "body > div:nth-child(2) > div > div.col-lg-12.ng-scope"
          );
          html.innerHTML = htmlCode;
          html.appendChild(captchaScript);
        } catch (error) {
          console.log("retry html");
          setHtml();
        }
      }, 100);
    };
    setHtml();
  },
  false
);
