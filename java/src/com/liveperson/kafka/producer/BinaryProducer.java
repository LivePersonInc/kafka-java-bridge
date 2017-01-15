package com.liveperson.kafka.producer;


import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;

import java.util.*;

/**
 * Created by elio on 1/5/17.
 */
public class BinaryProducer extends BaseProducer {


    public BinaryProducer(Properties props){
        super(props);
    }

    @Override
    protected KafkaProducer createProducer(Properties props) {
        return new KafkaProducer<byte[], byte[]>(props);
    }

    @Override
    public void sendWithKey(String msgId, String topic, String value, String key) {
        ProducerRecord<byte[], byte[]> producerRecord = new ProducerRecord<byte[], byte[]>(topic, value.getBytes(), key.getBytes());
        send(msgId, producerRecord);
    }

    @Override
    public void sendWithKeyAndPartition(String msgId, String topic, String value, String key, Integer partition) {
        ProducerRecord<byte[], byte[]> producerRecord = new ProducerRecord<byte[], byte[]>(topic, partition, value.getBytes(), key.getBytes());
        send(msgId, producerRecord);
    }

    @Override
    public void send(String msgId, String topic, String value) {
        ProducerRecord<byte[], byte[]> producerRecord = new ProducerRecord<byte[], byte[]>(topic, value.getBytes());
        send(msgId, producerRecord);
    }
}
