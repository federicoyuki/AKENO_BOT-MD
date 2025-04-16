import yts from 'yt-search';
import fetch from 'node-fetch';
import { prepareWAMessageMedia, generateWAMessageFromContent } from '@whiskeysockets/baileys';

const handler = async (m, { conn, args, usedPrefix }) => {
  if (!args[0]) {
    return await conn.sendMessage(m.chat, { 
      text: `✏️ Ingresa un título para buscar en YouTube.\n\nEjemplo:\n> ${usedPrefix}play que va`
    }, { quoted: m });
  }

  await m.react('⏱️');

  try {
    const searchResults = await searchVideos(args.join(" "));
    if (!searchResults.length) throw new Error('No se encontraron resultados.');

    const video = searchResults[0];
    const thumbnail = await (await fetch(video.thumbnail)).buffer();

    const messageText = formatMessageText(video);

    await conn.sendMessage(m.chat, {
      image: thumbnail,
      caption: messageText,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 1000,
        isForwarded: true
      },
      buttons: generateButtons(video, usedPrefix),
      headerType: 1,
      viewOnce: true
    }, { quoted: m });

    await m.react('✅');

  } catch (e) {
    console.error(e);
    await m.react('❌');
    await conn.sendMessage(m.chat, { text: '❗ Ocurrió un error al buscar el video. Inténtalo de nuevo más tarde.' }, { quoted: m });
  }
};

handler.help = ['play'];
handler.tags = ['descargas'];
handler.command = ['play'];

export default handler;

// Función de búsqueda YouTube
async function searchVideos(query) {
  try {
    const res = await yts(query);
    return res.videos.slice(0, 10).map(video => ({
      title: video.title,
      url: video.url,
      thumbnail: video.thumbnail,
      channel: video.author.name,
      published: video.timestamp || 'No disponible',
      views: video.views?.toLocaleString() || 'No disponible',
      duration: video.duration.timestamp || 'No disponible'
    }));
  } catch (error) {
    console.error('Error en yt-search:', error.message);
    return [];
  }
}

// Formato visual del resultado principal
function formatMessageText(video) {
  return (
`\`\`\`
🎧 Resultado encontrado

🎶 𝙏𝙞́𝙩𝙪𝙡𝙤: ${video.title}
⏱️ 𝘿𝙪𝙧𝙖𝙘𝙞𝙤́𝙣: ${video.duration}
🎙️ 𝘾𝙖𝙣𝙖𝙡: ${video.channel}
📅 𝙋𝙪𝙗𝙡𝙞𝙘𝙖𝙙𝙤: ${convertTimeToSpanish(video.published)}
👁️ 𝙑𝙞𝙨𝙩𝙖𝙨: ${video.views}
🔗 𝙀𝙣𝙡𝙖𝙘𝙚: ${video.url}

┌─「 𝗔𝗞𝗘𝗡𝗢-𝗕𝗢𝗧 ⚡️ 」─┐
│ Powered by
│ 𝗡𝗘𝗢𝗧𝗢𝗞𝗬𝗢 𝗕𝗘𝗔𝗧𝗦 🐉
└─────────────────┘
\`\`\``
  );
}

// Botones con opciones de audio y video con fuente decorativa
function generateButtons(video, usedPrefix) {
  return [
    {
      buttonId: `${usedPrefix}ytmp3 ${video.url}`,
      buttonText: { displayText: '🎵 𝑨𝒖𝒅𝒊𝒐 🐉' },
      type: 1
    },
    {
      buttonId: `${usedPrefix}ytmp4 ${video.url}`,
      buttonText: { displayText: '🎬 𝑽𝒊𝒅𝒆𝒐 🐉' },
      type: 1
    }
  ];
}

// Traducir fechas
function convertTimeToSpanish(timeText) {
  return timeText
    .replace(/years?/, 'años')
    .replace(/months?/, 'meses')
    .replace(/days?/, 'días')
    .replace(/hours?/, 'horas')
    .replace(/minutes?/, 'minutos')
    .replace(/year/, 'año')
    .replace(/month/, 'mes')
    .replace(/day/, 'día')
    .replace(/hour/, 'hora')
    .replace(/minute/, 'minuto');
        }
