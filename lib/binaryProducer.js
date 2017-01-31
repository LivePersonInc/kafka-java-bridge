/**
 * Created by elio on 1/9/17.
 */
const Producer = require('./producer');

class BinaryProducer extends Producer{
    constructor(options) {
        super(options, "com.liveperson.kafka.producer.BinaryProducer", "org.apache.kafka.common.serialization.ByteArraySerializer");
    }

    send(topic, msg, cb) {
        super.send(topic, msg.toString('base64'), cb);
    }

    sendWithKey(topic, msg, key, cb) {
       super.sendWithKey(topic, msg.toString('base64'), key.toString('base64'), cb);
    }

    sendWithKeyAndPartition(topic, msg, key, partition, cb) {
        super.sendWithKeyAndPartition(topic, msg.toString('base64'), key.toString('base64'), partition, cb);
    }
}

module.exports = BinaryProducer;
