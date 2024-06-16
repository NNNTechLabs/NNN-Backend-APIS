require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Welcome message when user starts the bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const gifUrl = "https://nnn-telegram-front.pages.dev/nnn-bot.gif";
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Launch NNN ⚡️",
            url: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=miniapp`,
          },
        ],
        [{ text: "TG Channel 💙", url: "https://t.me/niftynerdsnetwork" }],
        [{ text: "Twitter 📱", url: "https://x.com/niftynerds" }],
      ],
    },
  };

  bot.sendAnimation(chatId, gifUrl, {
    caption:
      "Nifty Nerds Network ⚡️\n\nGame-fi Launchpad on TON:\n\n- Play games\n- Complete tasks\n- Join squad, promote projects and earn points\n\n⛰ Climb the leaderboard for a chance to win a whitelist of NFT + $NNN Token",
    reply_markup: options.reply_markup,
  });
});

bot.onText(/\/twitter/, (msg) => {
  const chatId = msg.chat.id;
  const twitterUrl = "https://twitter.com/niftynerds";
  const twitterText = `Nifty Nerds Network`;
  const message = `
<a href="${twitterUrl}">${twitterText}</a>
  `;
  bot.sendMessage(chatId, message, { parse_mode: "HTML" });
});
bot.onText(/\/channel/, (msg) => {
  const chatId = msg.chat.id;
  const channelUrl = "https://t.me/niftynerdsnetwork";
  const message = `
  <a href="${channelUrl}">Nifty Nerds Network</a>
    `;
  bot.sendMessage(chatId, message, { parse_mode: "HTML" });
});
module.exports = bot;
