const { ipcRenderer: ipc } = require("electron");
const path = require("path");

let currentState;
/* Add listener for when the content is loaded */
document.addEventListener(
  "DOMContentLoaded",
  async (event) => {
    // window.$ = window.jQuery = require(path.join(__dirname, '/jquery-1.11.1.min.js'));
    if (window.location.href === "http://172.17.4.130:8055/Default") {
    }
  },
  false
);
ipc.on("sucursal-selection", async (event, props) => {
  console.log("se debe seleccionar la sucursal");
});
ipc.on("start-login", async (event, props) => {
  console.log("starts", props);
  setTimeout(async () => {
    await setUsername(props.username);
    await setPassword(props.password);
    await login();
  }, 1000);
});

const logOut = async () => {
  logEvent(`[SICRE] Cerrando sesión`);
  const logoutBtn = document.getElementById("ctl00_LoginView1_LoginStatus1");
  console.log(logoutBtn);
  logoutBtn.click();
};
ipc.on("logOut", async (event, props) => {
  console.log("on log out");
  await logOut();
});
ipc.on("input-form-data", async (event, props) => {
  console.log("inputttt", props);
  logEvent(`[SICRE] Ingresando datos`);
  const documentType = localStorage.getItem("documentType");
  const documentNumber = localStorage.getItem("documentNumber");
  const pinNumber = localStorage.getItem("pinNumber");
  const pinValue = localStorage.getItem("pinValue");
  const foreignVehicleVal = localStorage.getItem("foreignVehicle");
  const category = localStorage.getItem("vehicleType");
  const revisionType = localStorage.getItem("revisionType");
  await setPin(pinNumber);
  await setPinValue(pinValue);
  await setDocumentType(documentType);
  await setDocumentNumber(documentNumber);
  await setForeignVehicle(foreignVehicleVal);
  await setCategory(category);
  await setRevisionType(revisionType);
  await checkPin();
  await addMakeRevisionListener();
});
ipc.on("enter-plate", async (event, props) => {
  logEvent(`[SICRE] Ingresando placa`);
  localStorage.setItem("plate", props.plate);
  localStorage.setItem("revisionType", props.revisionType);
  localStorage.setItem("vehicleType", props.vehicleType);
  localStorage.setItem("documentType", props.documentType);
  localStorage.setItem("documentNumber", props.documentNumber);
  localStorage.setItem("pinNumber", props.pinNumber);
  localStorage.setItem("pinValue", props.pinValue);
  localStorage.setItem("foreignVehicle", props.foreignVehicle);
  await setPlate(props.plate);
  await checkRevision();
});

const addMakeRevisionListener = async () => {
  setTimeout(() => {
    $("#ctl00_body_btnFormalizarRevision").on("click", () => {
      setTimeout(() => {
        logEvent(`[SICRE] Revisión finalizada`);
        ipc.sendTo(1, "revision-finished", true);
      }, 2000);
    });
  }, 2000);
  ipc.sendTo(1, "info-entered", true);
};

const setPin = async (pin) => {
  console.log(pin);
  setTimeout(() => {
    const pinInput = $("#ctl00_body_txtPin");
    pinInput.val(pin);
  }, 1000);
};
//
const setPinValue = async (pinValue) => {
  let pin = pinValue.replaceAll(".", "").trim();
  console.log(pin);
  setTimeout(() => {
    const pinValueInput = $("#ctl00_body_txtValorDePin");
    console.log(pinValueInput);
    pinValueInput.val(pin);
  }, 1000);
};
//
const makeRevision = async () => {
  const makeRevisionBtn = $("#ctl00_body_btnFormalizarRevision");
  makeRevisionBtn.click();
};
const setRevisionType = async (revisionType) => {
  setTimeout(() => {
    const revisionTypeSelect = $("#ctl00_body_ddlTipoRevision");
    revisionTypeSelect.val(revisionType);
  }, 1000);
};
const setCategory = async (category) => {
  setTimeout(() => {
    const categorySelect = $("#ctl00_body_ddlTipoServicio");
    switch (category) {
      case "MOTOCICLETA":
        categorySelect.val("76");
        break;
      case "LIVIANOS PARTICULARES":
        categorySelect.val("77");
        break;
      case "PESADOS 2 EJES PARTICULARES":
        categorySelect.val("78");
        break;
      case "MOTOCARROS":
        break;
      case "LIVIANOS PUBLICOS":
        categorySelect.val("80");
        break;
      case "PESADOS 3 O MAS EJES PARTICULARES":
        categorySelect.val("81");
        break;
      case "PESADOS BIARTICULADOS PARTICULARES":
        break;
      case "PESADOS BIARTICULADOS PUBLICOS":
        break;
      case "PESADOS 3 O MAS EJES PUBLICOS":
        categorySelect.val("84");
        break;
      case "PESADOS 2 EJES PUBLICOS":
        categorySelect.val("83");
        break;
      case "MOTOCARROS LIVIANOS PARTICULARES":
        break;
      case "MOTOCARROS LIVIANOS PUBLICOS":
        break;
      default:
        break;
    }
  }, 1000);
};

const setForeignVehicle = async (value) => {
  setTimeout(() => {
    switch (value) {
      case "Si":
        const yesLabel = $("#ctl00_body_ddlIsExtranjeroo_1");
        yesLabel.click();
        break;
      case "No":
        const noLabel = $("#ctl00_body_ddlIsExtranjeroo_0");
        noLabel.click();
        break;
      default:
        break;
    }
  }, 1000);
};
const checkPin = async () => {
  logEvent(`[SICRE] Vericando PIN`);
  setTimeout(() => {
    const checkPinBtn = $("#ctl00_body_btnConsultarPIN");
    if (checkPinBtn) {
      console.log("checking pin");
      checkPinBtn.click();
    }
  }, 1000);
};

const setDocumentNumber = async (documentNumber) => {
  console.log(documentNumber);
  setTimeout(() => {
    const documentNumberInput = $("#ctl00_body_txtNumeroDocumento");
    documentNumberInput.val(documentNumber);
  }, 1000);
};

const setDocumentType = async (documentType) => {
  console.log(documentType);
  setTimeout(() => {
    const documentTypeSelect = $("#ctl00_body_ddlTipoDocumento");
    console.log("here");
    switch (documentType) {
      case "C":
        console.log("cccc");
        console.log(documentTypeSelect);
        documentTypeSelect.val(16);
        break;
      case "E":
        documentTypeSelect.val(17);
        break;
      case "N":
        documentTypeSelect.val(18);
        break;
      case "T":
        documentTypeSelect.val(19);
        break;
      case "P":
        documentTypeSelect.val(58);
        break;

      default:
        documentTypeSelect.val(16);
        break;
    }
  }, 1000);
};

const setUsername = async (username) => {
  const usernameInput = $("#txtEmail");
  usernameInput.val(username);
};

const setPassword = async (password) => {
  const usernameInput = $("#txtPassword");
  usernameInput.val(password);
};

const login = async () => {
  const loginBtn = $("#btnEntrar");
  loginBtn.click();
};

const setPlate = async (plate) => {
  const plateInput = $("#ctl00_body_txtPlaca");
  plateInput.val(plate);
};

const checkRevision = async () => {
  logEvent(`[SICRE] Consultando revisión`);
  const checkRevisionBtn = $("#ctl00_body_btnConsultar");
  checkRevisionBtn.click();
};

const logEvent = async (message) => {
  ipc.sendTo(1, "logEvent", message);
};
