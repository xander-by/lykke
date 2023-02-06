import TelegramBot from "node-telegram-bot-api";
import { getWallet, getOrderBook, cancellAllOrders }  from "./methods.js";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

const token = process.env.TG_TOKEN;
const tgUser  = process.env.TG_USER;
const bot = new TelegramBot(token, { polling: true });
const wallet = {}

// это чтобы telegrem не ругался при отправке фото
process.env["NTBA_FIX_350"] = 1;

// ОБРАБОТКА СТАРТА БОТА
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id.toString();

  // Запишем в bd действие
  //(async () => {
  //await addUserAction({"userId": chatId, "userName": msg.chat.first_name, "action": 'start bot'})
  //})()

  if (!tgUser.includes(chatId)) {
    bot.sendMessage(chatId, `Access denied for ${chatId}`);
    console.log(chatId);
    return;
  }

  let ButtonMas = [["Balance"]];
  ButtonMas.push(["Current rates"]);
  ButtonMas.push(["Cancell all"]);
 

  // ВЫВОДИМ КНОПКИ ВНИЗУ
  bot.sendMessage(chatId, "Welcome", {
    reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: false,
        keyboard: ButtonMas,
    },
  });

})

  

// ОБРАБОТКА POLLING ОШИБОК
bot.on("polling_error", console.log);

// ОБРАБОТКА CALLBACK
bot.on("callback_query", (msg) => console.log(msg));

bot.on("message", (msg) => {
  const chatId = msg.chat.id.toString();

  if (!tgUser.includes(chatId)) {
    bot.sendMessage(chatId, `Access denied for ${chatId}`);
    return;
  }
  
  if (msg.text === "Balance") {

    // Обернули в асинхронную функцию
    (async () => {
      try {

        const resJson = await getWallet()
        
        if (!resJson) return
        
        wallet.date = new Date()

        let message = ''
        resJson.forEach(element => {
          if (element.AssetId.length < 6) {
            if (wallet[element.AssetId] !== element.Balance) {
              console.log(`${element.AssetId} balance has changed from ${wallet[element.AssetId]} to ${element.Balance}`)
              wallet[element.AssetId] = element.Balance             
            }
            message = message + element.AssetId + ': Balance ' + element.Balance + ', Reserved ' +  element.Reserved  + '\n'
          }
        });

        console.log(wallet)
        bot.sendMessage(chatId, message);
      
      } catch (err) {
        bot.sendMessage(chatId, `Ошибка получения данных! ${err.message}`);
      }
    })();
  } else if (msg.text === "Current rates") {

    // Обернули в асинхронную функцию
    (async () => {
      try {
        
        const resJson = await getOrderBook('BTCUSD')
        if (!resJson) return

        if (resJson.length === 2) {
             let message = ''
             if (resJson[0].isBuy) {
                 message = `Buy: Volume: ${resJson[0].Prices[0].Volume} Price: ${resJson[0].Prices[0].Price}\nSell: Volume: ${-resJson[1].Price[0].Volume} Price: ${resJson[1].Price[0].Price}`
             }
             else {
                 message = `Buy: Volume: ${resJson[1].Prices[0].Volume} Price: ${resJson[1].Prices[0].Price}\nSell: Volume: ${-resJson[0].Prices[0].Volume} Price: ${resJson[0].Prices[0].Price}`      
             }
    
            console.log(message)
            bot.sendMessage(chatId, message);            
        
        }
        else bot.sendMessage(chatId, `Ошибка получения данных! ${err.message}`);

      } catch (err) {
        console.log(err)
        bot.sendMessage(chatId, `Ошибка получения данных! ${err.message}`);
      }
    })();
    
    
   } else if (msg.text === "Cancell all") {

    // Обернули в асинхронную функцию
    (async () => {
      try {
        
        await cancellAllOrders()

      } catch (err) {
        console.log(err)
        bot.sendMessage(chatId, `Ошибка получения данных! ${err.message}`);
      }
    })();   
    
  } else {

    // Запишем в bd действие
    //(async () => {
    //  await addUserAction({
    //    userId: chatId,  
    //    messageId: msg.message_id,
    //    messageType: 'text',         
    //    userName: msg.chat.first_name,
    //    fileId: undefined,         
    //    text: msg.text,
    //  });
    //})();

    bot.sendMessage(
      chatId,
      `Получили ваше сообщение! ${msg.text} ${msg.message_id} ${msg.chat.first_name} ${chatId}`
    );
  }
});

export { tgUser, token, bot };