import { tgUser, token, bot } from "./modules/telegram.js";
import { wallet, pairSettings } from "./modules/globals.js";

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

const roundFuncs = () => {
  Number.prototype.round = function (places) {
    return Math.round(this * 10 ** places) / 10 ** places;
  };
  Number.prototype.floor = function (places) {
    return Math.floor(this * 10 ** places) / 10 ** places;
  };
  Number.prototype.ceil = function (places) {
    return Math.ceil(this * 10 ** places) / 10 ** places;
  };
};

// fill settings
const pairsFill = () => {
  let pair = "";

  pair = "BTCUSD";
  pairSettings[pair] = {
    pair: pair,
    minVolBuy: 10,
    minVolSell: 0.0001,
    priceAdd: 0.002, // price 22780,000 - 22780,002
    priceDepth: 3, // price 22780,000 - 3 digits after Zero
    floorDepth: 4, // volume 0.00011111 - 0.00010000
    volDepth: 8, // volume 0.00010000 - 8 digits after Zero
    volCorrection: (1 / 10 ** 8).round(8), // volume 0.00020000 - 0.00019999 (to be different from others)
  };

  pair = "ETHUSD";
  pairSettings[pair] = {
    pair: pair,
    minVolBuy: 10,
    minVolSell: 0.5,
    priceAdd: 0.00002, // price 22780,00000 - 22780,00002
    priceDepth: 5, // price 22780,00000 - 5 digits after Zero
    floorDepth: 4, // volume 0.00011111 - 0.00010000
    volDepth: 8, // volume 0.00010000 - 8 digits after Zero
    volCorrection: (1 / 10 ** 8).round(8), // volume 0.00020000 - 0.00019999 (to be different from others)
  };
};

// update wallet info
const updateWallet = async (number) => {
  const resWallet = await getWallet();
  if (typeof resWallet !== "object") {
    console.log(resWallet);
    return;
  }
  resWallet.forEach((element) => {
    if (element.AssetId.length < 6) {
      if (wallet[element.AssetId] !== element.Balance) {
        wallet[element.AssetId] = element.Balance;
      }
    }
  });
  wallet.date = new Date();
};

const buySell = async (pair, buySell) => {
  const resJson = await getOrderBook(pair);
  if (!resJson || resJson.length !== 2) {
    console.log("getOrderBook error");
    return "getOrderBook error";
  }

  const sellObject = {};
  const buyObject = {};

  let sellIndex = resJson[0].isBuy ? 1 : 0;
  let buyIndex = resJson[0].isBuy ? 0 : 1;

  sellObject.Volume = -resJson[sellIndex].Prices[0].Volume;
  sellObject.Price = resJson[sellIndex].Prices[0].Price;
  buyObject.Volume = resJson[buyIndex].Prices[0].Volume;
  buyObject.Price = resJson[buyIndex].Prices[0].Price;

  sellObject.VolumePrev = -resJson[sellIndex].Prices[1].Volume;
  sellObject.PricePrev = resJson[sellIndex].Prices[1].Price;
  buyObject.VolumePrev = resJson[buyIndex].Prices[1].Volume;
  buyObject.PricePrev = resJson[buyIndex].Prices[1].Price;

  let lastVolumeBuy = buyObject.Volume;
  let lastPriceBuy = buyObject.Price;
  let lastVolumeSell = sellObject.Volume;
  let lastPriceSell = sellObject.Price;

  const val1 = pair.slice(-3); // USD - BTCUSD
  const val2 = pair.slice(0, 3); // BTC - BTCUSD

  let myVolume = 0;

  const settings = pairSettings[pair];

  // ПОКА БЕЗ ПРОВЕРКИ ОБЪЕМА
  if (wallet[val1] > settings.minVolBuy && (!buySell || buySell === 'Buy')) {
     await makeOrder(pair, buyObject, 'Buy', settings)
   }

  // ПОКА БЕЗ ПРОВЕРКИ ОБЪЕМА
  if (wallet[val2] > settings.minVolSell && (!buySell || buySell === 'Sell')) {
    await makeOrder(pair, sellObject, 'Sell', settings)
  }
};

const makeOrder = async (pair, priceObject, typeBuySell, settings) => {

  let lastVolume = priceObject.Volume;
  let lastPrice  = priceObject.Price;
  
  const val = (typeBuySell === 'Sell' ? pair.slice(0, 3) : pair.slice(-3))   // USD - BTCUSD

  const plusMinus = (typeBuySell === 'Sell' ? -1 : 1)

  const myVolume = (
    (wallet[val] / (typeBuySell === 'Sell' ? 1 : priceObject.Price)).floor(settings.floorDepth) -
    settings.volCorrection
  ).round(settings.volDepth);

  if (
    (myVolume === priceObject.Volume) &
    plusMinus*((lastPrice - priceObject.PricePrev).round(settings.priceDepth) >
      settings.priceAdd)
  ) {
    console.log(`Go down to ${priceObject.PricePrev} ${priceObject.VolumePrev} `);
    lastVolume = priceObject.VolumePrev;
    lastPrice  = priceObject.PricePrev;
  }

  if (myVolume !== lastVolume) {
    console.log('myVolume '    + myVolume)
    console.log('lastVolume '  + lastVolume)

    const responseDelete = await cancellAllOrders(pair, typeBuySell);
    console.log('responseDelete ' + responseDelete);

    const postBody = {
      AssetPairId: pair,
      OrderAction: typeBuySell,
      Volume: myVolume,
      Price: (lastPrice + plusMinus * settings.priceAdd).round(settings.priceDepth),
    };
    const response = await setOrder(pair, postBody);
    console.log(response);
  }

};

roundFuncs();
pairsFill();
// console.log(pairSettings);

await cancellAllOrders();
await updateWallet();

setInterval(updateWallet, 5 * 1000);
//await buySell('BTCUSD')
//setInterval(myFunc, intervalSeconds * 1000);
setInterval(function () {
  buySell("ETHUSD", '');
}, intervalSeconds * 1000);
