const prefix = "#"

module.exports = async(chat) => {
  let msg = chat.messages[0]
  let jid = msg.key.remoteJid

  if(!msg.key.fromMe && chat.type == "notify"){
    let command = "";
    
    if(msg.message.conversation){
      command = msg.message.conversation
    }else if(msg.message.interactiveResponseMessage){
      command = JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)
    }else if(msg.message.templateButtonReplyMessage){
      command = msg.message.templateButtonReplyMessage.selectedId
    }

    await sock.readMessages([msg.key])

    if(command == prefix + "ping"){
      sock.sendMessage(jid, {text: "Pong!!"}, {quoted: msg})
      return
    }
  }
}
