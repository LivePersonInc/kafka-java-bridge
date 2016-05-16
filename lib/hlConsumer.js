var events = require("events");
var util = require("util");
var javaInit = require("./util/javaInit.js");
var protocol = require('./protocol');
var java = javaInit.getJavaInstance();
var net = require("net");

var socketIdSeq = 0;

function HLConsumer(options) {
    if (this instanceof HLConsumer === false) {
        return new HLConsumer(options);
    }

    this.zookeeperUrl = options.zookeeperUrl;
    this.groupId = options.groupId;
    this.topic = options.topic;
    this.properties = options.properties;
    this.serverPort = options.serverPort || 3042;
    this.threadCount = options.threadCount || 1;
    this.serverSockets = {};

    var _boundCreateConsumer;
    var _boundStartConsumer;
    var _boundStartListener;

    _bindPrivateFunctions.call(this);

    this.start = function (cb) {
        if (this.hlConsumer) {
            _boundStartConsumer(cb);
            return;
        }

        _boundCreateConsumer(function (err) {
            if (err) {
                cb(err);
            } else {
                _boundStartConsumer(cb);
            }
        });
    };

    this.stop = function (cb) {
        this.hlConsumer.stop(function () {
            var serverClosed = false;
            this.server.close(function () {
                serverClosed = true;
                cb();
            }.bind(this));

            setTimeout(function () {
                if (serverClosed) {
                    return;
                }
                for (var socketId in this.serverSockets) {
                    if (!this.serverSockets.hasOwnProperty(socketId)) {
                        continue;
                    }
                    var socket = this.serverSockets[socketId];
                    socket.destroy();
                    delete this.serverSockets[socketId];
                }
            }.bind(this), 3000);
        }.bind(this));
    };
    function _bindPrivateFunctions() {
        _boundCreateConsumer = _createConsumer.bind(this);
        _boundStartConsumer = _startConsumer.bind(this);
        _boundStartListener = _startListener.bind(this);
    }

    function _startListener() {
        this.server = net.createServer(function (socket) {
            var currentMessage = {remainingSize: 0, parts: [], partialSize: {size: 0, parts: []}};
            var socketId = socketIdSeq++;
            this.serverSockets[socketId] = socket;
            socket.on("data", function (data) {
                var parsingContext = {
                    offset: 0,
                    currentMessage: currentMessage,
                    data: data,
                    onMsgCB: function (message) {
                        this.emit("message", message);
                    }.bind(this)
                };

                protocol.parseData(parsingContext);
            }.bind(this));

            socket.on("error", function (err) {
                this.emit("error", err);
            }.bind(this));

            socket.on("close", function (data) {
                if (this.serverSockets[socketId]) { // Not coming from server close timeout socket destroy
                    delete this.serverSockets[socketId];
                }
            }.bind(this));

        }.bind(this));

        this.server.listen(this.serverPort, "127.0.0.1");
    }

    function _startConsumer(cb) {
        _boundStartListener();
        this.hlConsumer.start(function (err) {
            if (!err) {
                cb(err);
                return;
            }
            this.server.close(function () {
                cb(err);
            });
        }.bind(this));
    }

    function _createConsumer(cb) {

        var topic = java.newInstanceSync("java.lang.String", this.topic);
        var groupId = java.newInstanceSync("java.lang.String", this.groupId);
        var zookeeperUrl = java.newInstanceSync("java.lang.String", this.zookeeperUrl);
        var serverPort = java.newInstanceSync("java.lang.Integer", this.serverPort);
        var threadCount = java.newInstanceSync("java.lang.Integer", this.threadCount);
        var properties = java.newInstanceSync("java.util.Properties");
        if (this.properties) {
            for (var prop in this.properties) {
                if (!this.properties.hasOwnProperty(prop)) {
                    continue;
                }
                var propName = java.newInstanceSync("java.lang.String", prop);
                var propVal = java.newInstanceSync("java.lang.String", this.properties[prop]);
                properties.putSync(propName, propVal);
            }
        }

        var exceptionListener = java.newProxy("com.liveperson.kafka.consumer.ThreadExceptionListener", {
            onThreadException: function (threadNumber, exception) {
                this.emit("error", new Error("Exception in thread No\' " + threadNumber + ", message =>" + exception.getMessageSync()));
            }.bind(this)
        });
        java.newInstance("com.liveperson.kafka.consumer.MultiThreadHLConsumer", zookeeperUrl, groupId, topic, properties, serverPort, threadCount, exceptionListener, function (err, hlConsumer) {
            if (!err) {
                this.hlConsumer = hlConsumer;
            }
            cb(err);
        }.bind(this));
    }
}

util.inherits(HLConsumer, events.EventEmitter);

module.exports = HLConsumer;