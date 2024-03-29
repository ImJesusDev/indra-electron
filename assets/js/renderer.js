/**
 * MAIN RENDERER PROCESS
 *
 * NOTE: Some unused code is intentionally left as a comment
 * to keep as reference
 */

/* IPC */
const { ipcRenderer: ipc } = require("electron");
/* Alerts */
const Swal = require("sweetalert2");
/* Axios */
const axios = require("axios");
const moment = require("moment");
/* Runt */
const runtWebview = document.getElementById("runt-webview");
/* Paynet */
const paynetWebview = document.getElementById("paynet-webview");
/* Sicre */
const sicreWebview = document.getElementById("sicre-webview");
/* Crypto */
var CryptoJS = require("crypto-js");
/* Secret key  */
const secretKey = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
const antiCaptchaApiKey = "50bb0b32a8cee2c946b633b8d4cc73aa";
const captchaSiteKey = "6LcPh1EUAAAAAIscNcV6Ru2ZEtoUIgvUn3pCXFcV";
let timer;
/* Logger */
const log = require("electron-log");
/* 2 Captcha package */
// const Captcha = require("2captcha");
const messages = [
  "Ingresando a los datos del vehículo ",
  "Consultando información de interés ",
  "Completando información ",
];
let currentMessage = 0;
const ac = require("@antiadmin/anticaptchaofficial");
ac.setAPIKey(antiCaptchaApiKey);
ac.getBalance()
  .then((balance) => console.log("my balance is $" + balance))
  .catch((error) => console.log("received error " + error));

const stopTimer = () => {
  console.log("clear timer");
  clearInterval(timer);
};
/* Function to solve captcha */
const solveCaptcha = async () => {
  stopTimer();
  currentMessage = 0;
  $("#status-report").css("display", "flex");
  $("#status-report").addClass("full");
  $("#status-report").html("");
  var statusContent = `<span>${messages[currentMessage]}</span>`;
  $("#status-report").append(statusContent);
  currentMessage++;
  timer = setInterval(() => {
    if (currentMessage === messages.length) {
      stopTimer();
      Swal.fire({
        title: "Error en consulta, por favor intente de nuevo",
        icon: "warning",
        showCancelButton: false,
        showDenyButton: false,
        confirmButtonColor: "#79c5b4",
        confirmButtonText: "Aceptar",
      }).then(async (result) => {
        if (result.isConfirmed) {
          resetForm();
          // sicreWebview.send("logOut", true);
          $("#initial-form").css("display", "flex");
          $("#status-report").html("");
          $("#status-report").hide();
          $("#progress-bar").show();
          $("#failed-revisions").hide();
          $("#runt-webview").hide();
          $("#runt-step").removeClass("current");
          $("#initial-step").addClass("current").removeClass("done");
        }
      });
    } else {
      $("#status-report").html("");
      var statusContent = `<span>${messages[currentMessage]}</span>`;
      $("#status-report").append(statusContent);
      currentMessage++;
    }
  }, 5000);
  log.info("Enviando solicitud captcha");
  ac.solveRecaptchaV2Proxyless(
    "https://www.runt.com.co/consultaCiudadana/#/consultaVehiculo",
    captchaSiteKey
  )
    .then((gresponse) => {
      stopTimer();
      log.info("Respuesta servicio captcha");
      log.info(gresponse);
      runtWebview.send("captcha-response", gresponse);
    })
    .catch((error) => {
      console.log("test received error " + error);
    });
};

let currentSicreState;
let currentPaynetState;

paynetWebview.addEventListener("did-stop-loading", async (event) => {
  if (currentPaynetState.indexOf("login") >= 0) {
    // await checkPaynetCredentials();
    // paynetWebview.send('checkForErrors', true);
  }
  if (
    currentPaynetState.indexOf("VentaPin") >= 0 &&
    currentPaynetState.indexOf("login") < 0
  ) {
    paynetWebview.send("add-listeners", true);
  }
  if (currentPaynetState.indexOf("InformacionSeguridad") >= 0) {
    paynetWebview.send("navigate-to-pin", true);
  }
});

paynetWebview.addEventListener("did-navigate", (event) => {
  currentPaynetState = event.url;
});
const togglePassword = (value) => {
  if (value == "paynet") {
    const paynetPassword = $("#paynet-password");
    paynetPassword.attr("type") === "password"
      ? paynetPassword.attr("type", "text")
      : paynetPassword.attr("type", "password");
  } else if (value === "sicov") {
    const sicovPassword = $("#sicov-password");
    sicovPassword.attr("type") === "password"
      ? sicovPassword.attr("type", "text")
      : sicovPassword.attr("type", "password");
  }
};
/* Capture navigation events */
sicreWebview.addEventListener("did-stop-loading", (event) => {
  if (currentSicreState == "login") {
    const username = localStorage.getItem("sicov-username");
    const password = localStorage.getItem("sicov-password");
    let bytes = CryptoJS.AES.decrypt(password, secretKey);
    let descryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
    const data = {
      username: username,
      password: descryptedPassword,
    };
  }
  if (currentSicreState == "enter-plate") {
    const plate = localStorage.getItem("plate");
    const revisionType = localStorage.getItem("revision-type");
    const vehicleType = localStorage.getItem("vehicle-type");
    const documentNumber = localStorage.getItem("document-number");
    const documentType = localStorage.getItem("document-type");
    const pinNumber = localStorage.getItem("pin-number");
    const pinValue = localStorage.getItem("pin-value");
    const foreignVehicle = localStorage.getItem("foreign-vehicle");
    const data = {
      plate: plate,
      revisionType: revisionType,
      vehicleType: vehicleType,
      documentType: documentType,
      documentNumber: documentNumber,
      pinNumber: pinNumber,
      pinValue: pinValue,
      foreignVehicle: foreignVehicle,
    };
    sicreWebview.send("enter-plate", data);
    currentSicreState = "plate-entered";
  }
});
ipc.on("openConsole", (event, props) => {
  switch (props.platform) {
    case "RUNT":
      runtWebview.openDevTools();
      break;
    case "PAYNET":
      paynetWebview.openDevTools();
      break;
    case "SICOV":
      sicreWebview.openDevTools();
      break;

    default:
      break;
  }
});
ipc.on("reload", (event, props) => {
  showInitialForm();
});
ipc.on("info-entered", (event, props) => {
  $("#status-report").removeClass("full");
  $("#status-report").html("");
  var statusContent =
    '<span>Verifica la información y da clic en "Formalizar revisión"</span>';
  $("#status-report").append(statusContent);
  $("#status-report").css("display", "flex");
});
ipc.on("pleaseClickPay", (event, props) => {
  $("#status-report").html("");
  var statusContent = "<span>Finalizando...</span>";
  $("#status-report").append(statusContent);
  $("#status-report").css("display", "flex");
  $("#status-report").addClass("full");
});

