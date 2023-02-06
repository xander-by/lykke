import {tgUser, bot}  from "./telegram.js";
import {wallet}  from "./globals.js";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

const getWallet = async () => {

   const res = await runMethod('/api/Wallets', 'GET')
   return res;
} 

const getOrderBook = async (pair) => {

   const res = await runMethod('/api/OrderBooks/' + pair, 'GET')
   return res;
}

const cancellAllOrders = async (pair, side = 'Both') => {

   const response = await runMethod('/api/Orders?side=' + side, 'DELETE')
   return response;
}

const setOrder = async (pair, postBody) => {

   console.log(JSON.stringify(postBody))
   const response = await runMethod('/api/Orders/v2/limit', 'POST', JSON.stringify(postBody))
   return response;
}

const runMethod = async (methodName, type = 'GET', postBody = '') => {

   //console.log('runMethod ' +methodName)

   let response = undefined
   const options =  {
         method: type,
         port: 443,
         headers: {
           "Content-Type": "application/json",
           "api-key": process.env.LYKKE_KEY,
         },
       }
       
   if (postBody) {
       options.body = postBody
   }    

   try {
       response = await fetchWithTimeout(
       "https://" + process.env.LYKKE_SERVER + methodName,
       options)
   } catch (err) {
       console.log(err.message);
       bot.sendMessage(tgUser, methodName + ': ' + err.message);
       return err.message
   }
   
    if (response.status !== 200) {

      try {

       const resJson = await response.json()
       // console.log(resJson)
       // console.log(resJson.Error.Message)      
       bot.sendMessage(tgUser, methodName + ' ' + type + ' ' + postBody + ': status '+ response.status + ' ' + resJson.Error.Message);
       return resJson.Error.Message}

       catch (err) {
         console.log('response.status error: ' + err.message);
         return err.message
       }


   }       
    
   return type !== 'DELETE' ? await response.json() : await response.status

}

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 5000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);
  return response;
}

        
export { getWallet, getOrderBook, cancellAllOrders, setOrder};