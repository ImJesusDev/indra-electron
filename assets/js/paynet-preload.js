const { ipcRenderer: ipc } = require("electron");
const path = require("path");

let confirmBtn;
let cancelBtn;
ipc.on("checkForErrors", async (event, props) => {
  let errors = document.getElementById("ctl00_cph_divlblError");
  if (errors) {
    let message = errors.textContent.trim();
    if (message.indexOf("no son correctos") >= 0) {
      ipc.sendTo(1, "paynetLoginError", true);
      let loginBtn = document.getElementById(
        "ctl00_cph_StormLogin_LoginButton"
      );
      loginBtn.addEventListener("click", async () => {
        console.log("Login btn clicked");
        const username = $("#ctl00_cph_StormLogin_UserName").val();
        const password = $("#ctl00_cph_StormLogin_Password").val();
        const credentials = {
          username,
          password,
        };
        ipc.sendTo(1, "updateCredentials", credentials);
      });
      console.log("credential errors");
    }
  }
});
ipc.on("logOut", async (event, props) => {
  await logEvent(`[PAYNET] -> Cerrando sesión`);
  await logOut();
});
ipc.on("pinConfirmation", async (event, props) => {
  confirmBtn.click();
  await logEvent(`[PAYNET] -> Obteniendo información del PIN`);
  setTimeout(async () => {
    /* Get the pin number */
    const pinSpan = $("#ctl00_cph_lblCodigoPinResumen");
    const pinNumber = pinSpan.text();
    /* Get the transaction number */
    let transactionXpath = "//th[text()='Número de Transacción ']";
    let transactionMatchingElement = document.evaluate(
      transactionXpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    let transactionParentElement = transactionMatchingElement.parentElement;
    let transactionData =
      transactionParentElement.nextElementSibling.childNodes[3];
    let transactionNumber = transactionData.textContent;
    /* Get the pin value */
    const pinValueSpan = $("#ctl00_cph_txtValorPinResumen");
    const pinValue = pinValueSpan.text();

    console.log("Pay listener");
    await logEvent(`[PAYNET] -> Información obtenida:`);
    await logEvent(
      `[PAYNET] ${JSON.stringify({
        pin: pinNumber,
        transactionNumber: transactionNumber,
        pinValue: pinValue,
      })}`
    );
    ipc.sendTo(1, "pinCreated", {
      pin: pinNumber,
      transactionNumber: transactionNumber,
      pinValue: pinValue,
    });
  }, 1000);
});
ipc.on("paynetCredentials", async (event, props) => {
  await logEvent(`[PAYNET] -> Ingresando credenciales`);
  window.$ = window.jQuery = require(path.join(
    __dirname,
    "/jquery-3.5.1.min.js"
  ));
  await setUsername(props.username);
  await setPassword(props.password);
  await logEvent(`[PAYNET] -> Iniciando sesión`);
  await login();

  if (window.location.href === "https://indra.paynet.com.co:14443/login.aspx") {
    // ipc.sendTo(1, 'paynetLogin', true);
    // window.$ = window.jQuery = require(path.join(__dirname, '/jquery-3.5.1.min.js'));
    // await setUsername(props.username);
    // await setPassword(props.password);
    // await login();
  }
  // if (window.location.href === 'https://indra.paynet.com.co:14443/InformacionSeguridad.aspx') {
  //     console.log('here');
  //     ipc.sendTo(1, 'pinRedirect', true);
  //     await setTimeout(async() => {
  //         await navigateToPing();
  //     }, 1000);
  // }
  // if (window.location.href === 'https://indra.paynet.com.co:14443/PIN/VentaPin.aspx') {
  //     await setTimeout(async() => {
  //         ipc.sendTo(1, 'loadingPinInfo', true);
  //         await inputData();
  //     }, 1000);
  // }
});
ipc.on("add-listeners", async (event, props) => {
  setTimeout(async () => {
    await setListeners();
  }, 2000);
});
ipc.on("navigate-to-pin", async (event, props) => {
  await logEvent(`[PAYNET] -> Navegando a compra de PIN`);
  ipc.sendTo(1, "pinRedirect", true);
  await navigateToPing();
});

ipc.on("vehicleData", async (event, props) => {
  localStorage.setItem("vehiclePlate", props.plate);
  localStorage.setItem("documentNumber", props.documentNumber);
  localStorage.setItem("documentType", props.documentType);
  localStorage.setItem("vehicleModel", props.model);
  localStorage.setItem("vehicleType", props.vehicleType);
  localStorage.setItem("cellphone", props.cellphone);
});

/* Add listener for when the content is loaded */
document.addEventListener(
  "DOMContentLoaded",
  async (event) => {
    window.$ = window.jQuery = require(path.join(
      __dirname,
      "/jquery-1.11.1.min.js"
    ));
    // if (window.location.href === 'https://indra.paynet.com.co:14443/InformacionSeguridad.aspx') {
    //     ipc.sendTo(1, 'pinRedirect', true);
    //     await setTimeout(async() => {
    //         await navigateToPing();
    //     }, 1000);
    // }
    if (
      window.location.href ===
      "https://indra.paynet.com.co:14443/PIN/VentaPin.aspx"
    ) {
      await setTimeout(async () => {
        ipc.sendTo(1, "loadingPinInfo", true);
        await logEvent(`[PAYNET] -> Ingresando Datos:`);
        await inputData();
      }, 1000);
    }
  },
  false
);

const setListeners = async () => {
  await logEvent(`[PAYNET] -> Obteniendo botón 'Siguiente'`);
  const continueBtn = document.getElementById("ctl00_cph_btnSiguiente");
  console.log(continueBtn);
  if (continueBtn) {
    ipc.sendTo(1, "infoCompleted", true);
    continueBtn.addEventListener("click", async () => {
      console.log("add-listenerrrr");
      ipc.sendTo(1, "nextPressed", true);
      setTimeout(async () => {
        await getPinInfo();
      }, 3000);
    });
    continueBtn.click();
  }
};
const navigateToPing = async () => {
  setTimeout(() => {
    xpath = "//a[contains(text(),'Compra PIN')]";
    matchingElement = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    matchingElement.click();
  }, 1000);
};

const setUsername = async (username) => {
  const usernameInput = $("#ctl00_cph_StormLogin_UserName");
  usernameInput.val(username);
};

const inputData = async () => {
  const vehicleModel = localStorage.getItem("vehicleModel");
  const vehiclePlate = localStorage.getItem("vehiclePlate");
  const documentNumber = localStorage.getItem("documentNumber");
  const documentType = localStorage.getItem("documentType");
  const vehicleType = localStorage.getItem("vehicleType");
  const cellphone = localStorage.getItem("cellphone");

  await setModel(vehicleModel);
  await setPlate(vehiclePlate);
  await setPlateConfirmation(vehiclePlate);
  await setDocument(documentNumber);
  await setDocumentType(documentType);
  await setCellphone(cellphone);
  // await setPhone('456');
  await setService(vehicleType);
};

const getPinInfo = async () => {
  await logEvent(`[PAYNET] -> Obteniendo botón 'Pagar'`);
  const payBtn = document.getElementById("ctl00_cph_btnPagar");
  console.log(payBtn);
  if (payBtn) {
    payBtn.addEventListener("click", async () => {
      setTimeout(async () => {
        /* Detect confirmation modal */
        const confirmModal = document.querySelector("#popUpConfirmacionCompra");
        // If the confirmation modal appears
        if (confirmModal.style.display === "block") {
          const msg = document.querySelector("#ctl00_cph_mensajeAceptarCompra")
            .textContent;
          ipc.sendTo(1, "paynetConfirm", {
            msg,
          });
          confirmBtn = document.querySelector("#ctl00_cph_btnAceptarCompra");
          cancelBtn = document.querySelector("#ctl00_cph_btnCancelarCompra");
        } else {
          ipc.sendTo(1, "pleaseClickPay", true);
          await logEvent(`[PAYNET] -> Obteniendo información del PIN`);
          console.log("get pin info");
          /* Get the pin number */
          const pinSpan = $("#ctl00_cph_lblCodigoPinResumen");
          const pinNumber = pinSpan.text();
          /* Get the transaction number */
          let transactionXpath = "//th[text()='Número de Transacción ']";
          let transactionMatchingElement = document.evaluate(
            transactionXpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
          let transactionParentElement =
            transactionMatchingElement.parentElement;
          let transactionData =
            transactionParentElement.nextElementSibling.childNodes[3];
          let transactionNumber = transactionData.textContent;
          /* Get the pin value */
          const pinValueSpan = $("#ctl00_cph_txtValorPinResumen");
          const pinValue = pinValueSpan.text();

          console.log("Pay listener");
          ipc.sendTo(1, "pinCreated", {
            pin: pinNumber,
            transactionNumber: transactionNumber,
            pinValue: pinValue,
          });
          await logEvent(`[PAYNET] -> Información obtenida:`);
          await logEvent(
            `[PAYNET] ${JSON.stringify({
              pin: pinNumber,
              transactionNumber: transactionNumber,
              pinValue: pinValue,
            })}`
          );

          let parent = document.getElementById("ctl00_cph_pnlSaveVentaPin");
          console.log(parent);
          let ele = document.createElement("button");
          ele.textContent = "Obtener PIN";
          await logEvent(`[PAYNET] -> Generando botón 'Obtener PIN':`);
          console.log(ele);
          parent.append(ele);
          console.log(parent);
          ele.addEventListener("click", async (e) => {
            await logEvent(`[PAYNET] -> Obteniendo información del PIN`);
            e.preventDefault();
            /* Get the pin number */
            const pinSpan = $("#ctl00_cph_lblCodigoPinResumen");
            const pinNumber = pinSpan.text();
            /* Get the transaction number */
            let transactionXpath = "//th[text()='Número de Transacción ']";
            let transactionMatchingElement = document.evaluate(
              transactionXpath,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            ).singleNodeValue;
            let transactionParentElement =
              transactionMatchingElement.parentElement;
            let transactionData =
              transactionParentElement.nextElementSibling.childNodes[3];
            let transactionNumber = transactionData.textContent;
            /* Get the pin value */
            const pinValueSpan = $("#ctl00_cph_txtValorPinResumen");
            const pinValue = pinValueSpan.text();

            console.log("Pay listener");
            await logEvent(`[PAYNET] -> Información obtenida:`);
            await logEvent(
              `[PAYNET] ${JSON.stringify({
                pin: pinNumber,
                transactionNumber: transactionNumber,
                pinValue: pinValue,
              })}`
            );
            ipc.sendTo(1, "pinCreated", {
              pin: pinNumber,
              transactionNumber: transactionNumber,
              pinValue: pinValue,
            });
          });
        }
      }, 3000);
    });
    payBtn.click();
  }
};

const logOut = async () => {
  const logOutBtn = $("#logout2");
  logOutBtn.click();
};

const setPlate = async (plate) => {
  const plateInput = $("#ctl00_cph_txtPlaca");
  plateInput.val(plate);
};

const setService = async (service) => {
  let optionInput;
  switch (service) {
    case "MOTOCICLETA":
      optionInput = $("#ctl00_cph_rblServicio_0");
      optionInput.click();
      break;
    case "LIVIANOS PARTICULARES":
      optionInput = $("#ctl00_cph_rblServicio_1");
      optionInput.click();
      break;
    case "PESADOS 2 EJES PARTICULARES":
      optionInput = $("#ctl00_cph_rblServicio_2");
      optionInput.click();
      break;
    case "MOTOCARROS":
      optionInput = $("#ctl00_cph_rblServicio_3");
      optionInput.click();
      break;
    case "LIVIANOS PUBLICOS":
      optionInput = $("#ctl00_cph_rblServicio_4");
      optionInput.click();
      break;
    case "PESADOS 3 O MAS EJES PARTICULARES":
      optionInput = $("#ctl00_cph_rblServicio_5");
      optionInput.click();
      break;
    case "PESADOS BIARTICULADOS PARTICULARES":
      optionInput = $("#ctl00_cph_rblServicio_6");
      optionInput.click();
      break;
    case "PESADOS BIARTICULADOS PUBLICOS":
      optionInput = $("#ctl00_cph_rblServicio_7");
      optionInput.click();
      break;
    case "PESADOS 3 O MAS EJES PUBLICOS":
      optionInput = $("#ctl00_cph_rblServicio_8");
      optionInput.click();
      break;
    case "PESADOS 2 EJES PUBLICOS":
      optionInput = $("#ctl00_cph_rblServicio_9");
      optionInput.click();
      break;
    case "MOTOCARROS LIVIANOS PARTICULARES":
      optionInput = $("#ctl00_cph_rblServicio_10");
      optionInput.click();
      break;
    case "MOTOCARROS LIVIANOS PUBLICOS":
      optionInput = $("#ctl00_cph_rblServicio_11");
      optionInput.click();
      break;
    default:
      break;
  }
};

const setPlateConfirmation = async (plate) => {
  const plateInput = $("#ctl00_cph_txtConfirmacionPlaca");
  plateInput.val(plate);
};
const setDocument = async (document) => {
  const documentInput = $("#ctl00_cph_txtNumeroCedula");
  documentInput.val(document);
};
const setDocumentType = async (documentType) => {
  const documentTypeInput = $("#ctl00_cph_ddlTipoIdentificacion");
  documentTypeInput.val(documentType);
};

const setModel = async (model) => {
  const modelInput = $("#ctl00_cph_txtModelo");
  modelInput.val(model);
};
const setCellphone = async (cellphone) => {
  const cellphoneInput = $("#ctl00_cph_txtCelular");
  cellphoneInput.val(cellphone);
};

const setPhone = async (phone) => {
  const phoneInput = $("#ctl00_cph_txtTelefono");
  phoneInput.val(phone);
};

const setPassword = async (password) => {
  const passwordInput = $("#ctl00_cph_StormLogin_Password");
  passwordInput.val(password);
};

const login = async () => {
  console.log("login");
  const loginBtn = $("#ctl00_cph_StormLogin_LoginButton");
  loginBtn.click();
};
const logEvent = async (message) => {
  ipc.sendTo(1, "logEvent", message);
};
