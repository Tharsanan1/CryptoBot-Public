const axios = require('axios');
var CryptoJS = require("crypto-js");
const logger = require("./Logger");

function getCandleData(symbol, tick_interval, limit) {
    return new Promise((resolve, reject) => {
        let url = `${process.env.BINANCE_BASE_URL}${process.env.BINANCE_KLINE_RELATIVE_URL}?symbol=${symbol}&interval=${tick_interval}&limit=${limit}`;
        ;
        axios
            .get(url)
            .then((res) => {
                resolve(res.data);
                return
            })
            .catch((error) => {
                logger.error(JSON.stringify(error))
                reject(error);
                return
            });
    });
}

function getAccountDetails() {
    return new Promise((resolve, reject) => {
        let timestamp = new Date().getTime();
        let signature = CryptoJS.HmacSHA256(`timestamp=${timestamp}`, process.env.API_SECRET);
        let url = `${process.env.BINANCE_BASE_URL}${process.env.BINANCE_ACCOUNT_DETAIL_RELATIVE_URL}?timestamp=${timestamp}&signature=${signature}`
        axios({
            url: url,
            method: "get",
            headers: {
                'Content-Type': 'application/json',
                'X-MBX-APIKEY': process.env.API_KEY,
                'Accept': "*/*"
            }
        })
            .then((response) => {
                resolve(response.data)
                return
            })
            .catch((error) => {

                logger.error(JSON.stringify(error))
                reject(error)
                return
            })

    });
}

function getBalances() {
    return new Promise((resolve, reject) => {
        getAccountDetails().then(data => {
            
            let balances = []
            for (let index = 0; index < data.balances.length; index++) {
                const element = data.balances[index];
                let balance = {
                    coin : element.asset,
                    free : element.free
                }
                balances.push(balance);
            }
            resolve(balances);
        }).catch(error => {
            logger.error(JSON.stringify(error))
            reject(error);
            return
        })
    })
}

function getCurrentOpenOrders() {
    return new Promise((resolve, reject) => {
        let timestamp = new Date().getTime();
        let signature = CryptoJS.HmacSHA256(`timestamp=${timestamp}`, process.env.API_SECRET);
        let url = `${process.env.BINANCE_BASE_URL}${process.env.BINANCE_OPEN_ORDER_RELATIVE_URL}?timestamp=${timestamp}&signature=${signature}`

        axios({
            url: url,
            method: "get",
            headers: {
                'Content-Type': 'application/json',
                'X-MBX-APIKEY': process.env.API_KEY,
                'Accept': "*/*"
            }
        })
            .then((response) => {
                resolve(response.data)
                return
            })
            .catch((error) => {
                logger.error(JSON.stringify(error))
                reject(error)
                return
            })

    });
}

function getSymbolBookTicker() {
    return new Promise((resolve, reject) => {
        let url = `${process.env.BINANCE_BASE_URL}${process.env.BINANCE_SYMBOL_BOOK_TICKER_RELATIVE_PATH}?symbol=${process.env.SYMBOL}`;

        axios
            .get(url)
            .then((res) => {
                resolve(res.data);
                return
            })
            .catch((error) => {
                logger.error(JSON.stringify(error))
                reject(error);
                return
            });
    });
}

function getAskPrice() {
    return new Promise((resolve, reject) => {
        getSymbolBookTicker().then(data => {
            resolve(parseFloat(data.askPrice))
        }).catch(error => {
            logger.error(JSON.stringify(error))
            reject(error);
        })
    })
}

function getBidPrice() {
    return new Promise((resolve, reject) => {
        getSymbolBookTicker().then(data => {
            resolve(parseFloat(data.bidPrice))
        }).catch(error => {
            logger.error(JSON.stringify(error))
            reject(error);
        })
    })
}

function getSymbolPriceTicker() {
    return new Promise((resolve, reject) => {
        let url = `${process.env.BINANCE_BASE_URL}${process.env.BINANCE_SYMBOL_PRICE_TICKER_RELATIVE_PATH}?symbol=${process.env.SYMBOL}`;

        axios
            .get(url)
            .then((res) => {
                resolve(res.data);
                return
            })
            .catch((error) => {
                logger.error(JSON.stringify(error))
                reject(error);
                return
            });
    });
}

