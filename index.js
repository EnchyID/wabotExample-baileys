const { default: makeWASocket, makeInMemoryStore, useMultiFileAuthState, generateWAMessageContent, generateWAMessageFromContent, proto, MessageType } = require("@whiskeysockets/baileys")

const pino = require("pino")

const store = makeInMemoryStore({
  logger: pino().child({
    level: "silent",
    stream: "store"
  })
})

global.replyTo = replyTo
global.sendListMessage = sendListMessage

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

//Custom API

//Example replyTo(jid, "Hello there!, msg)
function replyTo(jid, text, msg){
  sock.sendMessage(jid, {text: text}, {quoted: msg})
}

/**
Example
  sendListMessage(jid, {
    text: "Did you wanna check my fruits?",
    footerText: "MyBot",
    header: null,
    buttonText: "List of Fruits",
    sections: [{
      title: "This is red of fruits!",
      highlight_label: "RED",
      rows: [{
        header: "Cherry",
        title: "Section 1 of Red",
        description: "This is fruit 1 of red",
        id: "fruit1"
      }, 
        header: "Beeries",
        title: "Section 2 of Red",
        description: "This is fruit 2 of red",
        id: "fruit2"
      }]
    }, {
      title: "This is green of fruits!",
      highlight_label: "GREEN",
      rows: [{
        header: "Apple",
        title: "Section 1 of Green",
        description: "This is fruit 1 of green",
        id: "fruit3"
      }, 
        header: "Melon",
        title: "Section 2 of Red",
        description: "This is fruit 2 of green",
        id: "fruit4"
      }]
    }]
  }, msg)
**/
function sendListMessage(jid, options, msg){    
    let template = generateContentMessage(from, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                }, 
                interactiveMessage: {
                    header: {
                       type: "text",
                       text: options.header
                    },
                    body: { text: options.text },
                    footer: { text: options.footerText },
                    nativeFlowMessage: {
                        buttons: [{
                            name: "single_select",
                            buttonParamsJson: JSON.stringify({
                                title: buttonText,
                                sections: options.sections
                            })
                        }]
                    }
                }
            }
        }                      
    }, {userJid: msg.sender, quoted: msg})
    
    sock.relayMessage(from, template.message, { messageId: msg.key.id });
}

startSock()
