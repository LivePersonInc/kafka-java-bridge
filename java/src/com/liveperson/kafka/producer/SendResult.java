package com.liveperson.kafka.producer;


/**
 * Created by elio on 1/8/17.
 */
public class SendResult {
    public String msgId;
    public int partition;
    public String offset;
    public String err;

    public SendResult(){

    }

    public SendResult(String msgId, int partition, String offset) {
        this.msgId = msgId;
        this.partition = partition;
        this.offset = offset;
    }

    public SendResult(String msgId, String err) {
        this.msgId = msgId;
        this.err = err;
    }
}