ipc.on("paynetLoginError", (event, props) => {
  $("#status-report").html("");
  var statusContent =
    "<span>Por favor verifique sus credenciales, y haga click en enviar!</span>";
  $("#status-report").append(statusContent);
  $("#status-report").css("display", "flex");
});
ipc.on("paynetConfirm", (event, props) => {
  let msg = props.msg;
  Swal.fire({
    title: "Confirmación",
    text: msg,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#79c5b4",
    cancelButtonColor: "#e88aa2",
    confirmButtonText: "Continuar",
    cancelButtonText: "Cancelar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      paynetWebview.send("pinConfirmation", true);
    } else {
      showInitialForm();
    }
  });
});

sicreWebview.addEventListener("did-navigate", (event) => {
  console.log("did-navigate", event.url);
  if (event.url.indexOf("Default") >= 0) {
    console.log("indexOf Default");
    currentSicreState = "login";
  } else if (event.url.indexOf("SeleccionarSucursal") >= 0) {
    $("#status-report").removeClass("full");
    $("#status-report").html("");
    var statusContent =
      "<span>Selecciona la sucursal a la cual pertenezcas</span>";
    $("#status-report").append(statusContent);
    $("#status-report").show();
    sicreWebview.send("sucursal-selection", true);
  } else if (event.url.indexOf("?Placa") >= 0) {
    $("#status-report").html("");
    var statusContent = "<span>Ingresando Información!</span>";
    $("#status-report").append(statusContent);
    $("#status-report").show();
    sicreWebview.send("input-form-data", true);
  } else if (event.url.indexOf("FormalizacionRevision") >= 0) {
    if (currentSicreState !== "plate-entered") {
      currentSicreState = "enter-plate";
    } else {
      // Revision finished
      // console.log("finished by url");
      // $("#status-report").css("display", "flex");
      // $("#status-report").html("");
      // var statusContent = "<span>¡Formalización realizada!</span>";
      // $("#status-report").append(statusContent);
      // setTimeout(() => {
      //   $("#status-report").html("");
      //   $("#status-report").hide();
      // }, 3000);
      // $("#paynet-step").removeClass("done");
      // $("#runt-step").removeClass("done");
      // $("#initial-step").addClass("current").removeClass("done");
      // $("#sicre-webview").hide();
      // $("#initial-form").show();
    }
  }
});

