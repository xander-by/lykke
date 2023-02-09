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

const intervalSeconds = 1.5;

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
  let ourPriceInOrder = 0;
  const plusMinus = typeBuySell === "Sell" ? -1 : 1;
  const val = (typeBuySell === "Sell") ? pair.slice(0, 3) : pair.slice(-settings.sufLen); // USD - BTCUSD
  
  let suffix = 0
  if (typeBuySell === "Sell") suffix = settings.volCorrectionSell.toFixed(settings.volDepth).slice(-settings.sufLen)
  else                        suffix = settings.volCorrectionBuy.toFixed(settings.volDepth).slice(-settings.sufLen)
   
  const randomNumber = Math.floor(Math.random() * 10**(settings.sufLen))+1 
  const newVolCorrection = randomNumber/10**settings.volDepth  
  let lastOrderPrice = 0
  let lastOrderVol   = 0

  if (typeBuySell === "Buy")  { 
    index = resOrdersArray[0].isBuy ? 0 : 1;
    lastOrderPrice  = settings.lastOrderBuyPrice
    lastOrderVol    = settings.lastOrderBuyVol
  }
  if (typeBuySell === "Sell") {
    index = resOrdersArray[0].isBuy ? 1 : 0;
    lastOrderPrice  = settings.lastOrderSellPrice
    lastOrderVol    = settings.lastOrderSellVol   
  }

  console.log('\nСтакан ' + pair + ' ' + typeBuySell)
  for (let i = 0; i < 5; i++) {
    console.log('......  ' + resOrdersArray[index].Prices[i].Price + '  ' + resOrdersArray[index].Prices[i].Volume)
  }
 
  for (const el of resOrdersArray[index].Prices) {
      let isOur = false

      
      // IF IT IS OUR ORDER
      if 
        (
        plusMinus*el.Volume.round(settings.volDepth-4)  === lastOrderVol.round(settings.volDepth-4) 
        && el.Price.round(settings.priceDepth)  === lastOrderPrice.round(settings.priceDepth)
        )
        {
          isOur = true
          ourPriceInOrder = el.Price
          console.log('OUR PRICE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        }
       
       else {
              
       }

      if (Math.abs(el.Volume) >= settings.minVolume && !isOur) {
          firstValue = el
          break;
      }
  }


   // CHECK IF VERY CLOSE TO OTHER SIDE
   // firstValue.Price
   const myPrice = (firstValue.Price.round(settings.priceDepth) + plusMinus * settings.priceAdd)
          .round(settings.priceDepth)
  
   // set new order 
   if  (  (new Date()).getSeconds() === 7 
       || (!ourPriceInOrder)  
       || (!lastOrderPrice)     
       || (lastOrderPrice && (typeBuySell === "Buy" 
                ? firstValue.Price.round(settings.priceDepth) > lastOrderPrice.round(settings.priceDepth) 
                : firstValue.Price.round(settings.priceDepth) < lastOrderPrice.round(settings.priceDepth)))
       || (lastOrderPrice && (plusMinus*(lastOrderPrice - firstValue.Price) > settings.priceAdd*50))
       )
       { 
   
       if (typeBuySell === "Sell")  settings.volCorrectionSell = newVolCorrection
       else                         settings.volCorrectionBuy  = newVolCorrection

       const myVolume = ((wallet[val].round(settings.volDepth) / (typeBuySell === "Sell" ? 1 : firstValue.Price.round(settings.priceDepth) ))
          .floor(settings.floorVolume) - newVolCorrection).round(settings.volDepth);
    
        // ********************
        settings.orderIsRunning = true;

         console.log('\nNEW ORDER... ' + pair)
         console.log((!lastOrderPrice))          
         console.log('++firstValue price '  + firstValue.Price.round(settings.priceDepth))   
         console.log('++firstValue Volume ' + plusMinus*firstValue.Volume.round(settings.volDepth))  
         console.log('--lastOrderVol '      + lastOrderVol.round(settings.volDepth))       
         console.log('--lastOrderPrice '    + lastOrderPrice.round(settings.priceDepth))                 
         console.log('==myPrice '  + myPrice)  
         console.log('==myVolume ' + myVolume)   
           
            
         if  ( (new Date()).getSeconds() === 7 ) {             
           console.log('order:  (new Date()).getSeconds() === 7  ')  
         }    
         
         if  ( !ourPriceInOrder ) {             
           console.log('order: !ourPriceInOrder  ')  
         }      
         
         if  ( !lastOrderPrice ) {             
           console.log('order: !lastOrderPrice  ')  
         }                  
                                
           
         if  (
         (lastOrderPrice && (typeBuySell === "Buy" 
                ? firstValue.Price.round(settings.priceDepth) > lastOrderPrice.round(settings.priceDepth) 
                : firstValue.Price.round(settings.priceDepth) < lastOrderPrice.round(settings.priceDepth))))
         {             
           console.log('order: firstValue > lastOrderPrice ')  
         }       
        
         if (lastOrderPrice && (plusMinus*(lastOrderPrice - firstValue.Price) > settings.priceAdd*50)) {
           console.log('order: 50...   ' + (plusMinus*(lastOrderPrice - firstValue.Price) > settings.priceAdd*50))  
           console.log(`${plusMinus*(lastOrderPrice - firstValue.Price)} > ${settings.priceAdd*50}` )     
           console.log(settings.priceAdd)     
           console.log(settings.priceAdd*50) 
         }
                                     

        await cancellAllOrders(pair, typeBuySell);
        const postBody = {
            AssetPairId: pair,
            OrderAction: typeBuySell,
            Volume: myVolume,
            Price:  myPrice,
        };
        const response = await setOrder(pair, postBody);
        
        setTimeout(function() {}, 1000/2);
        
        
        // If order ok, save it
        if (response.Id) {
            //console.log(response.Id)
             typeBuySell === "Buy" ? settings.lastOrderBuyPrice = myPrice  : settings.lastOrderSellPrice = myPrice
             typeBuySell === "Buy" ? settings.lastOrderBuyVol   = myVolume : settings.lastOrderSellVol   = myVolume           
           }
           else {
             typeBuySell === "Buy" ? settings.lastOrderBuyPrice = 0  : settings.lastOrderSellPrice = 0
             typeBuySell === "Buy" ? settings.lastOrderBuyVol   = 0 : settings.lastOrderSellVol    = 0            
           } 
           
           
         settings.orderIsRunning = false;
        // ********************    

   }
  
    else {
               
    }


};

roundFuncs();
pairsFill();
// console.log(pairSettings);

await cancellAllOrders();
await updateWallet();

setInterval(updateWallet, 5 * 1000);
// await buySell("ETHUSD", '');


setInterval(function () {
   buySell("USDCHF", 'Sell')}, intervalSeconds * 1000);
   
setInterval(function () {
   buySell("ETHUSD", 'Sell')}, intervalSeconds * 1000);