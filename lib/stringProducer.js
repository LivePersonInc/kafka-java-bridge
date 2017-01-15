/**
 * Created by elio on 1/9/17.
 */
const Producer = require('./Producer');

class StringProducer extends Producer{
    constructor(options) {
        super(options, "com.liveperson.kafka.producer.StringProducer", "org.apache.kafka.common.serialization.StringSerializer");
    }
}

module.exports = StringProducer;