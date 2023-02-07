import { tgUser, token, bot } from "./modules/telegram.js";
import { updateWallet, roundFuncs, pairsFill, wallet, pairSettings } from "./modules/globals.js";

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

  const settings = pairSettings[pair];

    // order is executing now
    if (settings.orderIsRunning) {
      return;
    }

  const resOrdersArray = await getOrderBook(pair);
  if (!resOrdersArray || resOrdersArray.length !== 2) {
    console.log("getOrderBook error");
    return "getOrderBook error";
  }

  const val1 = pair.slice(-3);   // USD - BTCUSD
  const val2 = pair.slice(0, 3); // BTC - BTCUSD

  let myVolume = 0;

  // ПОКА БЕЗ ПРОВЕРКИ ОБЪЕМА
  if (wallet[val1] > settings.minMyVolBuy && (!buySell || buySell === "Buy")) {
    await makeOrder(pair, resOrdersArray, "Buy", settings);
  }

  // ПОКА БЕЗ ПРОВЕРКИ ОБЪЕМА
  if (wallet[val2] > settings.minMyVolSell && (!buySell || buySell === "Sell")) {
    await makeOrder(pair, resOrdersArray, "Sell", settings);
  }
};

// MAKE ORDER FUNCTION
const makeOrder = async (pair, resOrdersArray, typeBuySell, settings) => {

  let index = undefined;
  let firstValue = undefined;
  let ourOrderExist = false
  const plusMinus = typeBuySell === "Sell" ? -1 : 1;
  const val = (typeBuySell === "Sell") ? pair.slice(0, 3) : pair.slice(-settings.sufLen); // USD - BTCUSD
  
  let suffix = 0
  if (typeBuySell === "Sell") suffix = settings.volCorrectionSell.toFixed(settings.volDepth).slice(-settings.sufLen)
  else                        suffix = settings.volCorrectionBuy.toFixed(settings.volDepth).slice(-settings.sufLen)
   
  const randomNumber = Math.floor(Math.random() * 10**(settings.sufLen))+1 
  const newVolCorrection = randomNumber/10**settings.volDepth  

  if (typeBuySell === "Buy")  index = resOrdersArray[0].isBuy ? 0 : 1;
  if (typeBuySell === "Sell") index = resOrdersArray[0].isBuy ? 1 : 0;

  for (const el of resOrdersArray[index].Prices) {
    let isOur = false
    if (+el.Volume.toString().slice(-settings.sufLen) === (10**settings.sufLen - +suffix)) {
       ourOrderExist = true
       isOur = true
       }

    if (Math.abs(el.Volume) >= settings.minVolume && !isOur) {
        firstValue = el;
        break;
    }
  }

   // CHECK IF VERY CLOSE TO OTHER SIDE
   // firstValue.Price
   const myPrice = (firstValue.Price + plusMinus * settings.priceAdd)
          .round(settings.priceDepth)

   if (!ourOrderExist || Math.abs(firstValue.Price - myPrice) > settings.priceAdd ) {
   
       if (typeBuySell === "Sell")  settings.volCorrectionSell = newVolCorrection
       else                         settings.volCorrectionBuy  = newVolCorrection

       const myVolume = ((wallet[val] / (typeBuySell === "Sell" ? 1 : firstValue.Price))
          .floor(settings.floorVolume) - newVolCorrection).round(settings.volDepth);
    
        // ********************
        settings.orderIsRunning = true;
        await cancellAllOrders(pair, typeBuySell);
        const postBody = {
            AssetPairId: pair,
            OrderAction: typeBuySell,
            Volume: myVolume,
            Price:  myPrice,
        };
        const response = await setOrder(pair, postBody);
        settings.orderIsRunning = false;
        // ********************    

   }
  
 // else console.log('not changed... ' + pair)

};

roundFuncs();
pairsFill();
// console.log(pairSettings);

await cancellAllOrders();
await updateWallet();

setInterval(updateWallet, 5 * 1000);
// await buySell("ETHUSD", '');

setInterval(function () {
   buySell("ETHUSD", 'Sell')}, intervalSeconds * 1000);

setInterval(function () {
   buySell("USDCHF", 'Sell')}, intervalSeconds * 1000);