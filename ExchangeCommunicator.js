const binanceExchangeCommunicator = require("./BinanceExchangeCommunicator");
const BINANCE_EXCHANGE = "BINANCE";
const communicator = getCommunicator();
const FILLED = "FILLED"

function getCommunicator() {
    if (BINANCE_EXCHANGE === process.env.CURRENT_EXCHANGE) {
        return binanceExchangeCommunicator;
    }
    throw "Unexpected exchange found in the persistent layer"
}

function getCandles(symbol, tick_interval, limit) {
    return new Promise((resolve, reject) => {
        communicator.getCandleData(symbol, tick_interval, limit).then(data => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        })
    })
}

function getAccountDetails() {
    return new Promise((resolve, reject) => {
        communicator.getAccountDetails().then(data => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        })
    })
}

function getCurrentOpenOrders() {
    return new Promise((resolve, reject) => {
        communicator.getCurrentOpenOrders().then(data => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        })
    })
}

function getAskPrice() {
    return new Promise((resolve, reject) => {
        communicator.getAskPrice().then(data => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        })
    })
}

function getBidPrice() {
    return new Promise((resolve, reject) => {
        communicator.getBidPrice().then(data => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        })
    })
}

function cancelOrder(orderId) {
    return new Promise((resolve, reject) => {
        communicator.cancelOrder(orderId).then(data => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        })
    })
}

function submitLimitSellOrder(quantityToSell, atPrice) {
    return new Promise((resolve, reject) => {
        communicator.submitLimitSellOrder(quantityToSell, atPrice).then(data => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        })
    })
}

function submitLimitBuyOrder(quantityToBuy, atPrice) {
    return new Promise((resolve, reject) => {
        communicator.submitLimitBuyOrder(quantityToBuy, atPrice).then(data => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        })
    })
}

function checkOrderStatus(orderId) {
    return new Promise((resolve, reject) => {
        communicator.checkOrderStatus(orderId).then(data => {
            resolve(data);
        }).catch((error) => {
            reject(error);
        })
    })
}

function isOrderFilled (orderId) {
    return new Promise((resolve, reject) => {
        checkOrderStatus(orderId).then(data => {
            if (data.status === FILLED) {
                resolve(true);
                return;
            }
            resolve(false)
            return;
        }).catch(error => {
            reject(error);
        })
    })
}

function getAvailableQuantityOfQuoteAsset() {
    return new Promise((resolve, reject) => {
        communicator.getBalances().then(data => {
            
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                if (element.coin === process.env.QUOTE_ASSET) {
                    resolve(parseFloat(element.free));
                    return;
                }
            }
        }).catch(error => {
            reject(error);
        })
    })
}

function getAvailableQuantityOfBaseAsset() {
    return new Promise((resolve, reject) => {
        communicator.getBalances().then(data => {
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                if (element.coin === process.env.BASE_ASSET) {
                    resolve(parseFloat(element.free));
                    return;
                }
            }
        }).catch(error => {
            reject(error);
        })
    })
}



module.exports = { getCommunicator, getCandles, getAccountDetails, getCurrentOpenOrders, getAskPrice, getBidPrice, cancelOrder, submitLimitSellOrder, submitLimitBuyOrder, checkOrderStatus, getAvailableQuantityOfQuoteAsset, getAvailableQuantityOfBaseAsset, isOrderFilled };