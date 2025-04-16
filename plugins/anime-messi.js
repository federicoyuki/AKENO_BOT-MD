import axios from 'axios'

let handler = async (m, { conn, usedPrefix, command }) => {
  let res = (await axios.get(`https://raw.githubusercontent.com/davidprospero123/api-anime/main/BOT-JSON/Messi.json`)).data  
  let url = await res[Math.floor(res.length * Math.random())]

  const buttons = [
    {
      buttonId: `${usedPrefix + command}`,
      buttonText: { displayText: "🔄 Ver otra 🔄" },
      type: 1
    },
    {
      buttonId: `${usedPrefix}menu`,
      buttonText: { displayText: "📜 Menú" },
      type: 1
    }
  ]

  const buttonMessage = {
    image: { url: url },
    caption: "*Messi*",
    footer: "🐉 𝙉𝙚𝙤𝙏𝙤𝙠𝙮𝙤 𝘽𝙚𝙖𝙩𝙨 🐲",
    buttons: buttons,
    headerType: 4
  }

  await conn.sendMessage(m.chat, buttonMessage, { quoted: m })
}

handler.help = ['messi']
handler.tags = ['anime']
handler.command = /^(messi)$/i

export default handler
