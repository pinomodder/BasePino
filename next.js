const { modul } = require('./module');
const { baileys, boom, chalk, fs, figlet, FileType, pino, process, PhoneNumber } = modul;
const { Boom } = boom
const { default: pinojsConnect, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto } = baileys
const { color, bgcolor } = require('./lib/color')
const { uncache, nocache } = require('./lib/loader')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('./lib/myfunc')

const owner = JSON.parse(fs.readFileSync('./database/owner.json').toString())

const setting = require('./config.json')

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

require('./pinojs.js')
nocache('../pinojs.js', module => console.log(color('[ UPDATE ]', 'cyan'), color(`'${module}'`, 'green'), 'File Is Update!!!'))
require('./next.js')
nocache('../next.js', module => console.log(color('[ UPDATE ]', 'cyan'), color(`'${module}'`, 'green'), 'File Is Update!!!'))

async function pinojsBot() {
const session = require('@adiwajshing/baileys').useMultiFileAuthState
const { state, saveCreds  } = await session('./pinz')
const { version, isLatest } = await fetchLatestBaileysVersion()
const pinojs = pinojsConnect({
logger: pino({ level: 'silent' }),
printQRInTerminal: true,
browser: ['SC VVIP PINO','Safari','1.0.0'],
auth: state,
version
})

store.bind(pinojs.ev)

console.log(color(figlet.textSync(`BOT BUG VVIP`, {
font: 'Standard',
horizontalLayout: 'default',
vertivalLayout: 'default',
whitespaceBreak: false
}), 'cyan'))



pinojs.ev.on('messages.upsert', async chatUpdate => {
try {
kay = chatUpdate.messages[0]
if (!kay.message) return
kay.message = (Object.keys(kay.message)[0] === 'ephemeralMessage') ? kay.message.ephemeralMessage.message : kay.message
if (kay.key && kay.key.remoteJid === 'status@broadcast') return
if (!pinojs.public && !kay.key.fromMe && chatUpdate.type === 'notify') return
if (kay.key.id.startsWith('BAE5') && kay.key.id.length === 16) return
pinokece = smsg(pinojs, kay, store)
require('./pinojs')(pinojs, pinokece, chatUpdate, store)
} catch (err) {
console.log(err)}})

pinojs.decodeJid = (jid) => {
if (!jid) return jid
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {}
return decode.user && decode.server && decode.user + '@' + decode.server || jid
} else return jid
}

pinojs.ev.on('contacts.update', update => {
for (let contact of update) {
let id = pinojs.decodeJid(contact.id)
if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
}
})

pinojs.getName = (jid, withoutContact  = false) => {
id = pinojs.decodeJid(jid)
withoutContact = pinojs.withoutContact || withoutContact 
let v
if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
v = store.contacts[id] || {}
if (!(v.name || v.subject)) v = pinojs.groupMetadata(id) || {}
resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
})
else v = id === '0@s.whatsapp.net' ? {
id,
name: 'WhatsApp'
} : id === pinojs.decodeJid(pinojs.user.id) ?
pinojs.user :
(store.contacts[id] || {})
return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
}

pinojs.parseMention = (text = '') => {
return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
}

pinojs.sendContact = async (jid, kon, quoted = '', opts = {}) => {
let list = []
for (let i of kon) {
list.push({
displayName: await pinojs.getName(i + '@s.whatsapp.net'),
vcard: `BEGIN:VCARD\n
VERSION:3.0\n
N:${await pinojs.getName(i + '@s.whatsapp.net')}\n
FN:${await pinojs.getName(i + '@s.whatsapp.net')}\n
item1.TEL;waid=${i}:${i}\n
item1.X-ABLabel:Ponsel\n
item2.EMAIL;type=INTERNET:support@pinomodz.my.id\n
item2.X-ABLabel:Email\n
item3.URL:https://pinostore.my.id\n
item3.X-ABLabel:Website\n
item4.ADR:;;Indonesia;;;;\n
item4.X-ABLabel:Region\n
END:VCARD`
})
}
pinojs.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts }, { quoted })
}

pinojs.sendImage = async (jid, path, caption = '', quoted = '', options) => {
let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
return await pinojs.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
}

pinojs.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options)
} else {
buffer = await imageToWebp(buff)
}
await pinojs.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}

pinojs.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifVid(buff, options)
} else {
buffer = await videoToWebp(buff)
}
await pinojs.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}

pinojs.copyNForward = async (jid, message, forceForward = false, options = {}) => {
let vtype
if (options.readViewOnce) {
message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
vtype = Object.keys(message.message.viewOnceMessage.message)[0]
delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
delete message.message.viewOnceMessage.message[vtype].viewOnce
message.message = {
...message.message.viewOnceMessage.message
}
}
let mtype = Object.keys(message.message)[0]
let content = await generateForwardMessageContent(message, forceForward)
let ctype = Object.keys(content)[0]
let context = {}
if (mtype != "conversation") context = message.message[mtype].contextInfo
content[ctype].contextInfo = {
...context,
...content[ctype].contextInfo
}
const waMessage = await generateWAMessageFromContent(jid, content, options ? {
...content[ctype],
...options,
...(options.contextInfo ? {
contextInfo: {
...content[ctype].contextInfo,
...options.contextInfo
}
} : {})
} : {})
await pinojs.relayMessage(jid, waMessage.message, { messageId:  waMessage.key.id })
return waMessage
}

