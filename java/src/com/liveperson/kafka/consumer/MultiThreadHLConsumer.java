package com.liveperson.kafka.consumer;

import kafka.consumer.Consumer;
import kafka.consumer.ConsumerConfig;
import kafka.consumer.KafkaStream;
import kafka.javaapi.consumer.ConsumerConnector;

import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;


/**
 * Created by elio on 4/17/2016.
 */
public class MultiThreadHLConsumer {

    private final static int TERMINATION_SECS = 5;

    private ExecutorService executor;
    private ConsumerConnector consumer;
    private String[] topics;
    private int threadCount;
    private ThreadExceptionListener exceptionListener;
    private int consumerServerPort;
    private Properties properties;
    private boolean getMetadata;

    public MultiThreadHLConsumer(String zookeeper, String groupId, String[] topics, Properties clientProps, int consumerServerPort, int threadCount, boolean getMetadata, ThreadExceptionListener exceptionListener){
        properties = new Properties();
        properties.put("zookeeper.connect", zookeeper);
        properties.put("group.id", groupId);
        if(clientProps != null){
            properties.putAll(clientProps);
        }

        this.topics = topics;
        this.threadCount = threadCount;
        this.exceptionListener = exceptionListener;
        this.consumerServerPort = consumerServerPort;
        this.getMetadata = getMetadata;
    }

    public void start(){
        consumer = Consumer.createJavaConsumerConnector(new ConsumerConfig(properties));
        Map<String, Integer> topicCount = new HashMap<String, Integer>();
        for(String topic: topics) {
            topicCount.put(topic, threadCount);
        }

        Map<String, List<KafkaStream<byte[], byte[]>>> consumerStreams = consumer.createMessageStreams(topicCount);
        executor = Executors.newFixedThreadPool(threadCount * this.topics.length);

        try{
            for(String topic: topics){
                int threadNumber = 0;
                List<KafkaStream<byte[], byte[]>> streams = consumerStreams.get(topic);

                for (final KafkaStream stream : streams) {
                    executor.submit(new ConsumerThread(stream, threadNumber, consumerServerPort, getMetadata, exceptionListener));
                    threadNumber++;
                }
            }
        }catch(Exception ex){
            stop();
            throw ex;
        }
    }

    public void stop(){
        if (consumer != null) {
            consumer.shutdown();
        }

        if(executor != null) {
            executor.shutdown();
            try {
                if(!executor.awaitTermination(TERMINATION_SECS, TimeUnit.SECONDS)){
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
            }
        }
    }
}
