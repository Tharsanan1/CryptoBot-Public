const exchangeCommunicator = require("./ExchangeCommunicator");
const utils = require("./Utils");
let logger = require("./Logger")

function getBuyableLimitPrice() {
    return new Promise(async (resolve, reject) => {
        try {
            let askPrice = parseFloat(await exchangeCommunicator.getAskPrice());
            let bidPrice = parseFloat(await exchangeCommunicator.getBidPrice());
            price = (askPrice + bidPrice) / 2;
            let klineData = await exchangeCommunicator.getCandles(process.env.SYMBOL, process.env.BOLLINGER_TICK_INTERVAL_SMALL, process.env.BOLLINGER_SAMPLE_SIZE)
            
            let closePriceList = utils.getCloseList(klineData);
            let bollingList = utils.calculateBollingerBands(closePriceList);
            let bollingLowerBandList = bollingList[0];
            let bollingListLowerBandLength = bollingLowerBandList.length;
            let bollingMeanBandList = bollingList[1];
            let bollingListMeanBandListLength = bollingMeanBandList.length;
            let bollingUpperBandList = bollingList[2];
            let bollingListUpperBandLength = bollingUpperBandList.length; 
            let bollingerBandLowerBandPrice = bollingLowerBandList[bollingListLowerBandLength-1];
            let bollingerBandMeanBandPrice = bollingMeanBandList[bollingListMeanBandListLength-1];
            let bollingerBandUpperBandPrice = bollingUpperBandList[bollingListUpperBandLength - 1];
            logger.debug(`Bollinger lower band : ${bollingerBandLowerBandPrice}, mean : ${bollingerBandMeanBandPrice}, Upper : ${bollingerBandUpperBandPrice}`)
            let priceDifferencePercentage = (price - bollingerBandLowerBandPrice) / (bollingerBandMeanBandPrice - bollingerBandLowerBandPrice) * 100;
            let bollingerBandWidthPercentage = (bollingerBandUpperBandPrice - bollingerBandLowerBandPrice) / bollingerBandLowerBandPrice * 100;
            if (bollingerBandWidthPercentage < parseFloat(process.env.BOLLINGER_BAND_WIDTH_MIN_PERC)) {
                logger.debug("Returning false for isBuyable because band width is not enough : " + bollingerBandWidthPercentage)
                resolve({
                    isBuyable: false,
                    limitPrice: 100000000, 
                    stopPrice: bollingerBandMeanBandPrice
                });
                return;
            }
            logger.debug("Price difference percentage : " + priceDifferencePercentage)
            if (priceDifferencePercentage <= parseFloat(process.env.SUBMIT_BUY_ORDER_IF_PRICE_COMES_LESS_THAN_PERCENTAGE)) {
                let volumeBasedChangeList = utils.getChangeListBasedOnVolumes(klineData);
                let msiData = utils.calculateRSI(volumeBasedChangeList);
                let msiValue = msiData[msiData.length - 1];
                if (msiValue < process.env.MSI_LOWER_BOUND) {
                    resolve({
                        isBuyable: true,
                        limitPrice: bollingerBandLowerBandPrice,
                        stopPrice: bollingerBandMeanBandPrice
                    })
                    return
                }
                logger.debug("MSI indicator value is not within the limit. MSI value : " + msiValue)
            }
            logger.debug("Price difference percentage is not enough. : " + priceDifferencePercentage);
            resolve({
                isBuyable: false,
                limitPrice: 10000000,
                stopPrice: bollingerBandMeanBandPrice
            });
            return;
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { getBuyableLimitPrice };