async function openSettings() {
  const { value: formValues } = await Swal.fire({
    title: "Ingresa la contraseña",
    html: `
        <div class="w-full">
            <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                        Clave
                    </label>
                    <input value="" required id="password" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************">
                </div>
            </form>
        </div>`,
    focusConfirm: false,
    cancelButtonText: "Cancelar",
    showCancelButton: true,
    cancelButtonColor: "#e88aa2",
    confirmButtonText: "Continuar",
    preConfirm: () => {
      return {
        password: document.getElementById("password").value,
      };
    },
  });

  if (formValues && formValues.password) {
    if (formValues.password !== "conectasicov2021*") {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Contraseña incorrecta`,
        confirmButtonText: "Cerrar",
      }).then(async () => {
        openSettings();
      });
    } else {
      setSettings();
    }
  }
}

const setSettings = async () => {
  let savedSicovUrl = localStorage.getItem("sicov-url");
  let savedSyncUrl = localStorage.getItem("sync-url");
  let savedCdaId = localStorage.getItem("id-cda");
  const { value: formValues } = await Swal.fire({
    title: "Ingresa la configuración.",
    html: `
        <div class="w-full">
            <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="url-sicov">
                        Url SICOV
                    </label>
                    <input value="${
                      savedSicovUrl ? savedSicovUrl : ""
                    }" required id="url-sicov" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" type="text" placeholder="Url SICOV">
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="sync-url">
                        Url de sincronización
                    </label>
                    <input value="${
                      savedSyncUrl ? savedSyncUrl : ""
                    }" required id="sync-url" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"  type="text" placeholder="Url de sincronización">
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="id-cda">
                        Id del CDA
                    </label>
                    <input value="${
                      savedCdaId ? savedCdaId : ""
                    }" required id="id-cda" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"  type="text" placeholder="Identificador del CDA">
                </div>
            </form>
        </div>`,
    focusConfirm: false,
    cancelButtonText: "Cancelar",
    showCancelButton: true,
    cancelButtonColor: "#e88aa2",
    confirmButtonText: "Guardar",
    preConfirm: () => {
      return {
        urlSicov: document.getElementById("url-sicov").value,
        syncUrl: document.getElementById("sync-url").value,
        idCda: document.getElementById("id-cda").value,
      };
    },
  });
  if (formValues) {
    if (formValues.idCda) {
      localStorage.setItem("id-cda", formValues.idCda);
    }
    if (formValues.syncUrl) {
      localStorage.setItem("sync-url", formValues.syncUrl);
    }
    if (formValues.urlSicov) {
      localStorage.setItem("sicov-url", formValues.urlSicov);
    }
  }
  sicovInputChange();
};

const askForCaptcha = async () => {
  const { value: formValues } = await Swal.fire({
    title: "Por favor, ingresa el texto de la imagen",
    position: "top-end",
    backdrop: false,
    html: `
                        <div class="w-full">
                            <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                                <div class="mb-4">
                                    <label class="block text-gray-700 text-sm font-bold mb-2" for="captcha">
                                        Texto
                                    </label>
                                    <input required id="captcha" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="pin" type="text" placeholder="Texto imagen">
                                </div>
                            </form>
                        </div>`,
    focusConfirm: false,
    preConfirm: () => {
      return {
        captcha: document.getElementById("captcha").value,
      };
    },
  });
  if (formValues && formValues.captcha) {
    runtWebview.send("imgCaptcha", formValues.captcha);
    stopTimer();
    currentMessage = 0;
    $("#status-report").css("display", "flex");
    $("#status-report").addClass("full");
    $("#status-report").html("");
    var statusContent = `<span>${messages[currentMessage]}</span>`;
    $("#status-report").append(statusContent);
    currentMessage++;
    timer = setInterval(() => {
      if (currentMessage === messages.length) {
        stopTimer();
        Swal.fire({
          title: "Error en consulta, por favor intente de nuevo",
          icon: "warning",
          showCancelButton: false,
          showDenyButton: false,
          confirmButtonColor: "#79c5b4",
          confirmButtonText: "Aceptar",
        }).then(async (result) => {
          if (result.isConfirmed) {
            resetForm();
            // sicreWebview.send("logOut", true);
            $("#initial-form").css("display", "flex");
            $("#status-report").html("");
            $("#status-report").hide();
            $("#progress-bar").show();
            $("#failed-revisions").hide();
            $("#runt-webview").hide();
            $("#runt-step").removeClass("current");
            $("#initial-step").addClass("current").removeClass("done");
          }
        });
      } else {
        $("#status-report").html("");
        var statusContent = `<span>${messages[currentMessage]}</span>`;
        $("#status-report").append(statusContent);
        currentMessage++;
      }
    }, 20000);
  }
};

function goToRunt() {
  $("#runt-webview").attr(
    "src",
    "https://www.runt.com.co/consultaCiudadana/#/consultaVehiculo"
  );
  setTimeout(async () => {
    $("#initial-form").hide();
    $("#runt-webview").show();

    // solveCaptcha();
    $("html,body").scrollTop(0);
    $("#initial-step").removeClass("current").addClass("done");
    $("#runt-step").addClass("current");
    /* Store the value of the selected vehicle type */
    const plate = $("#vehicle-plate").val();
    const foreignVehicle = $(
      "input[name=foreign-vehicle]:checked",
      "#revision-form"
    );
    const documentNumber = $("#document-number");
    const documentType = $("#document-type");
    const cellphone = $("#cellphone");
    const revisionType = $("#revision-type");
    const vehicleType = $("#vehicle-type-select");
    localStorage.setItem("vehicle-type", vehicleType.val());
    localStorage.setItem("foreign-vehicle", foreignVehicle.val());
    localStorage.setItem("plate", plate.toUpperCase());
    localStorage.setItem("document-number", documentNumber.val());
    localStorage.setItem("document-type", documentType.val());
    localStorage.setItem("cellphone", cellphone.val());
    localStorage.setItem("revision-type", revisionType.val());
    const formData = {
      plate: plate.toUpperCase(),
      documentType: documentType.val(),
      documentNumber: documentNumber.val(),
      procedencia: foreignVehicle.val(),
    };
    runtWebview.send("runt-form-data", formData);
    await askForCaptcha();
  }, 1000);
}

function sicovInputChange() {
  const sicovUsername = $("#sicov-username");
  const sicovPassword = $("#sicov-password");
  const paynetUsername = $("#paynet-username");
  const paynetPassword = $("#paynet-password");
  let savedSicovUrl = localStorage.getItem("sicov-url");
  let savedSyncUrl = localStorage.getItem("sync-url");
  let savedCdaId = localStorage.getItem("id-cda");
  if (
    sicovUsername.val() &&
    sicovPassword.val() &&
    paynetUsername.val() &&
    paynetPassword.val() &&
    savedSicovUrl &&
    savedSyncUrl &&
    savedCdaId
  ) {
    $("#sicov-btn-disabled").hide();
    $("#sicov-btn-enabled").show();
  } else {
    $("#sicov-btn-enabled").hide();
    $("#sicov-btn-disabled").show();
  }
}

function validateFields() {
  console.log("here");
  const plate = $("#vehicle-plate");
  const documentNumber = $("#document-number");
  const documentType = $("#document-type");
  const cellphone = $("#cellphone");
  const revisionType = $("#revision-type");
  const vehicleType = $("#vehicle-type-select");
  if (!plate.val()) {
    plate.focus();
    return false;
  }
  if (!documentType.val()) {
    $("#document-type").focus();
    return false;
  }
  if (!documentNumber.val()) {
    documentNumber.focus();
    return false;
  }

  if (!cellphone.val()) {
    cellphone.focus();
    return false;
  }
  if (!revisionType.val()) {
    $("#revision-type").focus();
    return false;
  }

  if (!vehicleType.val()) {
    vehicleType.focus();
    return false;
  }
}

function initialFormChange() {
  const plate = $("#vehicle-plate");
  const documentNumber = $("#document-number");
  const documentType = $("#document-type");
  const cellphone = $("#cellphone");
  const revisionType = $("#revision-type");
  const vehicleType = $("#vehicle-type-select");
  if (revisionType.val()) {
    $("#revision-type").addClass("is-dirty");
  } else {
    $("#revision-type").removeClass("is-dirty");
  }
  if (documentType.val()) {
    $("#document-type").addClass("color", "black");
  } else {
    $("#document-type").removeClass("is-dirty");
  }
  if (vehicleType.val()) {
    $("#vehicle-type-select").addClass("color", "black");
  } else {
    $("#vehicle-type-select").removeClass("is-dirty");
  }
  if (
    plate.val() &&
    documentNumber.val() &&
    cellphone.val() &&
    documentType.val() &&
    revisionType.val() &&
    vehicleType.val()
  ) {
    $("#continue-disabled").hide();
    $("#continue-img").show();
  } else {
    $("#continue-disabled").show();
    $("#continue-img").hide();
  }
}

function logout() {
  Swal.fire({
    title: "Cerrar sesión",
    text: "¿Desea finalizar la sesión?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#79c5b4",
    cancelButtonColor: "#e88aa2",
    confirmButtonText: "Cerrar",
    cancelButtonText: "Cancelar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      let sicovUsername = localStorage.getItem("sicov-username");
      let savedSicovUrl = localStorage.getItem("sicov-url");
      let savedSyncUrl = localStorage.getItem("sync-url");
      let paynetCredentials = localStorage.getItem("paynet-credentials");
      let savedCdaId = localStorage.getItem("id-cda");
      localStorage.clear();
      localStorage.setItem("sicov-username", sicovUsername);
      localStorage.setItem("sicov-url", savedSicovUrl);
      localStorage.setItem("sync-url", savedSyncUrl);
      localStorage.setItem("id-cda", savedCdaId);
      localStorage.setItem("paynet-credentials", paynetCredentials);
      $("#login-container").css("display", "flex");
      $("#form-container").hide();
      $("#progress-bar").show();
      $("#initial-form").css("display", "flex");
      $("#status-report").html("");
      $("#status-report").hide();
      $("#failed-revisions").hide();
      $("#runt-webview").hide();
      $("#paynet-webview").hide();
      $("#sicre-webview").hide();
      $("#paynet-step").removeClass("done");
      $("#runt-step").removeClass("done");
      $("#sicre-step").removeClass("done");
      $("#paynet-step").removeClass("current");
      $("#runt-step").removeClass("current");
      $("#sicre-step").removeClass("current");
      $("#initial-step").addClass("current").removeClass("done");
      $("#paynet-password").val("");
      $("#sicov-password").val("");
      $("#sicre-webview").attr("src", savedSicovUrl);
      // sicreWebview.send("logOut", true);
    }
  });
}

function showForm() {
  const sicovUsername = $("#sicov-username");
  const sicovPassword = $("#sicov-password");
  let savedSicovUrl = localStorage.getItem("sicov-url");
  $("#sicre-webview").attr("src", savedSicovUrl);
  formData = new FormData();
  formData.append("username", sicovUsername.val());
  formData.append("password", sicovPassword.val());

  $("#login-container").hide();
  $("#form-container").css("display", "flex");
  /* Store the value of the selected vehicle type */
  const paynetUsername = $("#paynet-username");
  const paynetPassword = $("#paynet-password");
  let encryptedPaynetPassword = CryptoJS.AES.encrypt(
    paynetPassword.val(),
    secretKey
  ).toString();
  const paynetCredentials = {
    username: paynetUsername.val(),
    password: encryptedPaynetPassword,
  };
  $("#header-user").text(sicovUsername.val());
  localStorage.setItem("paynet-credentials", JSON.stringify(paynetCredentials));
  localStorage.setItem("sicov-username", sicovUsername.val());
  let encryptedSicovPassword = CryptoJS.AES.encrypt(
    sicovPassword.val(),
    secretKey
  ).toString();
  localStorage.setItem("sicov-password", encryptedSicovPassword);
  // localStorage.setItem('auth-token', response.token);
  // const sicreUrl = localStorage.getItem('sicre-url');
  // $('#sicre-webview').attr('src', sicreUrl);
}

const sendVehicleData = async () => {
  const documentType = localStorage.getItem("document-type");
  const plate = localStorage.getItem("plate");
  const documentNumber = localStorage.getItem("document-number");
  const model = localStorage.getItem("vehicle-model");
  const vehicleType = localStorage.getItem("vehicle-type");
  const cellphone = localStorage.getItem("cellphone");
  paynetWebview.send("vehicleData", {
    documentNumber: documentNumber,
    plate: plate,
    documentType: documentType,
    model: model,
    vehicleType: vehicleType,
    cellphone: cellphone,
  });
};

function resumeRevision() {
  const plate = $("#selected-vehicle-plate").val();
  const pendingRevisions = localStorage.getItem("pending-revisions");
  if (pendingRevisions) {
    const revisions = JSON.parse(pendingRevisions);
    let index = 0;
    for (const revision of revisions) {
      if (revision.plate === plate) {
        revisions.splice(index, 1);
      }
      index++;
    }
    console.log(revisions);
    localStorage.setItem("pending-revisions", JSON.stringify(revisions));
    $(".list-container").empty();
    $("#selected-vehicle-plate").val("");
    $("#selected-vehicle-plate-container").removeClass("is-dirty");
    $("#selected-document-number").val("");
    $("#selected-document-number-container").removeClass("is-dirty");
    $("#selected-document-type").val("");
    $("#selected-document-type-container").removeClass("is-dirty");
    $("#selected-revision-type").val("");
    $("#selected-revision-type-container").removeClass("is-dirty");
    $("#selected-cellphone").val("");
    $("#selected-cellphone-container").removeClass("is-dirty");
    $("#selected-pin").val("");
    $("#selected-pin-container").removeClass("is-dirty");
    for (const revision of revisions) {
      const listItem = $(
        `<div id="${revision.plate}" onclick='selectRevision("${revision.plate}");' class='list-item'></div>`
      ).text(revision.plate);
      $(".list-container").append(listItem);
    }

    if (revisions.length) {
      const firstElement = revisions[0];
      $(`#${firstElement.plate}`).click();
    }
  }
}

