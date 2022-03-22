let persistentLayer = require("./PersistentLayer")
const Pushover = require('node-pushover');
var push = new Pushover({
    token: process.env.PUSH_OVERAPI_TOKEN,
    user: process.env.PUSH_OVER_USER_KEY
});

function calculateMean(list) {
    let total = 0;
    let length = list.length;
    for (let index = 0; index < list.length; index++) {
        total += parseFloat(list[index]);
    }
    return total / length;
}


function calculateStandardDeviation(list) {
    let mean = calculateMean(list);
    let total = 0;
    for (let index = 0; index < list.length; index++) {
        const element = list[index];
        total += Math.pow(element - mean, 2);
    }
    let avgOfSquares = total / list.length;
    return Math.sqrt(avgOfSquares);
}
/**
 * https://www.iforex.in/education-center/bollinger-bands#:~:text=Bollinger%20Bands%20consist%20of%203,divide%20that%20value%20by%2020.
 * https://www.mathsisfun.com/data/standard-deviation-formulas.html
 * @param {*} list 
 */
function calculateBollingerBands(list) {
    if (list.length < parseInt(process.env.BOLLINGER_MOVING_WONDOW_LENGTH)) {
        throw "Could not calculate the bollinger bands. Not enough data."
    }
    let bollingerBands = []
    bollingerBands[0] = []
    bollingerBands[1] = []
    bollingerBands[2] = []
    bollingerBands[3] = []
    for (let index = 0; index < list.length - parseInt(process.env.BOLLINGER_MOVING_WONDOW_LENGTH); index++) {
        const element = list[index];
        let subList = list.slice(index, index + parseInt(process.env.BOLLINGER_MOVING_WONDOW_LENGTH));
        let mean = calculateMean(subList)
        bollingerBands[1][index] = mean
        let standardDevMultiplied = (parseFloat(process.env.BOWLLINGER_STANDARD_DEVIATION_MULTIPLY_FACTOR) * calculateStandardDeviation(subList))
        bollingerBands[0][index] = mean - standardDevMultiplied;
        bollingerBands[2][index] = mean + standardDevMultiplied;
        bollingerBands[3][index] = list[index + parseInt(process.env.BOLLINGER_MOVING_WONDOW_LENGTH)];

    }
    return bollingerBands;
}

/**
 * https://school.stockcharts.com/doku.php?id=technical_indicators:relative_strength_index_rsi
 * */
function calculateRSI(list) {
    let windowLength = parseInt(process.env.RSI_MOVING_WONDOW_LENGTH);
    if (windowLength > list.length) {
        throw "Could not calculate RSI data. Not enough data."
    }
    let avgGain = 0;
    let avgLoss = 0;
    rsiValues = []
    for (let index = windowLength - 1; index < list.length; index++) {
        const element = list[index];
        if (index == windowLength - 1) {
            let gainTotal = 0;
            let lossTotal = 0
            for (let index1 = 0; index1 < list.length; index1++) {
                const element1 = list[index1];
                if (element1 > 0) {
                    gainTotal += element1
                } else if (element1 < 0) {
                    lossTotal += (element1 * -1);
                }
            }
            avgGain = gainTotal / parseInt(process.env.RSI_MOVING_WONDOW_LENGTH)
            avgLoss = lossTotal / parseInt(process.env.RSI_MOVING_WONDOW_LENGTH)
            let rs = avgGain / avgLoss;
            let rsi = 100 - (100 / (1 + rs));
            rsiValues[index - windowLength + 1] = rsi;
        } else {
            avgGain = ((avgGain * (windowLength - 1)) + (element > 0 ? element : 0)) / windowLength
            avgLoss = ((avgLoss * (windowLength - 1)) + (element > 0 ? 0 : (element * -1))) / windowLength
            let rs = avgGain / avgLoss;
            let rsi = 100 - (100 / (1 + rs));
            rsiValues[index - windowLength + 1] = rsi;
        }
    }
    return rsiValues;
}

function findProfitablePrice(boughtPrice, profitPercentage) {
    let price = (((100 * profitPercentage * boughtPrice) + (10000 * boughtPrice)) / (100 * 100));
    let ticker_value = parseFloat(process.env.TICKER_VALUE);
    let updatedPrice = (Math.ceil(price / ticker_value)) / ticker_value
    console.log("profitable price : ", price, updatedPrice, boughtPrice, profitPercentage);
    return updatedPrice;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function getCloseList(klineData) {
    let closeList = []
    for (let index = 0; index < klineData.length; index++) {
        const element = klineData[index];
        closeList[index] = parseFloat(element[4]); // (parseFloat(element[4]) + parseFloat(element[2]) + parseFloat(element[3])) / 3;
    }
    return closeList;
}


function preparePrice(price) {
    let priceAsString = price.toString();
    let indexOfDot = priceAsString.indexOf(".");
    if (indexOfDot === -1) {
        return price;
    }
    let precision = parseInt(process.env.PRICE_PRECISION);
    if (precision <= 0) {
        throw "Not suppoerted precision found by the program. : " + precision;
    }
    let len = priceAsString.length;
    return parseFloat(priceAsString.substring(0, indexOfDot + 1 + precision));
}

function prepareQuantity(quantity) {
    let quantityAsString = quantity.toString();
    let indexOfDot = quantityAsString.indexOf(".");
    if (indexOfDot === -1) {
        return quantity;
    }
    let precision = parseInt(process.env.QUANTITY_PRECISION);
    if (precision <= 0) {
        throw "Not suppoerted precision found by the program. : " + precision;
    }
    return parseFloat(quantityAsString.substring(0, indexOfDot + 1 + precision));
}

function notifyUser(title, message) {
    push.send(title, message);
}

function processBuyOrderSubmitted(quantityToBuy, atPrice, stopPrice) {
    persistentLayer.setBuyOrderSubmitted();
    persistentLayer.setLastBuyOrderLimitPrice(atPrice);
    persistentLayer.setStopPrice(stopPrice);
}

function processLimitBuyOrderFilled() {
    persistentLayer.setSellOrderSubmitted();
}

function getSellablePrice() {
    let boughtPrice = persistentLayer.getLastBuyOrderLimitPrice();
    let expectedProfitPerc = persistentLayer.getProfitPercentageExpected();
    let price = (((expectedProfitPerc * boughtPrice / 100) + (boughtPrice)));
    return preparePrice(price);
}

function processSellOrderSubmitted() {
    persistentLayer.setSellOrderSubmitted();
}

function processLimitBuyOrderCanceled() {
    persistentLayer.setCanBuy();

}

function processSellOrderFilled() {
    persistentLayer.setCanBuy();
}

function getChangeListBasedOnVolumes(klineData) {
    let changeList = []
    for (let index = 0; index < klineData.length; index++) {
        const element = klineData[index];
        changeList[index] = ((parseFloat(element[4]) - parseFloat(element[1]))) * parseFloat(element[5]);
    }
    return changeList;
}

module.exports = { calculateMean, calculateStandardDeviation, calculateBollingerBands, calculateRSI, findProfitablePrice, delay, getCloseList, preparePrice, prepareQuantity, notifyUser, processBuyOrderSubmitted, processLimitBuyOrderFilled, getSellablePrice, processSellOrderSubmitted, processLimitBuyOrderCanceled, processSellOrderFilled, getChangeListBasedOnVolumes };