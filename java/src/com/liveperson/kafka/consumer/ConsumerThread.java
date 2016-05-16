package com.liveperson.kafka.consumer;

import kafka.consumer.ConsumerIterator;
import kafka.consumer.KafkaStream;
import java.io.BufferedOutputStream;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Created by elio on 4/17/2016.
 */
public class ConsumerThread implements Runnable {

    private KafkaStream stream;
    private int threadNumber;
    private ThreadExceptionListener exceptionListener;
    private int consumerServerPort;

    public ConsumerThread(KafkaStream stream, int threadNumber, int consumerServerPort, ThreadExceptionListener exceptionListener) {
        this.threadNumber = threadNumber;
        this.stream = stream;
        this.exceptionListener = exceptionListener;
        this.consumerServerPort = consumerServerPort;
    }

    @Override
    public void run() {

        Socket clientSocket = null;
        try{
            ConsumerIterator<byte[], byte[]> it = stream.iterator();

            clientSocket = new Socket("localhost", consumerServerPort);
            BufferedOutputStream outToServer = new BufferedOutputStream(clientSocket.getOutputStream(), 8192);
            while (it.hasNext()) {
                byte[] msg = it.next().message();
                outToServer.write(ByteBuffer.allocate(4).putInt(msg.length).array());
                outToServer.write(msg);
                outToServer.flush();
            }

            clientSocket.shutdownOutput();
        }catch(Exception ex){
            exceptionListener.onThreadException(threadNumber, ex);
            if(clientSocket != null){
                try{
                    clientSocket.shutdownOutput();
                }catch(Exception e){

                }
            }
        }
    }
}
