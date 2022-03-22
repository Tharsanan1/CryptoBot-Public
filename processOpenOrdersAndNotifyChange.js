require('dotenv').config();
const Pushover = require('node-pushover');
const utils = require("./BinanceExchangeCommunicator");
const fs = require("fs");

processDataInInterval();

var push = new Pushover({
    token: process.env.PUSH_OVERAPI_TOKEN,
    user: process.env.PUSH_OVER_USER_KEY
});

const FILE_PATH = "./data/open_orders.json";
function processDataInInterval() {
    let interval = setInterval(async function () {
        const data = await utils.getCurrentOpenOrders();
        const lastOpenOrders = JSON.parse(fs.readFileSync(FILE_PATH));
        const newOrders = []
        const partiallyFilledOrders = []
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            let isNewOrder = true;
            for (let index1 = 0; index1 < lastOpenOrders.length; index1++) {
                const element1 = lastOpenOrders[index1];
                if (parseInt(element.orderId) === parseInt(element1.orderId)) {
                    isNewOrder = false;
                    if (parseFloat(element.executedQty) > parseFloat(element1.executedQty)) {
                        partiallyFilledOrders.push(element);
                    }
                }
            }
            if (isNewOrder) {
                newOrders.push(element);
            }

        }
        const filledOrders = []
        for (let index = 0; index < lastOpenOrders.length; index++) {
            const element = lastOpenOrders[index];
            let isOrderFilled = true;
            for (let index1 = 0; index1 < data.length; index1++) {
                const element1 = data[index1];
                if (parseInt(element.orderId) === parseInt(element1.orderId)) {
                    isOrderFilled = false;
                }
            }
            if (isOrderFilled) {
                filledOrders.push(element);
            }

        }
        fs.writeFileSync(FILE_PATH, JSON.stringify(data));

        let message = "";
        for (let index = 0; index < newOrders.length; index++) {
            const element = newOrders[index];
            message += "Symbol " + element.symbol + " , " + "New " + element.side + " order is placed. \n";
        }

        for (let index = 0; index < filledOrders.length; index++) {
            const element = filledOrders[index];
            message += "Symbol " + element.symbol + " , " + element.side + " order is FILLED or Cancelled. \n";
        }

        for (let index = 0; index < partiallyFilledOrders.length; index++) {
            const element = partiallyFilledOrders[index];
            message += "Already Placed " + element.side + " is now PARTIALLY FILLED, order qty : " + element.origQty + " executed order : " + element.executedQty;
        }

        if (message !== "") {
            push.send("Open Orders", message);
        }
    }, parseInt(process.env.TIMER_INTERVAL_OPEN_ORDERS));
}
