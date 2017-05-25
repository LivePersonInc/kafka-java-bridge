var javaInit = require("./util/javaInit.js");
var java = javaInit.getJavaInstance();


class Producer{
    constructor(options, producerClass, serializerClass){
        this._createProducer(options, producerClass, serializerClass);
    }


    send(topic, msg, cb) {
        const msgId = this._addMsgToPending(topic, cb);
        this.producer.send(msgId, topic, msg, (err) => {
            if(err){
                delete this.pendingResult[msgId];
                if(cb){
                    cb(err);
                }
            }
        });
    }

    sendWithKey(topic, msg, key, cb) {
        const msgId = this._addMsgToPending(topic, cb);
        this.producer.sendWithKey(msgId, topic, msg, key, function(err){
            if(err){
                delete this.pendingResult[msgId];
                if(cb){
                    cb(err);
                }
            }
        }.bind(this));
    }

    sendWithKeyAndPartition(topic, msg, key, partition, cb) {
        const msgId = this._addMsgToPending(topic, cb);
        this.producer.sendWithKeyAndPartition(msgId, topic, msg, key, partition, function(err){
            if(err){
                delete this.pendingResult[msgId];
                if(cb){
                    cb(err);
                }
            }
        }.bind(this));
    }

    close(cb) {
        this.producer.close(function(){
            this.closed = true;
            if(cb){
                cb();
            }
        }.bind(this));
    }

    _addMsgToPending(topic, cb){
        if(!cb){
            return null;
        }
        this.msgCount++;
        const msgId = this.msgCount.toString();
        this.pendingResult[msgId] = {topic: topic, cb: cb};
        return msgId;
    }

    _createProducer(options, producerClass, serializerClass){
        this.msgCount = 0;
        this.pendingResult = {};
        var properties = java.newInstanceSync("java.util.Properties");
        properties.putSync("key.serializer", serializerClass);
        properties.putSync("value.serializer", serializerClass);
        if(options.bootstrapServers){
            properties.putSync("bootstrap.servers", options.bootstrapServers);
        }

        if(options.zookeeperUrl){
            properties.putSync("zookeeper.url", options.zookeeperUrl);
        }

        if (options.properties) {
            for (var prop in options.properties) {
                if (!options.properties.hasOwnProperty(prop)) {
                    continue;
                }

                properties.putSync(prop, options.properties[prop]);
            }
        }

        this.producer = java.newInstanceSync(producerClass, properties);
        this._boundGetResults = this._getResults.bind(this);
        this._boundGetResultsJavaCB = this._getResultsJavaCB.bind(this);
        this._boundGetResults();
    }

    _getResults() {
        if(!(this.closed && Object.keys(this.pendingResult).length === 0)){
            this.producer.getResults(this._boundGetResultsJavaCB);
        }
    }

    _getResultsJavaCB(err, results){
        if(err || !results || results.length === 0){
            setTimeout(this._boundGetResults, 0);
            return;
        }

        for(let counter = 0; counter < results.length; counter++){
            const result = results[counter];
            const pendingResult = this.pendingResult[result.msgId];
            if(!pendingResult){
                continue;
            }

            if(!pendingResult.cb){
                delete this.pendingResult[result.msgId];
                continue;
            }

            if(result.err){
                pendingResult.cb(new Error(result.err));
            }else{
                pendingResult.cb(null, {topic:pendingResult.topic, partition: result.partition, offset: result.offset});
            }

            delete this.pendingResult[result.msgId];
        }

        setTimeout(this._boundGetResults, 0);
    }
}

module.exports = Producer;
