// Código mejorado por 🐉𝙉𝙚𝙤𝙏𝙤𝙠𝙮𝙤 𝘽𝙚𝙖𝙩𝙨🐲 wa.me/50248019799
// Versión optimizada del sistema de préstamos

const MIN_AMOUNT = 10;
const DEBT_INCREMENT = 10;
const DEBT_INTERVAL = 5 * 60 * 60 * 1000; // 5 horas
const confirmation = {};

async function handler(m, { conn, args, command }) {
  const user = global.db.data.users[m.sender];
  const sendMessage = (text, mentions = []) => conn.sendMessage(m.chat, { text, mentions }, { quoted: m });

  switch (command) {
    case 'prestar': {
      const count = Math.max(MIN_AMOUNT, isNumber(args[0]) ? parseInt(args[0]) : 0);
      const target = args[1]?.replace(/[@ .+-]/g, '') + '@s.whatsapp.net';

      if (!target) return sendMessage('*👤 Menciona al usuario al que deseas prestarle Yenes 💴.*');
      if (!(target in global.db.data.users)) return sendMessage('*❌ Usuario no registrado en la base de datos.*');
      if (target === m.sender) return sendMessage('*❌ No puedes prestarte a ti mismo.*');
      if (user.yenes < count) return sendMessage('*💰 No tienes suficientes Yenes 💴 para prestar.*');
      if (confirmation[target]) return sendMessage('*⏳ Ya hay una solicitud pendiente para ese usuario.*');

      const lenderTag = `@${m.sender.split('@')[0]}`;
      const msg = `*${lenderTag} desea prestarte ${count} Yenes 💴. ¿Aceptas?*\n*—◉ Tienes 60 segundos para responder.*\n*Escribe:* _Si_ o _No_`;

      await sendMessage(msg, [target]);

      confirmation[target] = {
        sender: m.sender,
        amount: count,
        timeout: setTimeout(() => {
          sendMessage('*⌛ Tiempo expirado. Préstamo cancelado.*', [target]);
          delete confirmation[target];
        }, 60000)
      };
      break;
    }

    case 'pagar': {
      if (!user.debts || Object.keys(user.debts).length === 0)
        return sendMessage('*💳 No tienes Yenes 💴 en deuda para pagar.*');

      if (user.yenes <= 0) return sendMessage('*🚫 No puedes pagar si tienes saldo negativo.*');

      let amount = Math.max(MIN_AMOUNT, isNumber(args[0]) ? parseInt(args[0]) : 0);
      const totalDebt = Object.values(user.debts).reduce((sum, val) => sum + val, 0);

      if (amount < MIN_AMOUNT) return sendMessage(`*💰 Debes pagar al menos ${MIN_AMOUNT} Yenes 💴.*`);
      if (amount > totalDebt) return sendMessage(`*💰 Tu deuda total es de ${totalDebt} Yenes 💴.*`);

      for (const lender in user.debts) {
        const debt = user.debts[lender];
        if (amount <= 0) break;

        const payment = Math.min(debt, amount);
        user.debts[lender] -= payment;
        amount -= payment;

        if (user.debts[lender] <= 0) delete user.debts[lender];
      }

      sendMessage(`*💸 Has pagado ${args[0]} Yenes 💴.*`);

      if (Object.keys(user.debts).length === 0) {
        sendMessage('*🎉 ¡Has saldado todas tus deudas!*');
      }
      break;
    }

    case 'deuda': {
      if (!user.debts || Object.keys(user.debts).length === 0)
        return sendMessage('*✅ No tienes deudas actualmente.*');

      let text = '*💳 Deudas pendientes:*\n';
      let mentions = [];

      for (const [lender, amount] of Object.entries(user.debts)) {
        if (amount > 0) {
          text += `— *${amount} Yenes 💴 a @${lender.split('@')[0]}*\n`;
          mentions.push(lender);
        }
      }

      const total = Object.values(user.debts).reduce((a, b) => a + b, 0);
      text += `\n*Total: ${total} Yenes 💴*`;

      sendMessage(text.trim(), mentions);
      break;
    }
  }
}

// Manejo de confirmación de préstamos
handler.before = async (m) => {
  if (!m.text || m.isBaileys || !(m.sender in confirmation)) return;

  const { sender, amount, timeout } = confirmation[m.sender];
  const lender = global.db.data.users[sender];
  const receiver = global.db.data.users[m.sender];

  if (/^no$/i.test(m.text)) {
    clearTimeout(timeout);
    delete confirmation[m.sender];
    return conn.sendMessage(m.chat, { text: '*❌ Préstamo cancelado.*' }, { quoted: m });
  }

  if (/^si$/i.test(m.text)) {
    if (lender.yenes < amount) {
      clearTimeout(timeout);
      delete confirmation[m.sender];
      return conn.sendMessage(m.chat, { text: '*❌ El prestamista ya no tiene suficientes Yenes.*' }, { quoted: m });
    }

    receiver.yenes += amount;
    lender.yenes -= amount;
    receiver.debts = receiver.debts || {};
    receiver.debts[sender] = (receiver.debts[sender] || 0) + amount;

    conn.sendMessage(m.chat, {
      text: `*✅ Préstamo exitoso: ${amount} Yenes 💴 transferidos a @${m.sender.split('@')[0]}.*`,
      mentions: [m.sender]
    }, { quoted: m });

    setInterval(() => {
      if (receiver.debts[sender] !== undefined) {
        receiver.debts[sender] += DEBT_INCREMENT;
      }
    }, DEBT_INTERVAL);

    clearTimeout(timeout);
    delete confirmation[m.sender];
  }
};

handler.help = ['prestar', 'pagar', 'deuda'].map(v => v + ' [cantidad] [@usuario]');
handler.tags = ['economy'];
handler.command = ['prestar', 'pagar', 'deuda'];
handler.group = true;
handler.register = true;
handler.disabled = false;

export default handler;

function isNumber(x) {
  return !isNaN(x);
}