function selectRevision(id) {
  $(".list-item").each(function (i, obj) {
    $(this).removeClass("is-selected");
  });
  const pendingRevisions = localStorage.getItem("pending-revisions");
  let selectedRevision;
  if (pendingRevisions) {
    const revisions = JSON.parse(pendingRevisions);
    for (const revision of revisions) {
      if (revision.plate === id) {
        selectedRevision = revision;
      }
    }
    if (selectedRevision) {
      $(`#${id}`).addClass("is-selected");
      console.log("se ha seleccionado", selectedRevision);
      $("#selected-vehicle-plate").val(selectedRevision.plate);
      $("#selected-vehicle-plate-container").addClass("is-dirty");
      $("#selected-document-number").val(selectedRevision.document);
      $("#selected-document-number-container").addClass("is-dirty");
      $("#selected-document-type").val(selectedRevision.documentType);
      $("#selected-document-type-container").addClass("is-dirty");
      $("#selected-revision-type").val(selectedRevision.revisionType);
      $("#selected-revision-type-container").addClass("is-dirty");
      $("#selected-cellphone").val(selectedRevision.cellphone);
      $("#selected-cellphone-container").addClass("is-dirty");
      $("#selected-pin").val(selectedRevision.pin);
      $("#selected-pin-container").addClass("is-dirty");
    }
  }
}

