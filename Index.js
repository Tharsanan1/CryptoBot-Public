require('dotenv').config();
const logger = require("./Logger")
let persistentLayer = require("./PersistentLayer");
const exchangeCommunicator = require("./ExchangeCommunicator");
const strategy = require("./Strategy")
const utils = require("./Utils")


async function main() {
    try {
        await utils.delay(200);
        if (persistentLayer.canBuy()) {
            logger.debug("Going to buy path. can buy call satisfied.")
            if (process.env.USE_ALL_FUNDS) {
                // need to implement the all in investment
                throw "this path is not implemented yet."
            } else {
                let quantityToInvestQuoteAsset = parseInt(process.env.QUOTE_ASSET_USABLE_LIMIT);
                logger.debug("Quantity to invest from configuration : " + quantityToInvestQuoteAsset)
                let availableQuoteAssetQty = parseFloat(await exchangeCommunicator.getAvailableQuantityOfQuoteAsset());
                logger.debug("available quote asset qty : " + availableQuoteAssetQty)
                if (quantityToInvestQuoteAsset <= availableQuoteAssetQty) {
                    // Intentionally left blank as for now we dont have any logic affecting this path.
                } else {
                    quantityToInvestQuoteAsset = availableQuoteAssetQty;
                    if (quantityToInvestQuoteAsset <= 0) {
                        throw "Something went wrong. Amount to invest is 0."
                    }
                }
                logger.debug("Going to the submitBuy order with quote asset qty : " + quantityToInvestQuoteAsset)
                submitBuyOrder(quantityToInvestQuoteAsset).catch(error => { logger.log(error) });
                return
            }
        } else if (persistentLayer.buyOrderSubmitted()) {
            checkbuyOrderStatus().catch(error => { logger.log(error) });;
            return;
        } else if (persistentLayer.sellOrderSubmitted()) {
            checkSellOrderStatus().catch(error => { logger.log(error) });;
            return
        } else {
            throw "Unexpected path. "
        }
    } catch (error) {
        logger.error("Critical error occured while retrieving account details.", "\n");
        if (error.response) {
            logger.error(error.response.data);
            logger.error(error.response.status);
            logger.error(error.response.headers);
        }
        utils.notifyUser("Error Occured", "Critical error occured at main. : " + JSON.stringify(error));
    }
}


async function submitBuyOrder(quantityToInvestQuoteAsset) {
    try {
        let { isBuyable, limitPrice, stopPrice } = await strategy.getBuyableLimitPrice();
        if (isBuyable) {
            // We are good to go with the purchace. 
            let quantityToBuy = utils.prepareQuantity(quantityToInvestQuoteAsset / limitPrice);
            let atPrice = utils.preparePrice(limitPrice);
            await exchangeCommunicator.submitLimitBuyOrder(quantityToBuy, atPrice)

            utils.processBuyOrderSubmitted(quantityToBuy, atPrice, stopPrice);
            main();
            return;

        }
        setTimeout(() => {
            submitBuyOrder(quantityToInvestQuoteAsset);
        }, parseInt(process.env.TIMER_INTERVAL_BUY));
    } catch (error) {
        logger.error("Critical error occured while submitting the buy order");
        if (error.response) {
            logger.error(error.response.data);
            logger.error(error.response.status);
            logger.error(error.response.headers);
        }
        throw error;
    }
}

async function checkbuyOrderStatus() {
    try {
        logger.debug("Checking buy order status.")
        let filledFlag = await exchangeCommunicator.isOrderFilled(process.env.ORDER_ID);
        logger.debug("Checking buy order status. Filled status : " + filledFlag);
        if (filledFlag) {
            //utils.processLimitBuyOrderFilled();
            utils.notifyUser("Transaction success : Buy order", "Buy order filled at price : " + persistentLayer.getLastBuyOrderLimitPrice());
            let sellOrderLimitPrice = utils.preparePrice(utils.getSellablePrice());
            let sellableBaseAssetQuantity = utils.prepareQuantity(await exchangeCommunicator.getAvailableQuantityOfBaseAsset());
            logger.debug(`Going to place a sell order : sellOrderLimitPrice : ${sellOrderLimitPrice}, sellableBaseAssetQty : ${sellableBaseAssetQuantity}`)
            await exchangeCommunicator.submitLimitSellOrder(sellableBaseAssetQuantity, sellOrderLimitPrice);
            utils.processSellOrderSubmitted();
            main();
            return;
        } else {
            let bidPrice = await exchangeCommunicator.getBidPrice();
            logger.debug(`Current price : ${bidPrice}, Order price ${persistentLayer.getLastBuyOrderLimitPrice()}, stop price : ${persistentLayer.getStopPrice()}`)
            if (bidPrice > persistentLayer.getStopPrice()) {
                logger.debug(`Current price is greater than stop price. Current price ${bidPrice}, stop rice : ${persistentLayer.getStopPrice()}`);
                // cancel order.
                exchangeCommunicator.cancelOrder(process.env.ORDER_ID);
                utils.processLimitBuyOrderCanceled();
                main();
                return;
            }
        }
        setTimeout(() => {
            checkbuyOrderStatus();
        }, parseInt(process.env.TIMER_INTERVAL_STATUS))
    } catch (error) {
        logger.error("Critical error occured while checking buying order or submitting sell order.");
        if (error.response) {
            logger.error(error.response.data);
            logger.error(error.response.status);
            logger.error(error.response.headers);
            utils.notifyUser("Error Occured", JSON.stringify());
        } else {
            utils.notifyUser("Error Occured", "Critical error occured while checking buying order or submitting sell order.");
        }
        throw error;
    }
}

async function checkSellOrderStatus() {
    try {
        logger.debug("Checking sell order status");
        let filledFlag = await exchangeCommunicator.isOrderFilled(process.env.ORDER_ID);
        let currentAskPrice = await exchangeCommunicator.getAskPrice()
        logger.debug("Sell order status : " + filledFlag + " order price : " + utils.getSellablePrice());
        if (filledFlag) {
            utils.processSellOrderFilled();
            utils.notifyUser("Transaction success : Sell order", "Order filled at price : " + utils.getSellablePrice() + " current price : " + currentAskPrice);
            main();
            return
        }
        setTimeout(() => {
            checkSellOrderStatus();
        }, parseInt(process.env.TIMER_INTERVAL_STATUS))
    } catch (error) {
        logger.error("Critical error occured while checking sell order.");
        if (error.response) {
            logger.error(error.response.data);
            logger.error(error.response.status);
            logger.error(error.response.headers);
            utils.notifyUser("Error Occured", JSON.stringify());
        } else {
            utils.notifyUser("Error Occured", "Critical error occured while checking sell order.");
        }

        throw error;
    }
}

main().catch(error => {
    logger.error(error);
    utils.notifyUser("Error Occured", "Critical error occured at main. : " + JSON.stringify(error));
})