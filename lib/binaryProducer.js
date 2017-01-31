/**
 * Created by elio on 1/9/17.
 */
const Producer = require('./producer');

class BinaryProducer extends Producer{
    constructor(options) {
        super(options, "com.liveperson.kafka.producer.BinaryProducer", "org.apache.kafka.common.serialization.ByteArraySerializer");
    }

    send(topic, msg, cb) {
        super.send(topic, msg.toString('binary'), cb);
    }

    sendWithKey(topic, msg, key, cb) {
       super.sendWithKey(topic, msg.toString('binary'), key.toString('binary'), cb);
    }

    sendWithKeyAndPartition(topic, msg, key, partition, cb) {
        super.sendWithKeyAndPartition(topic, msg.toString('binary'), key.toString('binary'), partition, cb);
    }
}

module.exports = BinaryProducer;