function showRunt() {
  $("#runt-webview").attr(
    "src",
    "https://www.runt.com.co/consultaCiudadana/#/consultaVehiculo"
  );
  $("#initial-form").css("display", "none");
  $("#paynet-webview").hide();
  $("#sicre-webview").hide();
  $("#paynet-step").removeClass("current");
  $("#runt-step").addClass("current");
  $("#sicre-step").removeClass("current");
  $("#runt-webview").show();
}

function showPaynet() {
  $("#initial-form").css("display", "none");
  $("#sicre-webview").hide();
  $("#runt-webview").hide();
  $("#paynet-step").addClass("current");
  $("#runt-step").removeClass("current");
  $("#sicre-step").removeClass("current");
  $("#paynet-webview").show();
}

function showSicov() {
  $("#initial-form").css("display", "none");
  $("#paynet-webview").hide();
  $("#runt-webview").hide();
  $("#paynet-step").removeClass("current");
  $("#runt-step").removeClass("current");
  $("#sicre-step").addClass("current");
  $("#sicre-webview").show();
}

function resetForm() {
  $("#vehicle-plate").val("");
  $("#document-number").val("");
  $("#cellphone").val("");
  $("#document-type").val("");
  $("#revision-type").val("70");
  $("#vehicle-type-select").val("");
}

function showInitialForm() {
  resetForm();
  log.info("Cerrando sesión SICOV");
  sicreWebview.send("logOut", true);
  let savedSicovUrl = localStorage.getItem("sicov-url");
  paynetWebview.send("logOut", true);
  log.info("Cerrando sesión PAYNET");
  $("#sicre-webview").attr("src", savedSicovUrl);
  $("#initial-form").css("display", "flex");
  $("#status-report").html("");
  $("#status-report").hide();
  $("#progress-bar").show();
  $("#failed-revisions").hide();
  $("#runt-webview").hide();
  $("#paynet-webview").hide();
  $("#sicre-webview").hide();
  $("#paynet-step").removeClass("done");
  $("#runt-step").removeClass("done");
  $("#sicre-step").removeClass("done");
  $("#paynet-step").removeClass("current");
  $("#runt-step").removeClass("current");
  $("#sicre-step").removeClass("current");
  $("#initial-step").addClass("current").removeClass("done");
}

