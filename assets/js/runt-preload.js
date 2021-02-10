const { ipcRenderer: ipc } = require('electron');

let userDocument;
let userVehiclePlate;
let userDocumentType;

ipc.on('newRequest', async(event, props) => {
    await newRequest();
});

ipc.on('runt-form-data', async(event, props) => {
    console.log('runt-form-data', props);
    userDocument = props.documentNumber;
    userVehiclePlate = props.plate;
    userDocumentType = props.documentType;
    /* Plate input */
    let plateInput = $('#noPlaca');
    plateInput.val(userVehiclePlate);
    plateInput.trigger('input');

    /* Document number input */
    let documentNumberInput = $('input[name ="noDocumento"]');
    documentNumberInput.val(userDocument);
    documentNumberInput.trigger('input');

    let documentTypeXpath = "//label[text()='Tipo de Documento:']";
    let documentMatchingElement = document.evaluate(documentTypeXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let documentTypeSelect = documentMatchingElement.parentElement.childNodes[3].childNodes[3];
    documentTypeSelect.value = userDocumentType;
});
/* Add listener for when the content is loaded */
document.addEventListener('DOMContentLoaded', async(event) => {
    /* Add timeout to prevent errors (button not rendered) */
    setTimeout(async() => {
        if (document.title.indexOf('Error') >= 0) {
            ipc.sendTo(1, 'runt-error', true);
        } else {
            /* Find button to make the request for vehicle information */
            let xpath = "//button[text()='Consultar Información']";

            let matchingElement = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            //cxpath procedencia
            let xpathP = "//label[text()='Procedencia:']";
            let matchingElementP = document.evaluate(xpathP, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let procedencia = matchingElementP.parentElement.parentElement.nextElementSibling.childNodes[1].childNodes[3].value;
            console.log(procedencia);

            /* Add Event on click for the button */
            matchingElement.addEventListener("click", async() => {


                /* Add timeout after the button is clicked */
                setTimeout(async() => {
                    let theMake = await getVehicleMake();
                    let theModel = await getVehicleModel();
                    let theLine = await getVehicleLine();
                    let theColor = await getVehicleColor();
                    let theState = await getVehicleState();
                    let license = await getLicense();
                    let vehicleClass = await getVehicleClass();
                    let serviceType = await getServiceType();
                    let motorNumber = await getMotorNumber();
                    let chasisNumber = await getChasisNumber();
                    let serieNumber = await getSerieNumber();
                    let cylinderCapacity = await getCylinderCapacity();
                    let fuelType = await getFuelType();
                    let vinNumber = await getVinNumber();
                    let plateDate = await getPlateDate();
                    await sendData('vehicleInfo', {
                        chasisNumber: chasisNumber,
                        cylinderCapacity: cylinderCapacity,
                        plateDate: plateDate,
                        make: theMake,
                        model: theModel,
                        line: theLine,
                        color: theColor,
                        state: theState,
                        license: license,
                        vehicleClass: vehicleClass,
                        serviceType: serviceType,
                        motorNumber: motorNumber,
                        fuelType: fuelType,
                        vinNumber: vinNumber,
                        procedencia: procedencia,
                        serieNumber: serieNumber
                    });

                    let soatInfo = await getSoatInfo();
                    let armoredInfo = await getArmoredInfo();
                    let lastRequestInfo = await getRequestInfo();
                    let technicalData = await getTechnicalData();

                    await sendData('otherInfo', {
                        soat: soatInfo,
                        lastRequest: lastRequestInfo
                    })

                    await sendData('done', {
                        make: theMake,
                        model: theModel,
                        line: theLine,
                        color: theColor,
                        state: theState,
                        soat: soatInfo,
                        technicalData: technicalData,
                        lastRequest: lastRequestInfo,
                        license: license,
                        plateDate: plateDate,
                        vehicleClass: vehicleClass,
                        serviceType: serviceType,
                        motorNumber: motorNumber,
                        fuelType: fuelType,
                        vinNumber: vinNumber,
                        chasisNumber: chasisNumber,
                        cylinderCapacity: cylinderCapacity,
                        armoredInfo: armoredInfo,
                        procedencia: procedencia,
                        serieNumber: serieNumber
                    });
                    // await newRequest();

                }, 1000);
            });
        }


    }, 2000);

}, false);


const sendData = async(type, data) => {
    console.log(data);
    const dataToSend = {
        type: type,
        data: data
    };
    ipc.sendTo(1, 'vehicleData', dataToSend);

    // setTimeout(() => {
    //     const vehicleData = {

    //         soatState: soatState.trim(),
    //         lastRequestState: lastRequestState.trim(),
    //         lastRequestEntity: lastRequestEntity.trim()
    //     };
    //     ipc.sendTo(1, 'vehicleData', vehicleData);
    // }, 800);
};


const getVehicleMake = async() => {
    /* Get the Make of the vehicle */
    let makeXpath = "//label[text()='Marca:']";
    let matchingMakeElement = document.evaluate(makeXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentMakeDiv = matchingMakeElement.parentElement;
    let vehicleMake = parentMakeDiv.nextElementSibling.textContent;
    return vehicleMake.trim();
};

const getVehicleModel = async() => {
    /* Get the Model of the vehicle */
    let modelXpath = "//label[text()='Modelo:']";
    let matchingModelElement = document.evaluate(modelXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentModelDiv = matchingModelElement.parentElement;
    let vehicleModel = parentModelDiv.nextElementSibling.textContent;
    return vehicleModel.trim();
};

const getVehicleLine = async() => {

    /* Get the Line of the vehicle */
    let lineXpath = "//label[text()='Línea:']";
    let matchingLineElement = document.evaluate(lineXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentLineDiv = matchingLineElement.parentElement;
    let vehicleLine = parentLineDiv.nextElementSibling.textContent;
    return vehicleLine.trim();
};

const getVehicleColor = async() => {

    /* Get the Color of the vehicle */
    let colorXpath = "//label[text()='Color:']";
    let matchingColorElement = document.evaluate(colorXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentColorDiv = matchingColorElement.parentElement;
    let vehicleColor = parentColorDiv.nextElementSibling.textContent;
    return vehicleColor.trim();
};

const getMotorNumber = async() => {

    /* Get the Motor number of the vehicle */
    let motorXpath = "//label[text()='Número de motor:']";
    let matchingMotorElement = document.evaluate(motorXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentMotorDiv = matchingMotorElement.parentElement;
    let vehicleMotor = parentMotorDiv.nextElementSibling.textContent;
    return vehicleMotor.trim();
};
const getChasisNumber = async() => {

    /* Get the Chasis number of the vehicle */
    let chasisXpath = "//label[text()='Número de chasis:']";
    let matchingChasisElement = document.evaluate(chasisXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentChasisDiv = matchingChasisElement.parentElement;
    let vehicleChasis = parentChasisDiv.nextElementSibling.textContent;
    return vehicleChasis.trim();
};
const getSerieNumber = async() => {

    /* Get the Serie number of the vehicle */
    let serieXpath = "//label[text()='Número de serie:']";
    let matchingSerieElement = document.evaluate(serieXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentSerieDiv = matchingSerieElement.parentElement;
    let vehicleSerie = parentSerieDiv.nextElementSibling.textContent;
    return vehicleSerie.trim();
};
const getPlateDate = async() => {

    /* Get the plate date of the vehicle */
    let plateDateXpath = "//label[text()='Fecha de Matricula Inicial(dd/mm/aaaa):']";
    let matchingPlateDateElement = document.evaluate(plateDateXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentPlateDateDiv = matchingPlateDateElement.parentElement;
    let vehiclePlateDate = parentPlateDateDiv.nextElementSibling.textContent;
    return vehiclePlateDate.trim();
};

const getCylinderCapacity = async() => {
    /* Get the cylinder capacity of the vehicle */
    let cylinderXpath = "//label[text()='Cilindraje:']";
    let matchingCylinderElement = document.evaluate(cylinderXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentCylinderDiv = matchingCylinderElement.parentElement;
    let vehicleCylinder = parentCylinderDiv.nextElementSibling.textContent;
    return vehicleCylinder.trim();
};
const getFuelType = async() => {
    /* Get the fuel type of the vehicle */
    let fuelXpath = "//label[text()='Tipo Combustible:']";
    let matchingFuelElement = document.evaluate(fuelXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentFuelDiv = matchingFuelElement.parentElement;
    let vehicleFuel = parentFuelDiv.nextElementSibling.textContent;
    return vehicleFuel.trim();
};

const getVinNumber = async() => {

    /* Get the Vin number of the vehicle */
    let vinXpath = "//label[text()='Número de VIN:']";
    let matchingVinElement = document.evaluate(vinXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentVinDiv = matchingVinElement.parentElement;
    let vehicleVin = parentVinDiv.nextElementSibling.textContent;
    return vehicleVin.trim();
};

const getSoatInfo = async() => {
    return new Promise((resolve) => {
        /* Soat */
        let soatTabXpath = "//a[text()=' Poliza SOAT']";
        let soatTab = document.evaluate(soatTabXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        soatTab.click();
        let soatState = '';
        setTimeout(() => {
            let soatXpath = "//th[text()='Número de poliza']";
            let matchingSoatElement = document.evaluate(soatXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let parentSoatDiv = matchingSoatElement.parentElement;
            soatState = parentSoatDiv.parentElement.nextElementSibling.childNodes[2].childNodes[11].childNodes[4].textContent;
            resolve(soatState.trim());
        }, 1000);
    });
};

const getTechnicalData = async() => {
    return new Promise((resolve) => {
        /* Technical data tab */
        let dataTabXpath = "//a[text()=' Datos Técnicos  del Vehículo']";
        let dataTab = document.evaluate(dataTabXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        dataTab.click();
        let totalSeats = '';
        let totalLoad = ''
        let totalWeight = ''
        let totalAxis = ''
        let totalPassengers = ''
        setTimeout(() => {
            // Cant sillas
            let totalSeatsXpath = "//label[text()='Capacidad Pasajeros Sentados:']";
            let matchingSeatsElement = document.evaluate(totalSeatsXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let parentSeatDiv = matchingSeatsElement.parentElement;
            totalSeats = parentSeatDiv.nextElementSibling.textContent
                // Capacidad pasajeros
            let totalPassengersXpath = "//label[text()='Capacidad de Pasajeros:']";
            let matchingPassengersElement = document.evaluate(totalPassengersXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let parentPassengerDiv = matchingPassengersElement.parentElement;
            totalPassengers = parentPassengerDiv.nextElementSibling.textContent
                // Capacidad de Carga
            let totalLoadXpath = "//label[text()='Capacidad de Carga:']";
            let matchingLoadElement = document.evaluate(totalLoadXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let parentLoadDiv = matchingLoadElement.parentElement;
            totalLoad = parentLoadDiv.nextElementSibling.textContent
                // Peso Bruto
            let totalWeightXpath = "//label[text()='Peso Bruto Vehicular:']";
            let matchingWeightElement = document.evaluate(totalWeightXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let parentWeightDiv = matchingWeightElement.parentElement;
            totalWeight = parentWeightDiv.nextElementSibling.textContent
                // CantEjes
            let totalAxisXpath = "//label[text()='Número de ejes:']";
            let matchingAxisElement = document.evaluate(totalAxisXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let parentAxisDiv = matchingAxisElement.parentElement;
            totalAxis = parentAxisDiv.nextElementSibling.textContent
            resolve({
                totalSeats: totalSeats.trim(),
                totalLoad: totalLoad.trim(),
                totalWeight: totalWeight.trim(),
                totalAxis: totalAxis.trim(),
                totalPassengers: totalPassengers.trim()
            });
        }, 1000);
    });
};

const getVehicleClass = async() => {
    /* Get the vehicleClass number */
    let vehicleClassXpath = "//label[text()='Clase de vehículo:']";
    let matchingClassElement = document.evaluate(vehicleClassXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentClassDiv = matchingClassElement.parentElement;
    let vehicleClass = parentClassDiv.nextElementSibling.textContent;
    return vehicleClass.trim();
};
const getServiceType = async() => {
    /* Get the vehicleClass number */
    let serviceTypeXpath = "//label[text()='Tipo de servicio:']";
    let matchingTypeElement = document.evaluate(serviceTypeXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentTypeDiv = matchingTypeElement.parentElement;
    let serviceType = parentTypeDiv.nextElementSibling.textContent;
    return serviceType.trim();
};

const getLicense = async() => {
    /* Get the license number */
    let licenseXpath = "//label[text()='Nro. de licencia de tránsito:']";
    let matchingLicenseElement = document.evaluate(licenseXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentLicenseDiv = matchingLicenseElement.parentElement;
    let license = parentLicenseDiv.nextElementSibling.textContent;
    return license.trim();
}

const getVehicleState = async() => {
    /* Get the state of the vehicle */
    let stateXpath = "//label[text()='Estado del vehículo:']";
    let matchingStateElement = document.evaluate(stateXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    let parentStateDiv = matchingStateElement.parentElement;
    let vehicleState = parentStateDiv.parentElement.nextElementSibling.childNodes[14].textContent;
    return vehicleState.trim();
};

const getRequestInfo = async() => {
    return new Promise((resolve) => {
        /*  Requests */
        let requestsTabXpath = "//a[text()=' Solicitudes']";
        let requests = document.evaluate(requestsTabXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        requests.click();
        let lastRequestState = '';
        let lastRequestEntity = '';
        setTimeout(() => {
            let requestXpath = "//th[text()='Entidad']";
            let matchingRequestElement = document.evaluate(requestXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let parentRequestDiv = matchingRequestElement.parentElement;
            lastRequestState = parentRequestDiv.parentElement.nextElementSibling.childNodes[2].childNodes[5].textContent;
            lastRequestEntity = parentRequestDiv.parentElement.nextElementSibling.childNodes[2].childNodes[9].textContent;
            resolve({
                lastRequestState: lastRequestState.trim(),
                lastRequestEntity: lastRequestEntity.trim()
            });
        }, 1000);
    });
};

const getArmoredInfo = async() => {
    return new Promise((resolve) => {
        /*  Requests */
        let armoredTabXpath = "//a[text()=' Información Blindaje']";
        let armored = document.evaluate(armoredTabXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        armored.click();
        let isArmored = '';
        let armorLevel = '';
        setTimeout(() => {
            // Es blindado
            let isArmoredXpath = "//label[text()='Blindado:']";
            let matchingArmoredElement = document.evaluate(isArmoredXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let parentArmoredDiv = matchingArmoredElement.parentElement;
            isArmored = parentArmoredDiv.nextElementSibling.textContent
                // Nivel de blindaje
            let armorLevelXpath = "//label[text()='Nivel de blindaje:']";
            let matchingArmorElement = document.evaluate(armorLevelXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let parentArmorDiv = matchingArmorElement.parentElement;
            armorLevel = parentArmorDiv.nextElementSibling.textContent
            resolve({
                isArmored: isArmored.trim(),
                armorLevel: armorLevel.trim()
            });
        }, 1000);
    });
};

const newRequest = async() => {
    /*  Click the button to make another search */
    let newSearchXpath = "//button[text()='Realizar otra consulta']";
    let newSearchButton = document.evaluate(newSearchXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    newSearchButton.click();
};