function transferAtMarket(isBuy, quantity, isQuoteOrderQty, isTest) {
    return new Promise((resolve, reject) => {
        
        let timestamp = new Date().getTime();
        let qtyKey = isQuoteOrderQty ? "quoteOrderQty" : "quantity"
        let side = isBuy ? "BUY" : "SELL"
        let qParams = `symbol=${process.env.SYMBOL}&side=${side}&type=MARKET&${qtyKey}=${quantity}&timestamp=${timestamp}`
        let signature = CryptoJS.HmacSHA256(qParams, process.env.API_SECRET);
        let relative_url = isTest ? process.env.BINANCE_TEST_ORDER_RELATIVE_URL : process.env.ORDER_RELATIVE_URL
        let url = `${process.env.BINANCE_BASE_URL}${relative_url}?${qParams}&signature=${signature}`

        axios({
            url: url,
            method: "post",
            headers: {
                'Content-Type': 'application/json',
                'X-MBX-APIKEY': process.env.API_KEY,
                'Accept': "*/*"
            }
        })
            .then((response) => {
                resolve(response.data)
                return
            })
            .catch((error) => {
                logger.error(JSON.stringify(error))
                reject(error);
                return
            });
    });
}

function cancelOrder(orderId) {
    return new Promise(async (resolve, reject) => {
        let timestamp = new Date().getTime();
        let qParams = `symbol=${process.env.SYMBOL}&timestamp=${timestamp}&origClientOrderId=${orderId}`
        let signature = CryptoJS.HmacSHA256(qParams, process.env.API_SECRET);
        let relative_url = process.env.BINANCE_ORDER_RELATIVE_URL
        let url = `${process.env.BINANCE_BASE_URL}${relative_url}?${qParams}&signature=${signature}`

        axios({
            url: url,
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                'X-MBX-APIKEY': process.env.API_KEY,
                'Accept': "*/*"
            }
        })
            .then((response) => {
                resolve(response.data)
                return
            })
            .catch((error) => {
                logger.error(JSON.stringify(error))
                reject(error);
                return
            });
    })
}

function submitLimitSellOrder(quantity, price) {
    return new Promise(async (resolve, reject) => {
        let timestamp = new Date().getTime();
        let qParams = `symbol=${process.env.SYMBOL}&side=SELL&type=LIMIT&quantity=${quantity}&timestamp=${timestamp}&timeInForce=GTC&newClientOrderId=${process.env.ORDER_ID}&price=${price}`
        let signature = CryptoJS.HmacSHA256(qParams, process.env.API_SECRET);
        let relative_url = process.env.BINANCE_ORDER_RELATIVE_URL
        let url = `${process.env.BINANCE_BASE_URL}${relative_url}?${qParams}&signature=${signature}`

        axios({
            url: url,
            method: "post",
            headers: {
                'Content-Type': 'application/json',
                'X-MBX-APIKEY': process.env.API_KEY,
                'Accept': "*/*"
            }
        })
            .then((response) => {
                resolve(response.data)
                return
            })
            .catch((error) => {
                logger.error(JSON.stringify(error))
                reject(error);
                return
            });
    })
}


function submitLimitBuyOrder(quantity, price) {
    return new Promise(async (resolve, reject) => {
        let timestamp = new Date().getTime();
        let qParams = `symbol=${process.env.SYMBOL}&side=BUY&type=LIMIT&quantity=${quantity}&timestamp=${timestamp}&timeInForce=GTC&newClientOrderId=${process.env.ORDER_ID}&price=${price}`
        let signature = CryptoJS.HmacSHA256(qParams, process.env.API_SECRET);
        let relative_url = process.env.BINANCE_ORDER_RELATIVE_URL
        let url = `${process.env.BINANCE_BASE_URL}${relative_url}?${qParams}&signature=${signature}`

        axios({
            url: url,
            method: "post",
            headers: {
                'Content-Type': 'application/json',
                'X-MBX-APIKEY': process.env.API_KEY,
                'Accept': "*/*"
            }
        })
            .then((response) => {
                resolve(response.data)
                return
            })
            .catch(async (error) => {
                logger.error(JSON.stringify(error))
                reject(error);
                return
            });
    })
}


function checkOrderStatus(orderId) {
    return new Promise((resolve, reject) => {
        let timestamp = new Date().getTime();
        let qParams = `symbol=${process.env.SYMBOL}&timestamp=${timestamp}&origClientOrderId=${orderId}`
        let signature = CryptoJS.HmacSHA256(qParams, process.env.API_SECRET);
        let relative_url = process.env.BINANCE_ORDER_STATUS_RELATIVE_URL
        let url = `${process.env.BINANCE_BASE_URL}${relative_url}?${qParams}&signature=${signature}`

        axios({
            url: url,
            method: "get",
            headers: {
                'Content-Type': 'application/json',
                'X-MBX-APIKEY': process.env.API_KEY,
                'Accept': "*/*"
            }
        })
            .then((response) => {
                resolve(response.data)
                return
            })
            .catch((error) => {
                logger.error(JSON.stringify(error))
                reject(error);
                return
            });
    })

}



module.exports = { getCandleData, getAccountDetails, getCurrentOpenOrders, getSymbolBookTicker, getSymbolPriceTicker, transferAtMarket, cancelOrder, checkOrderStatus, getAskPrice, getBidPrice, submitLimitSellOrder, submitLimitBuyOrder, getBalances };