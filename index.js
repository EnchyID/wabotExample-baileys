const { default: makeWASocket, makeInMemoryStore, useMultiFileAuthState, generateWAMessageContent, generateWAMessageFromContent, proto, MessageType } = require("@whiskeysockets/baileys")

const pino = require("pino")

const store = makeInMemoryStore({
  logger: pino().child({
    level: "silent",
    stream: "store"
  })
})

async function startSock(){
  const { state, saveCreds } = await useMultiFileAuthState("creds")
  
  const sock = global.sock = makeWASocket({
    logger: pino({level: "silent"}), //Require pino module
    printQRInTerminal: true, //Require qrcode-terminal module
    auth: state,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    fireInitQueries: true,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    browser: ["BotMD", "Safari", "1.0.0"]
  })

  store.bind(sock.ev)

  const handlerMessage = require("./handlerMessage.js")

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("chats.update", update => {})

  sock.ev.on.("messages.upsert", handlerMessage)

  sock.ev.on("connection.update", update => {
    const { connection, lastDisconnect } = update

    if(connection == "close"){
      startSock()
    }
    console.log(update)
  })
}

startSock()
