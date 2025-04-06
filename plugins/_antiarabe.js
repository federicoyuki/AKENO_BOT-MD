let db = global.db;
if (!db.data) db.data = { chats: {} };

const arabPrefixes = ['+212', '+20', '+966', '+971', '+964', '+973', '+965', '+968', '+974', '+962', '+961'];

module.exports = {
  name: 'antiarabe',
  description: 'Elimina automáticamente a los números árabes que entran al grupo',
  type: 'group',
  default: false, // para que sea compatible con tu sistema .on / .off

  async before(m, { conn }) {
    const chat = db.data.chats[m.chat];
    if (!m.isGroup || !chat?.antiarabe) return;

    if (m.messageStubType === 27 || m.messageStubType === 'add') {
      let participants = m.messageStubParameters || [];

      for (let user of participants) {
        let number = user.split('@')[0];
        if (arabPrefixes.some(pre => number.startsWith(pre.replace('+', '')))) {
          try {
            await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
            await conn.sendMessage(m.chat, { text: `☠️ Usuario ${number} eliminado por *antiarabe*.` });
          } catch (err) {
            await conn.sendMessage(m.chat, { text: `❌ No pude eliminar a ${number}.` });
          }
        }
      }
    }
  }
};