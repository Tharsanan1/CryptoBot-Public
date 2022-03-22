const fs = require("fs");
const RUNTIME_STATUS_YET_TO_BUY = "YET_TO_BUY"
const RUNTIME_STATUS_BUY_ORDER_SUBMITTED = "BUY_ORDER_SUBMITTED"
const RUNTIME_STATUS_SELL_ORDER_SUBMITTED = "SELL_ORDER_SUBMITTED"
const DATA_FILE_PATH = "./data/trade_data.json"

function getLastBuyOrderLimitPrice() {
    const data = fs.readFileSync(DATA_FILE_PATH);
    let jsondata = JSON.parse(data);
    return parseFloat(jsondata.buyOrderLimitPrice);
}

function setLastBuyOrderLimitPrice(price) {
    const data = fs.readFileSync(DATA_FILE_PATH);
    let jsondata = JSON.parse(data);
    jsondata.buyOrderLimitPrice = price;
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(jsondata));
}

function setRuntimeStatus(status) {
    const data = fs.readFileSync(DATA_FILE_PATH);
    let jsondata = JSON.parse(data);
    jsondata.runtimeStatus = status;
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(jsondata));
}

function getRuntimeStatus() {
    const data = fs.readFileSync(DATA_FILE_PATH);
    let jsondata = JSON.parse(data);
    return jsondata.runtimeStatus;
}

function canBuy() {
    if (RUNTIME_STATUS_YET_TO_BUY === getRuntimeStatus()) {
        return true;
    }
    return false;
}

function setCanBuy() {
    setRuntimeStatus(RUNTIME_STATUS_YET_TO_BUY);
}

function buyOrderSubmitted() {
    if (RUNTIME_STATUS_BUY_ORDER_SUBMITTED === getRuntimeStatus()) {
        return true;
    }
    return false;
}

function setBuyOrderSubmitted() {
    setRuntimeStatus(RUNTIME_STATUS_BUY_ORDER_SUBMITTED);
}

function sellOrderSubmitted() {
    if (RUNTIME_STATUS_SELL_ORDER_SUBMITTED === getRuntimeStatus()) {
        return true;
    }
    return false;
}

function setSellOrderSubmitted() {
    setRuntimeStatus(RUNTIME_STATUS_SELL_ORDER_SUBMITTED);
}

function getProfitPercentageExpected() {
    const data = fs.readFileSync(DATA_FILE_PATH);
    let jsondata = JSON.parse(data);
    return parseFloat(jsondata.profitPercentageExpected);
}

function setStopPrice(stopPrice) {
    const data = fs.readFileSync(DATA_FILE_PATH);
    let jsondata = JSON.parse(data);
    jsondata.stopPrice = stopPrice;
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(jsondata));
}

function getStopPrice() {
    const data = fs.readFileSync(DATA_FILE_PATH);
    let jsondata = JSON.parse(data);
    return parseFloat(jsondata.stopPrice);
}

module.exports = { getLastBuyOrderLimitPrice, setLastBuyOrderLimitPrice, setRuntimeStatus, getRuntimeStatus, canBuy, buyOrderSubmitted, sellOrderSubmitted, setCanBuy, setBuyOrderSubmitted, setSellOrderSubmitted, getProfitPercentageExpected, setStopPrice, getStopPrice };