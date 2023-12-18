kafka-java-bridge
=================
## for mirroring tests2
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.svg)](http://gruntjs.com/)
[![Build Status](https://travis-ci.org/LivePersonInc/kafka-java-bridge.svg)](https://travis-ci.org/LivePersonInc/kafka-java-bridge)
[![npm version](https://badge.fury.io/js/kafka-java-bridge.svg)](http://badge.fury.io/js/kafka-java-bridge)
[![Dependency Status](https://david-dm.org/LivePersonInc/kafka-java-bridge.svg?theme=shields.io)](https://david-dm.org/LivePersonInc/kafka-java-bridge)
[![devDependency Status](https://david-dm.org/LivePersonInc/kafka-java-bridge/dev-status.svg?theme=shields.io)](https://david-dm.org/LivePersonInc/kafka-java-bridge#info=devDependencies)
[![npm downloads](https://img.shields.io/npm/dm/kafka-java-bridge.svg)](https://img.shields.io/npm/dm/kafka-java-bridge.svg)
[![NPM](https://nodei.co/npm/kafka-java-bridge.png)](https://nodei.co/npm/kafka-java-bridge/)
[![license](https://img.shields.io/npm/l/kafka-java-bridge.svg)](LICENSE)

Nodejs wrapper for the [JAVA kafka 0.8 client API](http://kafka.apache.org/082/documentation.html). 


  * [Motivation](#motivation)
  * [Installation](#installation)
  * [Example](#example)
  * [Performance and stability](#performance-and-stability)
  * [API](#api)
  * [Adding your own jars to classpath](#adding-your-own-jars-to-classpath)
  * [Java Tier Logging](#java-tier-logging)
  * [Troubleshooting](#troubleshooting)
  * [Sources](#sources)
  * [License](#license)

Motivation
==========

The need to have a production quality kafka0.8 client implementation in Nodejs. Please see:
  * [Performance and stability](#performance-and-stability)
for detailed information.

Installation
============

1. Make sure you have java v7 or higher installed
2. Run `npm install kafka-java-bridge`

Consumer Example
============
```javascript

var HLConsumer = require("kafka-java-bridge").HLConsumer;

var consumerOptions = {
    zookeeperUrl: "zookeeper1:2181,zookeeper2:2181,zookeeper3:2181/kafka",
    groupId: "example-consumer-group-id",
    topics: ["example-topic1","example-topic2"],
    getMetadata: true
};

var consumer = new HLConsumer(consumerOptions);

consumer.start(function (err) {
    if (err) {
        console.log("Error occurred when starting consumer. err:", err);
    } else {
        console.log("Started consumer successfully");
    }
});

consumer.on("message", function (msg, metadata) {
    console.log("On message. message:", msg);
    console.log("On message. metadata:", JSON.stringify(metadata));
});

consumer.on("error", function (err) {
    console.log("On error. err:", err);
});

process.on('SIGINT', function() {
    consumer.stop(function(){
       console.log("consumer stopped");
        // Timeout to allow logs to print
        setTimeout(function(){
            process.exit();
        } , 300);
    });
});

```

Producer Example
============
```javascript
var StringProducer = require('kafka-java-bridge').StringProducer;
var BinaryProducer = require('kafka-java-bridge').BinaryProducer;

var stringProducer = new StringProducer({bootstrapServers: "broker1:9092, broker2:9092"});
var binaryProducer = new BinaryProducer({zookeeperUrl: "zookeeper1:2181,zookeeper2:2181,zookeeper3:2181/kafka"});

const buf = new Buffer([0x0, 0x1, 0x2, 0x3, 0x4]);
binaryProducer.send("myBinaryTopic", buf, function(err, msgMetadata){
    console.log('send msg cb. err = ' + err + '. metadata = ' + JSON.stringify(msgMetadata));
});
stringProducer.send("myStringTopic", "testString", function(err, msgMetadata){
    console.log('send msg cb. err = ' + err + '. metadata = ' + JSON.stringify(msgMetadata));
});

process.on('SIGINT', function() {
    stringProducer.close(function(err){
        binaryProducer.close(function(err) {
            process.exit();
        });
    });
});
```
Performance and stability
============

### Performance

Libraries compared:

* kafka-java-bridge , this package.
* [kafka-node](https://github.com/SOHU-Co/kafka-node), available High Level Consumer for kafka0.8.

1. We show below representative cpu consumption (lower is better) for processing same amount of messages per second(~11K).

![image 1](https://cloud.githubusercontent.com/assets/3764373/15296980/8a3ac996-1ba0-11e6-92d2-0e9c69e14d2b.png).

|*Library name* |*CPU% average*|
|:----------------:|:------------:|
|kafka-java-bridge |11.76         |
|kafka-node        |73            |


2. Consumer comparision (number of messages). Tested with 16GB Ram, 4 core machine on Amazon AWS EC2 Instance. (Metircs measured with Newrelic)

|*Library name* |*Rpm Avg*|*Network Avg*|*Cpu/System Avg*|
|:----------------:|:------------:|:------------:|:------------:|
|kafka-java-bridge |947K     |300 Mb/s        |6.2%  |
|kafka-node        |87.5K     |75 Mb/s         |11.2% |

![Kakfa-Java-Bridge RPM](https://s5.postimg.org/qqmxdmpif/6929a69b-bb0f-4191-bb2d-df52cf62e548.jpg)
![Kafka-Node RPM](https://s5.postimg.org/437o7h9yf/cc9a8b40-5a71-4a3c-94f4-a9ceb097a01c.jpg)

### Stability

Kafka-java-bridge wraps [Confluent](http://www.confluent.io/)'s official Java High Level Consumer. 

While testing [kafka-node](https://github.com/SOHU-Co/kafka-node) we encountered multiple [issues](https://github.com/SOHU-Co/kafka-node/issues) such as:

* [Duplicate messages](https://github.com/SOHU-Co/kafka-node/issues/218)
* [Rebalancing errors](https://github.com/SOHU-Co/kafka-node/issues/341)

Those issues along side with the inadequate performance results where the trigger for developing this library.



API
============
###  HLConsumer(options)

Consumer object allows messages fetching from kafka topic. 
Each consumer can consume messages from multiple topics.

```javascript

var consumerOptions = {
    zookeeperUrl: "zookeeper1:2181,zookeeper2:2181,zookeeper3:2181/kafka",
    groupId: "example-consumer-group-id",
    topic: "example-topic",
    serverPort: 3042,// Optional
    threadCount: 1,// Optional
    properties: {"rebalance.max.retries": "3"}// Optional
};

```


| *Option name* |*Mandatory*    |*Type*   |*Default value*|*Description*|
|:--------------|:-------------:|:--------|:-------------:|:------------|
| zookeeperUrl  | Yes           |`String` |`undefined`    |Zookeeper connection string.|
| groupId       | Yes           |`String` |`undefined`    |Kafka consumer groupId.  From [kafka documentation](http://kafka.apache.org/082/documentation.html#consumerconfigs): groupId is a string that uniquely identifies the group of consumer processes to which this consumer belongs. By setting the same group id multiple processes indicate that they are all part of the same consumer group.|
| topic         | No            |`String` |`undefined`     |Kafka topic name.|
| getMetadata   | No            |`boolean`|false          |If true, message metadata(topic, partition, offset) will be provided with each message. Use false for better performance.|
| topics        | Yes           |`Array of String`  |`undefined`    |Kafka topics names array.|
| serverPort    | No            |`Number` |`3042`         |Internal server port used to transfer the messages from the java thread to the node js thread.|
|threadCount    | No            |`Number` |`1`            |The threading model revolves around the number of partitions in your topic and there are some very specific rules. For More information: [kafka consumer groups](https://cwiki.apache.org/confluence/display/KAFKA/Consumer+Group+Example)|                                                   | getMetadata   | No           |`Boolean` |`false`        |Get message metadata (contains topic, partition and offset ).|                                                                                            
|properties     | No            |`Object` |`undefined`    |Properties names can be found in the following table: [high level consumer properties](http://kafka.apache.org/082/documentation.html#consumerconfigs).|                                                    
                                                                                                              

### Events emitted by the HLConsumer:

* message: this event is emitted when a message is consumed from kafka.
* error: this event is emitted when an error occurs while consuming messages.

### hlConsumer.start(cb)
Start consumer messages from kafka topic.

cb - callback is called when the consumer is started.

If callback was called with err it means consumer failed to start.

### hlConsumer.stop(cb)
Stop consuming messages.

cb - callback is called when the consumer is stopped.

**message/error events can still be emitted until stop callback is called.**


## StringProducer(options) / BinaryProducer(options)

Producer object produces messages to kafka. With each message topic is specified so one producer can produce messages to multiple topics.

**StringProducer should be used to send string messages.**
**BinaryProducer should be used to send binary messages.**

```javascript

var producerOptions = {
    zookeeperUrl: "zookeeper1:2181,zookeeper2:2181,zookeeper3:2181/kafka",
    properties: {"client.id": "kafka-java-bridge"}// Optional
};
OR 
var producerOptions = {
    bootstrapServers: "kafka:2181,kafka2:2181,kafka3:2181/kafka",
    properties: {"client.id": "kafka-java-bridge"}// Optional
};

```


| *Option name* |*Mandatory*    |*Type*   |*Default value*|*Description*|
|:--------------|:-------------:|:--------|:-------------:|:------------|
| bootstrapServers| NO           |`String` |`undefined`    |Kafka broker connection string.|
| zookeeperUrl  | No           |`String` |`undefined`    |Zookeeper connection string. If provided, broker list will be retrieved from standard path.|
| properties     | No            |`Object` |`undefined`    |Properties names can be found in the following table: [high level producer properties](http://kafka.apache.org/documentation.html#producerconfigs).|

### producer.send(topic, msg, cb)

topic - target topic name `String`.

msg - message to be sent to kafka `String` or `Buffer`.

cb - callback is called when message is sent. with err in case of failure or msg metadata in case of success.

### producer.sendWithKey(topic, msg, key, cb)

topic - target topic name `String`.

msg - message to be sent to kafka `String` or `Buffer`.

key - kafka message key `String` or `Buffer`.

cb - callback is called when message is sent. with err in case of failure or msg metadata in case of success.

### producer.sendWithKeyAndPartition(topic, msg, key, partition, cb)

topic - target topic name `String`.

msg - message to be sent to kafka `String` or `Buffer`.

key - kafka message key `String` or `Buffer`.

partition - target partition `Integer`.

cb - callback is called when message is sent. with err in case of failure or msg metadata in case of success.


Adding Your Own Jars To Classpath
================================

If you wish to add jars to the classpath, it can be done by placing them at:

{app root path}/kafka-java-bridge/java/lib/yourjar.jar


Java Tier Logging
=================

By default, underlying java tier logging is disabled.

If you wish to enable java tier logging you can place your own log4j.properties file at:

{app root path}/kafka-java-bridge/log4j/log4j.properties

Troubleshooting
===============

In case of installation failure, you may want to take a look at our dependency java npm [installation](https://www.npmjs.com/package/java#installation) and [troubleshooting](https://www.npmjs.com/package/java#troubleshooting) sections.

If you are working on a windows machine, you may want to look at [windows-build-tools](https://www.npmjs.com/package/windows-build-tools) for native code compilation issues.

Sources
=======

* [kafka consumer groups](https://cwiki.apache.org/confluence/display/KAFKA/Consumer+Group+Example).
* [Java book example reference](https://github.com/bkimminich/apache-kafka-book-examples).

License
=======
MIT
