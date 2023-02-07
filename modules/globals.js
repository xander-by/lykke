import {getWallet} from "./methods.js";

const wallet = {}
const pairSettings = {}
const botOptions = {
    orderIsRunning: false,
    pair: '',
}

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
      minVolume: 0.001,
      minVolBuy: 10,
      minVolSell: 0.001,
      priceAdd: 0.002, // price 22780,000 - 22780,002
      priceDepth: 3, // price 22780,000 - 3 digits after Zero
      floorDepth: 4, // volume 0.00011111 - 0.00010000
      volDepth: 8, // volume 0.00010000 - 8 digits after Zero
      volCorrectionBuy: (1 / 10 ** 8).round(8), // volume 0.00020000 - 0.00019999 (to be different from others)
      volCorrectionSell: (1 / 10 ** 8).round(8), // volume 0.00020000 - 0.00019999 (to be different from others)    
      sufLen: 3,  // 0.000...167
    };
  
    pair = "ETHUSD";
    pairSettings[pair] = {
      pair: pair,
      minVolume: 0.1,
      minVolBuy: 10,
      minVolSell: 0.2,
      priceAdd: 0.00002, // price 22780,00000 - 22780,00002
      priceDepth: 5, // price 22780,00000 - 5 digits after Zero
      floorDepth: 4, // volume 0.00011111 - 0.00010000
      volDepth: 8, // volume 0.00010000 - 8 digits after Zero
      volCorrectionBuy: (1 / 10 ** 8).round(8), // volume 0.00020000 - 0.00019999 (to be different from others)
      volCorrectionSell: (1 / 10 ** 8).round(8), // volume 0.00020000 - 0.00019999 (to be different from others)   
      sufLen: 3,  // 0.000...167      
    };
    
    pair = "USDCHF";
    pairSettings[pair] = {
      pair: pair,
      minVolume: 10,
      minVolBuy: 10,
      minVolSell: 10,
      priceAdd: 0.00002, // price 22780,00000 - 22780,00002
      priceDepth: 5, // price 22780,00000 - 5 digits after Zero
      floorDepth: 4, // volume 0.00011111 - 0.00010000
      volDepth: 2, // volume 0.00010000 - 8 digits after Zero
      volCorrectionBuy: (1 / 10 ** 2).round(2), // volume 0.00020000 - 0.00019999 (to be different from others)
      volCorrectionSell: (1 / 10 ** 2).round(2), // volume 0.00020000 - 0.00019999 (to be different from others)   
      sufLen: 2,  // 0.000...167      
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

export { updateWallet, roundFuncs, pairsFill, wallet, pairSettings, botOptions};