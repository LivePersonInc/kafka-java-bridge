package com.liveperson.kafka.producer;

import kafka.cluster.Broker;
import kafka.utils.ZKStringSerializer$;
import kafka.utils.ZkUtils;
import org.I0Itec.zkclient.ZkClient;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang.exception.ExceptionUtils;
import org.apache.kafka.clients.producer.Callback;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import scala.collection.JavaConversions;
import scala.collection.Seq;

import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.ExecutionException;

/**
 * Created by elio on 1/9/17.
 */
public abstract class BaseProducer {
    private KafkaProducer kafkaProducer;
    private final Object syncObj;
    private List<SendResult> results;

    protected BaseProducer(Properties props){

        syncObj = new Object();
        results = new ArrayList<SendResult>();

        if(props.containsKey("zookeeper.url")){
            props.put("bootstrap.servers", getBrokers(props.getProperty("zookeeper.url")));
        }

        kafkaProducer = createProducer(props);
    }

    protected abstract KafkaProducer createProducer(Properties props);
    public abstract void sendWithKey(final String msgId, String topic, String value, String key);
    public abstract void sendWithKeyAndPartition(final String msgId, String topic, String value, String key, Integer partition);
    public abstract void send(final String msgId, String topic, String value);

    protected void send(final String msgId, ProducerRecord producerRecord){
        kafkaProducer.send(producerRecord, new Callback() {
            @Override
            public void onCompletion(RecordMetadata recordMetadata, Exception e) {
                if(msgId == null){
                    return;
                }
                SendResult sendResult;
                if(e != null){
                    sendResult = new SendResult(msgId, e.getMessage() + "\n" + ExceptionUtils.getFullStackTrace(e));
                }else{
                    sendResult = new SendResult(msgId, recordMetadata.partition(), String.valueOf(recordMetadata.offset()));
                }
                onResult(sendResult);
            }
        });
    }

    private void onResult(SendResult sendResult){
        synchronized (syncObj){
            results.add(sendResult);
            syncObj.notify();
        }
    }

    public SendResult[] getResults() throws InterruptedException {
        SendResult[] retVal;
        synchronized (syncObj){
            if(results.isEmpty()){
                syncObj.wait();
            }
            retVal = new SendResult[results.size()];
            retVal = results.toArray(retVal);
            results.clear();
        }
        return retVal;
    }

    public void close(){
        kafkaProducer.close();
        synchronized (syncObj){
            syncObj.notify();
        }
    }

    private String getBrokers(String zkHost){
        ZkClient zkclient = new ZkClient(zkHost, 3_000, 3_000, ZKStringSerializer$.MODULE$);
        List<String> brokerHosts = new ArrayList<String>();
        Seq<Broker> allBrokersInCluster = ZkUtils.getAllBrokersInCluster(zkclient);
        List<Broker> brokersList = JavaConversions.asJavaList(allBrokersInCluster);
        for(Broker broker: brokersList){
            brokerHosts.add(broker.connectionString());
        }
        zkclient.close();
        return StringUtils.join(brokerHosts, ',');
    }
}
