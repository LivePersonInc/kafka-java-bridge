package com.liveperson.kafka.consumer;

/**
 * Created by elio on 4/17/2016.
 */
public interface ThreadExceptionListener {
    void onThreadException(int threadNumber, Exception ex);
}
