import { tgUser, token, bot } from "./modules/telegram.js";
import { updateWallet, roundFuncs, pairsFill, wallet, pairSettings, botOptions } from "./modules/globals.js";

import {
  getWallet,
  getOrderBook,
  cancellAllOrders,
  setOrder,
} from "./modules/methods.js";
import dotenv from "dotenv";

dotenv.config();

const intervalSeconds = 1;

let lastDate = new Date();
let orders = {};

const buySell = async (pair, buySell) => {
  // order is executing now
  if (botOptions.orderIsRunning) {
    //console.log('is running...')
    return;
  }

  const settings = pairSettings[pair];

  const resOrdersArray = await getOrderBook(pair);
  if (!resOrdersArray || resOrdersArray.length !== 2) {
    console.log("getOrderBook error");
    return "getOrderBook error";
  }

  const val1 = pair.slice(-3);   // USD - BTCUSD
  const val2 = pair.slice(0, 3); // BTC - BTCUSD

  let myVolume = 0;

  // ПОКА БЕЗ ПРОВЕРКИ ОБЪЕМА
  if (wallet[val1] > settings.minVolBuy && (!buySell || buySell === "Buy")) {
    await makeOrder(pair, resOrdersArray, "Buy", settings);
  }

  // ПОКА БЕЗ ПРОВЕРКИ ОБЪЕМА
  if (wallet[val2] > settings.minVolSell && (!buySell || buySell === "Sell")) {
    await makeOrder(pair, resOrdersArray, "Sell", settings);
  }
};

// MAKE ORDER FUNCTION
const makeOrder = async (pair, resOrdersArray, typeBuySell, settings) => {

  let index = undefined;
  let firstValue = undefined;
  let ourOrderExist = false
  const plusMinus = typeBuySell === "Sell" ? -1 : 1;
  const val = (typeBuySell === "Sell") ? pair.slice(0, 3) : pair.slice(-3); // USD - BTCUSD

  if (typeBuySell === "Buy")  index = resOrdersArray[0].isBuy ? 0 : 1;
  if (typeBuySell === "Sell") index = resOrdersArray[0].isBuy ? 1 : 0;

  for (const el of resOrdersArray[index].Prices) {
    if (el.Volume.toString().slice(-3) === settings.suffix) ourOrderExist = true
    if (plusMinus * el.Volume >= settings.minVolume &&
      el.Volume.toString().slice(-3) !== settings.suffix) {
      firstValue = el;
      break;
    }
  }

  // CHECK IF VERY CLOSE TO OTHER SIDE
  // firstValue.Price

  const myVolume = ((wallet[val] / (typeBuySell === "Sell" ? 1 : firstValue.Price))
      .floor(settings.floorDepth) - settings.volCorrection).round(settings.volDepth);

  if (!ourOrderExist) {
    botOptions.orderIsRunning = true;

    await cancellAllOrders(pair, typeBuySell);

    const postBody = {
        AssetPairId: pair,
        OrderAction: typeBuySell,
        Volume: myVolume,
        Price: (firstValue.Price + plusMinus * settings.priceAdd)
          .round(settings.priceDepth),
    };
    const response = await setOrder(pair, postBody);

    botOptions.orderIsRunning = false;
    //console.log(response);
  }
  
  //else console.log('not changed...')

};

roundFuncs();
pairsFill();
// console.log(pairSettings);

await cancellAllOrders();
await updateWallet();

setInterval(updateWallet, 5 * 1000);
// await buySell("ETHUSD", '');

setInterval(function () {
 buySell("ETHUSD", '')}, intervalSeconds * 1000);