function showFailedRevisions() {
  $(".list-container").empty();
  const pendingRevisions = [];
  const pendingRevision = {
    plate: "HKQ558",
    document: "51914792",
    cellphone: "3217584129",
    pin: "123456",
    documentType: "C",
    revisionType: "Inicial",
  };
  const pendingRevision2 = {
    plate: "1HKQ558",
    document: "151914792",
    cellphone: "13217584129",
    pin: "1123456",
    documentType: "C",
    revisionType: "Inicial",
  };
  pendingRevisions.push(pendingRevision, pendingRevision2);
  localStorage.setItem("pending-revisions", JSON.stringify(pendingRevisions));

  $("#initial-form").hide();
  $("#runt-webview").hide();
  $("#paynet-webview").hide();
  $("#sicre-webview").hide();
  $("#progress-bar").hide();
  $("#failed-revisions").css("display", "flex");

  for (const revision of pendingRevisions) {
    const listItem = $(
      `<div id="${revision.plate}" onclick='selectRevision("${revision.plate}");' class='list-item'></div>`
    ).text(revision.plate);
    $(".list-container").append(listItem);
  }

  const firstElement = pendingRevisions[0];
  $(`#${firstElement.plate}`).click();
}

const checkPaynetCredentials = async () => {
  let credentials = localStorage.getItem("paynet-credentials");
  // if (!credentials) {
  //     const { value: formValues } = await Swal.fire({
  //         title: 'Es la primera vez que usas la aplicacion, por favor ingresa tus credenciales Paynet.',
  //         html: `
  //         <div class="w-full">
  //             <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
  //                 <div class="mb-4">
  //                     <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
  //                         Nombre de Usuario
  //                     </label>
  //                     <input required id="username" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Nombre de Usuario">
  //                 </div>
  //                 <div class="mb-6">
  //                     <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
  //                         Clave
  //                     </label>
  //                     <input required id="password" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="******************">
  //                 </div>
  //             </form>
  //         </div>`,
  //         focusConfirm: false,
  //         preConfirm: () => {
  //             return {
  //                 username: document.getElementById('username').value,
  //                 password: document.getElementById('password').value
  //             }
  //         }
  //     })
  //     if (formValues && formValues.username && formValues.password) {
  //         localStorage.setItem('paynet-credentials', JSON.stringify(formValues));
  //         paynetWebview.send('paynetCredentials', formValues);
  //         sendVehicleData();
  //     }
  // } else {
  let jsonCredentials = JSON.parse(credentials);
  let bytes = CryptoJS.AES.decrypt(jsonCredentials.password, secretKey);
  let descryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
  paynetWebview.send("paynetCredentials", {
    username: jsonCredentials.username,
    password: descryptedPassword,
  });
  sendVehicleData();
  // }
};

