package com.liveperson.kafka.consumer;

import kafka.consumer.ConsumerIterator;
import kafka.consumer.KafkaStream;
import kafka.message.MessageAndMetadata;

import java.io.BufferedOutputStream;
import java.net.Socket;
import java.nio.ByteBuffer;

/**
 * Created by elio on 4/17/2016.
 */
public class ConsumerThread implements Runnable {

    private KafkaStream stream;
    private int threadNumber;
    private ThreadExceptionListener exceptionListener;
    private int consumerServerPort;
    private boolean getMetadata;

    public ConsumerThread(KafkaStream stream, int threadNumber, int consumerServerPort, boolean getMetadata, ThreadExceptionListener exceptionListener) {
        this.threadNumber = threadNumber;
        this.stream = stream;
        this.exceptionListener = exceptionListener;
        this.consumerServerPort = consumerServerPort;
        this.getMetadata = getMetadata;
    }

    @Override
    public void run() {

        Socket clientSocket = null;
        try{
            ConsumerIterator<byte[], byte[]> it = stream.iterator();

            clientSocket = new Socket("localhost", consumerServerPort);
            BufferedOutputStream outToServer = new BufferedOutputStream(clientSocket.getOutputStream(), 8192);
            while (it.hasNext()) {
                byte[] msg;
                if(getMetadata){
                    MessageAndMetadata<byte[], byte[]> messageAndMetadata = it.next();
                    msg = messageAndMetadata.message();
                    byte[] topic = messageAndMetadata.topic().getBytes();
                    long offset = messageAndMetadata.offset();
                    int partition = messageAndMetadata.partition();
                    outToServer.write(ByteBuffer.allocate(4).putInt(msg.length + 4 + 8 + 4 + topic.length).array());
                    outToServer.write(ByteBuffer.allocate(4).putInt(topic.length).array());
                    outToServer.write(ByteBuffer.allocate(8).putLong(offset).array());
                    outToServer.write(ByteBuffer.allocate(4).putInt(partition).array());
                    outToServer.write(topic);
                }else{
                    msg = it.next().message();
                    outToServer.write(ByteBuffer.allocate(4).putInt(msg.length).array());
                }
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
