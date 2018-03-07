var Int64 = require('node-int64');

function parseData(parsingContext) {
    var newMessage;
    if (parsingContext.currentMessage.remainingSize > 0) {
        newMessage = _parseNextMessage(parsingContext);
        if (newMessage) {
            _onNewMessage(newMessage, parsingContext);
        }
    }
    while (parsingContext.offset < parsingContext.data.length) {
        _readMsgSize(parsingContext);
        newMessage = _parseNextMessage(parsingContext);
        if (newMessage) {
            _onNewMessage(newMessage, parsingContext);
        }
    }
}

function _onNewMessage(newMessage, parsingContext){
    if(parsingContext.parseMetadata){
        var msgAndMetadata =_parseMetadata(newMessage);
        parsingContext.onMsgCB(msgAndMetadata.msg, msgAndMetadata.metadata);
    }else{
        parsingContext.onMsgCB(newMessage);
    }
}

function _parseMetadata(fullMessage){
      var topicLength = fullMessage.readInt32BE(0);
      var topic = fullMessage.slice(16, 16 + topicLength).toString();
      var value = fullMessage.slice(16 + topicLength);

      var metadata = {
        partition: fullMessage.readInt32BE(12),
        offset: +(new Int64(fullMessage.slice(4,12))),
        topic: topic
      };

      return {msg: value, metadata: metadata};
}

function _parseNextMessage(parsingContext) {
    if (parsingContext.data.length === parsingContext.offset) {
        return;
    }


    var readSize = parsingContext.currentMessage.remainingSize;
    if (readSize > parsingContext.data.length - parsingContext.offset) {
        readSize = parsingContext.data.length - parsingContext.offset;
    }

    var messagePart = parsingContext.data.slice(parsingContext.offset, parsingContext.offset + readSize);
    parsingContext.offset += readSize;
    parsingContext.currentMessage.remainingSize -= readSize;
    if (parsingContext.currentMessage.remainingSize > 0) {
        parsingContext.currentMessage.parts.push(messagePart);
        return;
    }

    var msgBuffer = messagePart;
    if (parsingContext.currentMessage.parts.length > 0) {
        parsingContext.currentMessage.parts.push(messagePart);
        msgBuffer = Buffer.concat(parsingContext.currentMessage.parts);
        parsingContext.currentMessage.parts = [];
    }

    return msgBuffer;
}

function _readMsgSize(parsingContext) {

    if (parsingContext.currentMessage.partialSize.size === 0 && parsingContext.offset <= parsingContext.data.length - 4) {
        parsingContext.currentMessage.remainingSize = parsingContext.data.readInt32BE(parsingContext.offset);
        parsingContext.offset += 4;
        return;
    }

    var readSize = 4 - parsingContext.currentMessage.partialSize.size;
    readSize = Math.min(readSize, parsingContext.data.length - parsingContext.offset);
    var sizePart = parsingContext.data.slice(parsingContext.offset, parsingContext.offset + readSize);
    parsingContext.offset += readSize;
    parsingContext.currentMessage.partialSize.parts.push(sizePart);
    parsingContext.currentMessage.partialSize.size += readSize;
    if (parsingContext.currentMessage.partialSize.size < 4) {
        return;
    }
    var sizeFullBuf = sizePart;
    if (parsingContext.currentMessage.partialSize.parts.length > 1) {
        sizeFullBuf = Buffer.concat(parsingContext.currentMessage.partialSize.parts);
    }
    var msgSize = sizeFullBuf.readInt32BE();

    parsingContext.currentMessage.partialSize.parts = [];
    parsingContext.currentMessage.partialSize.size = 0;
    parsingContext.currentMessage.remainingSize = msgSize;
    return;
}


module.exports = {
    parseData: parseData
};