const logUser = async (username) => {
  const syncUrl = localStorage.getItem("sync-url");
  let savedCdaId = localStorage.getItem("id-cda");
  log.info(`[SICRE] setLogUsuario ${username}`);
  let ip = "0.0.0.0";
  try {
    const ipResponse = await axios.get("http://checkip.amazonaws.com/");
    ip = ipResponse.data;
  } catch (error) {
    log.error(`Error obteniendo IP: ${error.message}`);
  }
  const formData = {
    parametro: {
      ID_CDA: savedCdaId,
      NombreUsuario: username,
      FechaIngreso: new Date(),
      NombreAplicacion: "ConectaSicov",
      DireccionIP: ip.replace(/(\r\n|\n|\r)/gm, ""),
    },
  };

  const setLogResponse = await axios.post(`${syncUrl}setLogUsuario`, formData);
  log.info(`[SICRE] Respuesta setLogUsuario ${JSON.stringify(setLogResponse)}`);
};
ipc.on("log-user", async (event, props) => {
  await logUser(props);
});
const submitData = async (data) => {
  let capacidadDeCarga = data.technicalData.totalPassengers
    ? data.technicalData.totalPassengers
    : "0";
  capacidadDeCarga = capacidadDeCarga.replace(/[^0-9.,]+/, "");
  const syncUrl = localStorage.getItem("sync-url");

  // $('#status-report').show();
  // $('#status-report').html('');
  // var statusContent = '<span>Sincronizando información</span>';
  // $('#status-report').append(statusContent);
  const plate = localStorage.getItem("plate");
  log.info(`Sincronizando placa: ${plate}`);
  const formData = {
    parametro: {
      placa: plate,
      Procedencia: data.procedencia,
      TipoServicio: data.serviceType,
      Clase: data.vehicleClass,
      Licencia: data.license,
      Marca: data.make,
      Linea: data.line,
      Modelo: data.model,
      CantSillas: data.technicalData.totalSeats,
      Color: data.color,
      Serie: data.serieNumber,
      MotorNo: data.motorNumber,
      Chasis: data.chasisNumber,
      VIN: data.vinNumber,
      Cilindraje: data.cylinderCapacity,
      Combustible: data.fuelType,
      FechaMatricula: moment(data.plateDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
      CapacidadCarga: capacidadDeCarga,
      PesoBruto: data.technicalData.totalWeight,
      CapacidadPasajeros: data.technicalData.totalPassengers
        ? data.technicalData.totalPassengers
        : "0",
      CantEjes: data.technicalData.totalAxis,
      Blindado: data.armoredInfo.isArmored,
      NivelBlindaje: data.armoredInfo.armorLevel,
      FechaSoat: data.soat.date,
      NumeroPoliza: data.soat.poliza,
      EntidadAseguradora: data.soat.entidad,
      TipoCarroceria: data.tipoCarroceria,
      AutoridadTransito: data.organismoTransito,
      ClasicoAntiguo: data.clasicoAntiguo,
      CantPuertas: data.puertas,
    },
  };
  log.info(JSON.stringify(formData));

  $.ajax({
    type: "POST",
    url: `${syncUrl}setInfoVehiculo`,
    data: JSON.stringify(formData),
    contentType: "application/json",
    dataType: "json",
    timeout: 18000,
    error: (request, status, error) => {
      log.warn("Error sincronizando");
      log.warn(status);
      log.warn(request.responseText);
      // $('#status-report').show();
      // $('#status-report').html('');
      // var statusContent = '<span>Error sincronizando Información</span>';
      // $('#status-report').append(statusContent);
      // setTimeout(() => {
      //     $('#status-report').html('');
      //     $('#status-report').hide();
      // }, 3000);
    },
    success: (response, status, jqXHQ) => {
      log.info("Información sincronizada");
      log.info(JSON.stringify(response));
      // $('#status-report').show();
      // $('#status-report').html('');
      // var statusContent = '<span>Información sincronizada exitosamente</span>';
      // $('#status-report').append(statusContent);
      // setTimeout(() => {
      //     $('#status-report').html('');
      //     $('#status-report').hide();
      // }, 3000);
    },
  });
};

setTimeout(async () => {
  // sicreWebview.openDevTools();
  //   runtWebview.openDevTools();
  // paynetWebview.openDevTools();
}, 500);

ipc.on("updateCredentials", (event, props) => {
  console.log(props);
  localStorage.setItem("paynet-credentials", JSON.stringify(props));
});

ipc.on("logEvent", (event, props) => {
  log.info(props);
});

ipc.on("revision-finished", (event, props) => {
  currentSicreState = "login";
  $("#status-report").html("");
  var statusContent = "<span>Cerrando sesión</span>";
  $("#status-report").append(statusContent);
  setTimeout(() => {
    sicreWebview.send("logOut", true);
    setTimeout(() => {
      let savedSicovUrl = localStorage.getItem("sicov-url");
      // $("#sicre-webview").attr("src", savedSicovUrl);
      paynetWebview.send("logOut", true);
      $("#status-report").css("display", "flex");
      $("#status-report").html("");
      var statusContent = "<span>¡Formalizacion realizada!</span>";
      $("#status-report").append(statusContent);
      setTimeout(() => {
        $("#status-report").html("");
        $("#status-report").hide();
      }, 3000);
      // let url = localStorage.getItem('sicre-url');
      // $('#sicre-webview').attr('src', url);
      $("#paynet-step").removeClass("done");
      $("#runt-step").removeClass("done");
      $("#initial-step").addClass("current").removeClass("done");
      $("#sicre-webview").hide();
      $("#initial-form").show();
      resetForm();
    }, 6000);
  }, 8000);
});

// ipc.on('runtFormData', (event, props) => {
//     localStorage.setItem('document-type', props.documentType);
//     localStorage.setItem('plate', props.plate);
//     localStorage.setItem('document-number', props.documentNumber);
// });

ipc.on("paynetLogin", (event, props) => {
  // $('#status-report').html('');
  // var statusContent = '<span>Iniciando Sesión!</span>';
  // $('#status-report').append(statusContent);
});

ipc.on("pinCreated", (event, props) => {
  localStorage.setItem("pin-number", props.pin);
  const pinValue = props.pinValue;
  let parsedValue = pinValue.replace("$", "");
  console.log(parsedValue);
  parsedValue.replace(".", "");
  console.log(parsedValue);
  localStorage.setItem("pin-value", parsedValue);
  localStorage.setItem("transaction-number", props.transactionNumber);
  Swal.fire({
    title: "¡PIN generado!",
    text: "Se ha generado el pin correctamente. ¿Desea continuar a SICOV?",
    icon: "success",
    html: `
        <ul>
            <li> PIN: ${props.pin} </li>
            <li> Transacción Nro.: ${props.transactionNumber} </li>
            <li> Valor PIN: ${props.pinValue} </li>
        </ul>
        `,
    showCancelButton: true,
    confirmButtonColor: "#79c5b4",
    cancelButtonColor: "#e88aa2",
    confirmButtonText: "Continua en SICOV",
    cancelButtonText: "Cancelar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      let savedSicovUrl = localStorage.getItem("sicov-url");
      log.info("[PAYNET] Cerrando sesión");
      paynetWebview.send("logOut", true);
      const username = localStorage.getItem("sicov-username");
      const password = localStorage.getItem("sicov-password");
      let bytes = CryptoJS.AES.decrypt(password, secretKey);
      let descryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
      const data = {
        username: username,
        password: descryptedPassword,
      };
      // $('#status-report').show();
      // $('#status-report').html('');
      // var statusContent = '<span>Cargando SICRE</span>';
      // $('#status-report').append(statusContent);
      $("#status-report").html("");
      var statusContent = "<span>Iniciando sesión</span>";
      $("#status-report").append(statusContent);
      $("#status-report").css("display", "flex");
      $("#status-report").addClass("full");
      $("#paynet-webview").hide();
      // $('#paynet-webview').attr('src', 'https://indra.paynet.com.co:14443/InformacionSeguridad.aspx');
      $("#sicre-webview").show();
      setTimeout(() => {
        $("#sicre-webview").attr("src", savedSicovUrl);
      }, 300);
      log.info("[SICRE] Iniciando sesión");
      setTimeout(() => {
        sicreWebview.send("start-login", data);
      }, 3000);
      $("html,body").scrollTop(0);
      $("#paynet-step").removeClass("current").addClass("done");
      $("#sicre-step").addClass("current");
    }
  });
});

ipc.on("runt-error", (event, props) => {
  let msg = props.message;
  Swal.fire({
    icon: "error",
    title: "Error",
    text: `Ha ocurrido un error: ${msg}`,
    confirmButtonText: "Reintentar",
  }).then(async () => {
    $("#status-report").html("");
    $("#status-report").hide();
    $("#runt-webview").hide();
    $("#runt-webview").attr(
      "src",
      "https://www.runt.com.co/consultaCiudadana/#/consultaVehiculo"
    );
    $("#initial-form").show();
    $("#runt-step").removeClass("current");
    $("#initial-step").addClass("current").removeClass("done");
  });
});