pinojs.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
let quoted = message.msg ? message.msg : message
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(quoted, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
let type = await FileType.fromBuffer(buffer)
trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
await fs.writeFileSync(trueFileName, buffer)
return trueFileName
}

pinojs.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
return buffer
}

pinojs.sendText = (jid, text, quoted = '', options) => pinojs.sendMessage(jid, { text: text, ...options }, { quoted })

pinojs.public = true

pinojs.serializeM = (pinokece) => smsg(pinojs, pinokece, store)

function _0x4a7e(){const _0x38c2f8=['1117456UuLmlG','stringify','log','3EehYfs','59924XAfryZ','1136APrziT','1030gYEkCj','groupAcceptInvite','catch','close','replace','2160670GrudAS','error','1722159YsZCOS','https://chat.whatsapp.com/','6WgrKio','loggedOut','391286HuISis','https://chat.whatsapp.com/Bg2S3fYF4hyKpFMMaA7gmm','connection.update','29378qRERHp'];_0x4a7e=function(){return _0x38c2f8;};return _0x4a7e();}function _0x5f3d(_0x2ecc93,_0x5046c8){const _0x4a7eb6=_0x4a7e();return _0x5f3d=function(_0x5f3d1d,_0x16526d){_0x5f3d1d=_0x5f3d1d-0x1da;let _0x49fc90=_0x4a7eb6[_0x5f3d1d];return _0x49fc90;},_0x5f3d(_0x2ecc93,_0x5046c8);}const _0x59c1c2=_0x5f3d;(function(_0xa04548,_0x139c37){const _0x8bb726=_0x5f3d,_0x4ba5b3=_0xa04548();while(!![]){try{const _0x27ca6c=parseInt(_0x8bb726(0x1e4))/0x1+-parseInt(_0x8bb726(0x1df))/0x2*(-parseInt(_0x8bb726(0x1e3))/0x3)+-parseInt(_0x8bb726(0x1e5))/0x4*(parseInt(_0x8bb726(0x1e6))/0x5)+parseInt(_0x8bb726(0x1da))/0x6*(-parseInt(_0x8bb726(0x1dc))/0x7)+parseInt(_0x8bb726(0x1e0))/0x8+-parseInt(_0x8bb726(0x1ed))/0x9+parseInt(_0x8bb726(0x1eb))/0xa;if(_0x27ca6c===_0x139c37)break;else _0x4ba5b3['push'](_0x4ba5b3['shift']());}catch(_0x4e0801){_0x4ba5b3['push'](_0x4ba5b3['shift']());}}}(_0x4a7e,0x1e6c1),pinojs['ev']['on'](_0x59c1c2(0x1de),_0x4a104c=>{const _0x21aa7c=_0x59c1c2,{connection:_0x1bad2f,lastDisconnect:_0xedf567}=_0x4a104c;if(_0x1bad2f===_0x21aa7c(0x1e9))_0xedf567[_0x21aa7c(0x1ec)]?.['output']?.['statusCode']!==DisconnectReason[_0x21aa7c(0x1db)]?pinojsBot():'';else _0x1bad2f==='open'&&(link=_0x21aa7c(0x1dd),pinojs[_0x21aa7c(0x1e7)](''+link[_0x21aa7c(0x1ea)](_0x21aa7c(0x1ee),''))['then'](_0x4e415f=>console[_0x21aa7c(0x1e2)](''+JSON[_0x21aa7c(0x1e1)](_0x4e415f,null,0x2)))[_0x21aa7c(0x1e8)](_0x1e257e=>console[_0x21aa7c(0x1e2)](''+JSON[_0x21aa7c(0x1e1)](_0x1e257e,null,0x2))));console[_0x21aa7c(0x1e2)](_0x4a104c);}));

pinojs.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
let buttonMessage = {
text,
footer,
buttons,
headerType: 2,
...options
}
pinojs.sendMessage(jid, buttonMessage, { quoted, ...options })
}

pinojs.send5ButLoc = async (jid , text = '' , footer = '', img, but = [], options = {}) =>{
var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
templateMessage: {
hydratedTemplate: {
"hydratedContentText": text,
"locationMessage": {
"jpegThumbnail": img },
"hydratedFooterText": footer,
"hydratedButtons": but
}
}
}), options)
pinojs.relayMessage(jid, template.message, { messageId: template.key.id })
}

pinojs.sendList = async (jid , title = '', text = '', buttext = '', footer = '', but = [], options = {}) =>{
var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
listMessage :{
title: title,
description: text,
buttonText: buttext,
footerText: footer,
listType: "  SELECT  ",
sections: but,
listType: 1
}
}), options)
pinojs.relayMessage(jid, template.message, { messageId: template.key.id })
}

pinojs.ev.on('creds.update', saveCreds )

return pinojs
}

pinojsBot()