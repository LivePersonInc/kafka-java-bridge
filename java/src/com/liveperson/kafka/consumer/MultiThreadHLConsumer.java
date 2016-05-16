package com.liveperson.kafka.consumer;

import kafka.consumer.Consumer;
import kafka.consumer.ConsumerConfig;
import kafka.consumer.KafkaStream;
import kafka.javaapi.consumer.ConsumerConnector;
import org.apache.log4j.net.SyslogAppender;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;


/**
 * Created by elio on 4/17/2016.
 */
public class MultiThreadHLConsumer {

    private final static int TERMINATION_SECS = 5;

    private ExecutorService executor;
    private ConsumerConnector consumer;
    private String topic;
    private ConsumerThread consumerThread;
    private int threadCount;
    private boolean debugPrintStats;
    private ThreadExceptionListener exceptionListener;
    private long debugPrintIntervalMS;
    private int consumerServerPort;
    private Properties properties;

    public MultiThreadHLConsumer(String zookeeper, String groupId, String topic, Properties clientProps, int consumerServerPort, int threadCount, ThreadExceptionListener exceptionListener){
        properties = new Properties();
        properties.put("zookeeper.connect", zookeeper);
        properties.put("group.id", groupId);
        if(clientProps != null){
            properties.putAll(clientProps);
        }

        this.topic = topic;
        this.threadCount = threadCount;
        this.exceptionListener = exceptionListener;
        this.consumerServerPort = consumerServerPort;
    }

    public void start(){
        consumer = Consumer.createJavaConsumerConnector(new ConsumerConfig(properties));
        Map<String, Integer> topicCount = new HashMap<String, Integer>();
        topicCount.put(topic, threadCount);

        Map<String, List<KafkaStream<byte[], byte[]>>> consumerStreams = consumer.createMessageStreams(topicCount);
        List<KafkaStream<byte[], byte[]>> streams = consumerStreams.get(topic);

        executor = Executors.newFixedThreadPool(threadCount);

        int threadNumber = 0;
        for (final KafkaStream stream : streams) {
            executor.submit(new ConsumerThread(stream, threadNumber, consumerServerPort, exceptionListener));
            threadNumber++;
        }
    }

    public void stop(){
        if (consumer != null) {
            consumer.shutdown();
        }

        if (executor != null) {
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
