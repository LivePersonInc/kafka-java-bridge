var expect = require("chai").expect;
var requireHelper = require("./util/require_helper");
var protocol = requireHelper('protocol');

describe("Protocol tests", function () {

    it("Test single message", function () {
        var currentMessage = {remainingSize: 0, parts: [], partialSize: {size: 0, parts: []}};
        var buffer = new Buffer(14);
        var messages = [];
        buffer.writeInt32BE(10, 0);
        buffer.write("0123456789", 4);
        var parsingContext = {
            offset: 0,
            currentMessage: currentMessage,
            data: buffer,
            onMsgCB:function(message){
                messages.push(message);
            }
        };
        protocol.parseData(parsingContext);
        expect(messages.length).to.equal(1);
        expect(messages[0].toString()).to.equal("0123456789");
        expect(parsingContext.offset).to.equal(buffer.length);
    });

    it("Test multiple messages", function () {
        var currentMessage = {remainingSize: 0, parts: [], partialSize: {size: 0, parts: []}};
        var buffer = new Buffer(27);
        var messages = [];
        buffer.writeInt32BE(10, 0);
        buffer.write("0123456789", 4);
        buffer.writeInt32BE(9, 14);
        buffer.write("abcdefghi", 18);
        var parsingContext = {
            offset: 0,
            currentMessage: currentMessage,
            data: buffer,
            onMsgCB:function(message){
                messages.push(message);
            }
        };
        protocol.parseData(parsingContext);
        expect(messages.length).to.equal(2);
        expect(messages[0].toString()).to.equal("0123456789");
        expect(messages[1].toString()).to.equal("abcdefghi");
        expect(parsingContext.offset).to.equal(buffer.length);
    });


    it("Test partial message update current message", function () {
        var currentMessage = {remainingSize: 0, parts: [], partialSize: {size: 0, parts: []}};
        var buffer = new Buffer(14);
        var messages = [];
        buffer.writeInt32BE(15, 0);
        buffer.write("0123456789", 4);
        var parsingContext = {
            offset: 0,
            currentMessage: currentMessage,
            data: buffer,
            onMsgCB:function(message){
                messages.push(message);
            }
        };
        protocol.parseData(parsingContext);
        expect(messages.length).to.equal(0);
        expect(currentMessage.remainingSize).to.equal(5);
        expect(parsingContext.offset).to.equal(buffer.length);
    });

    it("Test remaining message part", function () {
        var currentMessage = {remainingSize: 0, parts: [], partialSize: {size: 0, parts: []}};
        var buffer = new Buffer(14);
        var messages = [];
        buffer.writeInt32BE(15, 0);
        buffer.write("0123456789", 4);
        var parsingContext = {
            offset: 0,
            currentMessage: currentMessage,
            data: buffer,
            onMsgCB:function(message){
                messages.push(message);
            }
        };
        protocol.parseData(parsingContext);
        expect(messages.length).to.equal(0);
        expect(currentMessage.remainingSize).to.equal(5);
        expect(parsingContext.offset).to.equal(buffer.length);
        buffer = new Buffer(5);
        buffer.write("abcde", 0);
        parsingContext = {
            offset: 0,
            currentMessage: currentMessage,
            data: buffer,
            onMsgCB:function(message){
                messages.push(message);
            }
        };
        messages = [];
        protocol.parseData(parsingContext);
        expect(messages.length).to.equal(1);
        expect(currentMessage.remainingSize).to.equal(0);
        expect(messages[0].toString()).to.equal("0123456789abcde");
        expect(parsingContext.offset).to.equal(buffer.length);

    });

    it("Test message partial message new data still not complete", function () {
        var currentMessage = {remainingSize: 0, parts: [], partialSize: {size: 0, parts: []}};
        var buffer = new Buffer(14);
        var messages = [];
        buffer.writeInt32BE(20, 0);
        buffer.write("0123456789", 4);
        var parsingContext = {
            offset: 0,
            currentMessage: currentMessage,
            data: buffer,
            onMsgCB:function(message){
                messages.push(message);
            }
        };
        protocol.parseData(parsingContext);
        expect(messages.length).to.equal(0);
        expect(currentMessage.remainingSize).to.equal(10);
        expect(parsingContext.offset).to.equal(buffer.length);
        buffer = new Buffer(5);
        buffer.write("abcde", 0);
        parsingContext = {
            offset: 0,
            currentMessage: currentMessage,
            data: buffer,
            onMsgCB:function(message){
                messages.push(message);
            }
        };
        messages = [];
        protocol.parseData(parsingContext);
        expect(messages.length).to.equal(0);
        expect(currentMessage.remainingSize).to.equal(5);
        expect(parsingContext.offset).to.equal(buffer.length);
    });

    it("Test partial size", function () {
        var currentMessage = {remainingSize: 0, parts: [], partialSize: {size: 0, parts: []}};
        var buffer = new Buffer(2);
        var messages = [];
        buffer.writeInt16BE(0, 0);
        var parsingContext = {
            offset: 0,
            currentMessage: currentMessage,
            data: buffer,
            onMsgCB:function(message){
                messages.push(message);
            }
        };
        protocol.parseData(parsingContext);
        expect(messages.length).to.equal(0);
        expect(currentMessage.remainingSize).to.equal(0);
        expect(currentMessage.partialSize.size).to.equal(2);
        expect(currentMessage.partialSize.parts.length).to.equal(1);
        expect(parsingContext.offset).to.equal(buffer.length);
    });

    it("Test partial size size complete", function () {
        var currentMessage = {remainingSize: 0, parts: [], partialSize: {size: 0, parts: []}};
        var buffer = new Buffer(2);
        var messages = [];
        buffer.writeInt16BE(0, 0);
        var parsingContext = {
            offset: 0,
            currentMessage: currentMessage,
            data: buffer,
            onMsgCB:function(message){
                messages.push(message);
            }
        };
        messages = [];
        protocol.parseData(parsingContext);
        expect(messages.length).to.equal(0);
        expect(currentMessage.remainingSize).to.equal(0);
        expect(currentMessage.partialSize.size).to.equal(2);
        expect(currentMessage.partialSize.parts.length).to.equal(1);
        expect(parsingContext.offset).to.equal(buffer.length);
        buffer = new Buffer(12);
        buffer.writeInt16BE(10, 0);
        buffer.write("0123456789", 2);
        parsingContext = {
            offset: 0,
            currentMessage: currentMessage,
            data: buffer,
            onMsgCB:function(message){
                messages.push(message);
            }
        };
        protocol.parseData(parsingContext);
        expect(messages.length).to.equal(1);
        expect(messages[0].toString()).to.equal("0123456789");
        expect(parsingContext.offset).to.equal(buffer.length);
    });
});