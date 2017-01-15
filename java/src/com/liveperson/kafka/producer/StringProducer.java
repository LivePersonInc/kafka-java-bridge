package com.liveperson.kafka.producer;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;

import java.util.Properties;

/**
 * Created by elio on 1/9/17.
 */
public class StringProducer extends BaseProducer {

    public StringProducer(Properties props) {
        super(props);
    }

    @Override
    protected KafkaProducer createProducer(Properties props) {
        return new KafkaProducer<String, String>(props);
    }

    @Override
    public void sendWithKey(String msgId, String topic, String value, String key) {
        ProducerRecord<String, String> producerRecord = new ProducerRecord<String, String>(topic, value, key);
        send(msgId, producerRecord);
    }

    @Override
    public void sendWithKeyAndPartition(String msgId, String topic, String value, String key, Integer partition) {
        ProducerRecord<String, String> producerRecord = new ProducerRecord<String, String>(topic, partition, value, key);
        send(msgId, producerRecord);
    }

    @Override
    public void send(String msgId, String topic, String value) {
        ProducerRecord<String, String> producerRecord = new ProducerRecord<String, String>(topic, value);
        send(msgId, producerRecord);
    }
}