ipc.on("pinRedirect", (event, props) => {
  $("#status-report").html("");
  var statusContent = "<span>Redireccionando a compra de PIN</span>";
  $("#status-report").append(statusContent);
});
ipc.on("loadingPinInfo", (event, props) => {
  $("#status-report").html("");
  $("#status-report").css("display", "flex");
  $("#status-report").addClass("full");
  var statusContent =
    "<span>Ingresando información, por favor espera...</span>";
  $("#status-report").append(statusContent);
});

ipc.on("infoCompleted", (event, props) => {
  $("#status-report").html("");
  var statusContent =
    "<span>Información completada, por favor espera...</span>";
  $("#status-report").append(statusContent);
});
ipc.on("nextPressed", (event, props) => {
  $("#status-report").html("");
  var statusContent = "<span>Por favor espera...</span>";
  $("#status-report").append(statusContent);
  $("#status-report").show("");
});

ipc.on("vehicleData", (event, props) => {
  if (props.type === "vehicleInfo") {
    // $("#status-report").css("display", "flex");
    // $("#status-report").addClass("full");
    // $("#status-report").html("");
    // var statusContent = "<span>Consultando información del vehículo</span>";
    localStorage.setItem("vehicle-model", props.data.model);
    // $("#status-report").append(statusContent);
  }
  if (props.type === "otherInfo") {
    // $("#status-report").html("");
    // var statusContent = "<span>Consultando información adicional</span>";
    // $("#status-report").append(statusContent);
  }

  if (props.type === "done") {
    stopTimer();
    console.log("done", props);
    submitData(props.data);
    localStorage.setItem("license", props.data.license);
    localStorage.setItem("vehicleClass", props.data.vehicleClass);
    localStorage.setItem("technicalData", props.data.technicalData);
    setTimeout(async () => {
      // console.log('inside async', props);
      $("#status-report").html("");
      $("#status-report").hide();
      Swal.fire({
        title: "¡Información obtenida!",
        text: "Se ha consultado la información correctamente. ¿Desea continuar a Paynet?",
        icon: "success",
        html: `
                <ul>
                    <li> Marca: ${props.data.make} </li>
                    <li> Modelo: ${props.data.model} </li>
                    <li> Color: ${props.data.color}</li>
                    <li> Línea:${props.data.line} </li>
                    <li> Licencia:${props.data.license} </li>
                    <li> Estado del vehículo: ${props.data.state}</li>
                    <li> Estado Soat: ${props.data.soat.state} </li>
                    <li> Fecha fin de vigencia Soat: ${
                      props.data.soat.date
                    } </li>
                    <li> Último certificado: ${
                      props.data.certifications.type
                    } </li>
                    <li style="${
                      props.data.certifications.active == "NO"
                        ? "color:red;"
                        : ""
                    }" > Vigente: ${props.data.certifications.active} </li>
                    <li> Fecha vigencia: ${
                      props.data.certifications.expiration
                    } </li>
                    <li> Última solicitud: ${props.data.lastRequest.type}</li>
                    <li> Estado última solicitud: ${
                      props.data.lastRequest.lastRequestState
                    }</li>
                    <li> Entidad última solicitud: ${
                      props.data.lastRequest.lastRequestEntity
                    }</li>
                    <li> Fecha última solicitud: ${
                      props.data.lastRequest.lastRequestDate
                    }</li>
                </ul>
                `,
        showCancelButton: true,
        confirmButtonColor: "#79c5b4",
        cancelButtonColor: "#e88aa2",
        confirmButtonText: "Continua en Paynet",
        cancelButtonText: "Cancelar",
      }).then(async (result) => {
        if (result.isConfirmed) {
          // paynetWebview.send('navigate-to-pin', true);
          await checkPaynetCredentials();
          // $('#runt-webview').attr('src', 'https://www.runt.com.co/consultaCiudadana/#/consultaVehiculo');
          $("#status-report").css("display", "flex");
          $("#status-report").addClass("full");
          $("#status-report").html("");
          var statusContent = "<span>Cargando Paynet</span>";
          $("#status-report").append(statusContent);
          $("#runt-webview").hide();
          $("#paynet-webview").show();
          $("html,body").scrollTop(0);
          $("#runt-step").removeClass("current").addClass("done");
          $("#paynet-step").addClass("current");
          log.info("[RUNT] Recargando RUNT");
          runtWebview.send("newRequest", true);
          log.info("[RUNT] Redireccionando a  Paynet");

          // await sendVehicleData();
        } else {
          showInitialForm();
        }
      });
    }, 1500);
  }

  // Swal.fire({
  //     title: 'Información obtenida!',
  //     text: 'Se ha consultado la información correctamente',
  //     html: `
  //         <ul>
  //             <li> Marca: ${props.make} </li>
  //             <li> Modelo: ${props.model} </li>
  //             <li> Color: ${props.color}</li>
  //             <li> Linea:${props.line} </li>
  //             <li> Estado de Vehiculo: ${props.state}</li>
  //             <li> Estado Soat: ${props.soatState} </li>
  //             <li> Estado Ultima Solicitud: ${props.lastRequestState}</li>
  //             <li> Entidad Ultima Solicitud: ${props.lastRequestEntity}</li>
  //         </ul>
  //     `,
  //     icon: 'success'
  // });

  // $('#form-container').show();
});
