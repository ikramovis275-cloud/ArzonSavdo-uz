const { Telegraf, Markup, session } = require('telegraf');
const axios = require('axios');

let botInstance = null;

const initBot = () => {
  const bot = new Telegraf(process.env.BOT_TOKEN);
  const PORT = process.env.PORT || 5000;
  const API_URL = `http://localhost:${PORT}/api`;
  const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

  // Sessionni initsializatsiya qilish
  bot.use(session());
  bot.use((ctx, next) => {
    ctx.session = ctx.session || {};
    return next();
  });

  const mainMenu = Markup.keyboard([
    ['🛍 Katalog', '🛒 Savat'],
    ['🎁 Bonuslar', '📦 Buyurtmalarim'],
    ['📞 Aloqa']
  ]).resize();

  const formatCur = (num) => new Intl.NumberFormat('uz-UZ').format(num) + " so'm";

  bot.start(async (ctx) => {
    try {
      await axios.post(`${API_URL}/users/register`, {
        telegram_id: ctx.from.id.toString(),
        name: ctx.from.first_name,
        username: ctx.from.username,
        referral_code: ctx.payload || ''
      });
      ctx.reply(`✨ <b>Assalomu alaykum, ${ctx.from.first_name}!</b>\n\n🚀 <b>Arzon-Savdo</b> botiga xush kelibsiz.\n\nQuyidagi menyudan foydalaning:`, { parse_mode: 'HTML', ...mainMenu });
    } catch (e) { ctx.reply("Qayta urinib ko'ring: /start"); }
  });

  bot.hears('🛍 Katalog', async (ctx) => {
    try {
      const { data } = await axios.get(`${API_URL}/categories`);
      const buttons = data.data.map(c => [Markup.button.callback(`${c.icon} ${c.name}`, `cat_${c.id}`)]);
      ctx.reply("📂 <b>Kategoriyani tanlang:</b>", { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
    } catch (e) { ctx.reply("Xatolik bo'ldi."); }
  });

  bot.action(/cat_(\d+)/, async (ctx) => {
    try {
      const { data } = await axios.get(`${API_URL}/products?category_id=${ctx.match[1]}`);
      if (data.data.length === 0) return ctx.editMessageText("😕 Mahsulotlar yo'q.", { parse_mode: 'HTML', ...Markup.inlineKeyboard([[Markup.button.callback("⬅️ Orqaga", "back_cats")]]) });
      const buttons = data.data.map(p => [Markup.button.callback(`${p.name} - ${formatCur(p.price)}`, `prod_${p.id}`)]);
      buttons.push([Markup.button.callback("⬅️ Orqaga", "back_cats")]);
      ctx.editMessageText("📦 <b>Mahsulotni tanlang:</b>", { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
    } catch (e) { ctx.answerCbQuery("Xato"); }
  });

  bot.action("back_cats", async (ctx) => {
     try {
       const { data } = await axios.get(`${API_URL}/categories`);
       const buttons = data.data.map(c => [Markup.button.callback(`${c.icon} ${c.name}`, `cat_${c.id}`)]);
       ctx.editMessageText("📂 <b>Kategoriyani tanlang:</b>", { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
     } catch (e) {}
  });

  bot.action(/prod_(\d+)/, async (ctx) => {
    try {
      const { data } = await axios.get(`${API_URL}/products/${ctx.match[1]}`);
      const p = data.data;
      const text = `🆔 <b>${p.name}</b>\n\n💰 <b>Narxi:</b> ${formatCur(p.price)}\n\n<i>${p.description || "Tavsif yo'q"}</i>`;
      const buttons = Markup.inlineKeyboard([[Markup.button.callback("🛒 Savatga qo'shish", `add_${p.id}`)], [Markup.button.callback("⬅️ Orqaga", `cat_${p.category_id}`)]]);
      if (p.image) {
        await ctx.deleteMessage().catch(() => {});
        await ctx.replyWithPhoto({ url: p.image.startsWith('http') ? p.image : SERVER_URL + p.image }, { caption: text, parse_mode: 'HTML', ...buttons });
      } else ctx.editMessageText(text, { parse_mode: 'HTML', ...buttons });
    } catch (e) { ctx.answerCbQuery("Xato"); }
  });

  bot.action(/add_(\d+)/, async (ctx) => {
    try {
      const user = await axios.get(`${API_URL}/users/telegram/${ctx.from.id}`);
      await axios.post(`${API_URL}/cart/add`, { user_id: user.data.data.id, product_id: parseInt(ctx.match[1]), quantity: 1 });
      ctx.answerCbQuery("✅ Savatga qo'shildi!", { show_alert: true });
    } catch (e) { ctx.answerCbQuery("Xato"); }
  });

  bot.hears('🛒 Savat', async (ctx) => {
    try {
      const userRes = await axios.get(`${API_URL}/users/telegram/${ctx.from.id}`);
      const user = userRes.data.data;
      const { data } = await axios.get(`${API_URL}/cart/${user.id}`);
      if (data.data.length === 0) return ctx.reply("🛒 <b>Savatingiz bo'sh.</b>", { parse_mode: 'HTML' });
      
      let text = `🛒 <b>Sizning savatingiz:</b>\n\n`;
      data.data.forEach((item, i) => { text += `${i+1}. <b>${item.product_name}</b> x ${item.quantity} = ${formatCur(item.quantity * item.product_price)}\n`; });
      const currentBonus = user.bonus || 0;
      text += `\n💵 <b>Jami:</b> ${formatCur(data.total)}\n`;
      if (currentBonus > 0) text += `🎁 <b>Bonus:</b> -${formatCur(currentBonus)}\n👉 <b>To'lov:</b> ${formatCur(Math.max(0, data.total - currentBonus))}`;
      
      ctx.reply(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard([[Markup.button.callback("✅ Buyurtma berish", "checkout")]]) });
    } catch (e) { ctx.reply("Xatolik bo'ldi."); }
  });

  bot.action("checkout", async (ctx) => {
    try {
      const user = await axios.get(`${API_URL}/users/telegram/${ctx.from.id}`);
      const userData = user.data.data;
      if (userData.phone) {
        ctx.session.phone = userData.phone;
        return ctx.reply("🚚 <b>Yetkazib berish manzilini yozing:</b>\n(Yoki lokatsiya yuboring)", { 
          parse_mode: 'HTML', 
          ...Markup.keyboard([[Markup.button.locationRequest("📍 Lokatsiya yuborish")]]).resize().oneTime() 
        });
      }
      ctx.reply("📱 <b>Raqamingizni yuboring:</b>\n(Pastdagi tugmani bosing)", {
        parse_mode: 'HTML',
        ...Markup.keyboard([[Markup.button.contactRequest("📱 Raqamni yuborish")]]).resize().oneTime()
      });
    } catch (e) { ctx.reply("Xato"); }
  });

  bot.on('contact', async (ctx) => {
    if (!ctx.session) ctx.session = {};
    ctx.session.phone = ctx.message.contact.phone_number;
    ctx.reply("🚚 <b>Rahmat! Endi manzilni yozing yoki lokatsiya yuboring:</b>", {
      parse_mode: 'HTML',
      ...Markup.keyboard([[Markup.button.locationRequest("📍 Lokatsiya yuborish")]]).resize()
    });
  });

  bot.hears('🎁 Bonuslar', async (ctx) => {
    try {
      const user = await axios.get(`${API_URL}/users/telegram/${ctx.from.id}`);
      const u = user.data.data;
      const botUser = ctx.botInfo.username;
      console.log(`🎁 Bonus command used by ${ctx.from.id}. BotUser: ${botUser}`);
      ctx.reply(`🎁 <b>Bonus balansingiz:</b> ${formatCur(u.bonus)}\nLink: https://t.me/${botUser}?start=${u.referral_code}`, { parse_mode: 'HTML' });
    } catch (e) { ctx.reply("Xato"); }
  });

  bot.hears('📦 Buyurtmalarim', async (ctx) => {
    try {
      const user = await axios.get(`${API_URL}/users/telegram/${ctx.from.id}`);
      const { data } = await axios.get(`${API_URL}/orders?user_id=${user.data.data.id}`);
      if (data.data.length === 0) return ctx.reply("Sizda hali buyurtmalar yo'q.", { parse_mode: 'HTML' });
      let text = `📦 <b>Buyurtmalar:</b>\n\n`;
      data.data.forEach(o => { text += `🔹 #${o.id} - ${o.status.toUpperCase()} - ${formatCur(o.total_price)}\n`; });
      ctx.reply(text, { parse_mode: 'HTML' });
    } catch (e) { ctx.reply("Xato"); }
  });

  bot.hears('📞 Aloqa', (ctx) => {
    ctx.reply(`📞 <b>Biz bilan aloqa:</b>\n\n👨‍💻 Admin: @zr_coders\n📱 Tel: +998 93 821 55 11\n\nSavollaringiz bo'lsa bemalol yozing!`, { parse_mode: 'HTML' });
  });

  bot.on('message', async (ctx, next) => {
    if (ctx.session && ctx.session.phone && (ctx.message.text || ctx.message.location)) {
      const navTexts = ['🛍 Katalog', '🛒 Savat', '🎁 Bonuslar', '📦 Buyurtmalarim', '📞 Aloqa'];
      if (navTexts.includes(ctx.message.text)) return next();
      
      const addr = ctx.message.location ? `Loc: ${ctx.message.location.latitude},${ctx.message.location.longitude}` : ctx.message.text;
      
      try {
        const uRes = await axios.get(`${API_URL}/users/telegram/${ctx.from.id}`);
        const user = uRes.data.data;
        const cart = await axios.get(`${API_URL}/cart/${user.id}`);
        
        await axios.post(`${API_URL}/orders`, { 
          user_id: user.id, 
          address: addr, 
          phone: ctx.session.phone, 
          items: cart.data.data.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: i.product_price })) 
        });
        
        if (user.bonus > 0) await axios.put(`${API_URL}/users/${user.id}/bonus/reset`);
        
        ctx.reply("✅ <b>Buyurtmangiz qabul qilindi!</b>\nTez orada operatorlar bog'lanadi.", { parse_mode: 'HTML', ...mainMenu });
        ctx.session.phone = null;
      } catch (e) { ctx.reply("Xatolik yuz berdi.", { parse_mode: 'HTML', ...mainMenu }); }
    } else return next();
  });

  // 2-sekundlik Cron Job
  setInterval(() => {
    // Bu yerda avtomatik vazifalar bajarilishi mumkin
  }, 2000);

  bot.launch().then(() => console.log('✅ Bot tayyor!'));
  botInstance = bot;
};

const sendStatusNotification = async (telegram_id, status, order_id) => {
  if (!botInstance) return;
  let text = '';
  switch(status) {
    case 'confirmed': text = `✅ <b>Sizning #${order_id}-sonli buyurtmangiz tasdiqlandi!</b>`; break;
    case 'delivering': text = `🚚 <b>Buyurtmangiz #${order_id} yo'lga chiqdi!</b>`; break;
    case 'delivered': text = `🏁 <b>Buyurtmangiz #${order_id} yetkazildi!</b>\nHozir chiqasiz, kuryer sizni kutyapti.`; break;
    case 'cancelled': text = `❌ <b>Sizning #${order_id}-sonli buyurtmangiz bekor qilindi.</b>`; break;
    default: text = `ℹ️ Buyurtma #${order_id} holati: ${status}`;
  }
  try { await botInstance.telegram.sendMessage(telegram_id, text, { parse_mode: 'HTML' }); } catch (e) {}
};

module.exports = { initBot, sendStatusNotification };
