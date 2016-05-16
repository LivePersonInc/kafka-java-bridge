kafka-java-bridge
=================

[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)
[![Build Status](https://travis-ci.org/LivePersonInc/kafka-java-bridge.svg)](https://travis-ci.org/LivePersonInc/kafka-java-bridge)
[![npm version](https://badge.fury.io/js/kafka-java-bridge.svg)](http://badge.fury.io/js/kafka-java-bridge)
[![Dependency Status](https://david-dm.org/LivePersonInc/kafka-java-bridge.svg?theme=shields.io)](https://david-dm.org/LivePersonInc/kafka-java-bridge)
[![devDependency Status](https://david-dm.org/LivePersonInc/kafka-java-bridge/dev-status.svg?theme=shields.io)](https://david-dm.org/LivePersonInc/kafka-java-bridge#info=devDependencies)
[![npm downloads](https://img.shields.io/npm/dm/kafka-java-bridge.svg)](https://img.shields.io/npm/dm/kafka-java-bridge.svg)
[![NPM](https://nodei.co/npm/kafka-java-bridge.png)](https://nodei.co/npm/kafka-java-bridge/)

Nodejs wrapper for the [JAVA high level kafka 0.8 consumer API](http://kafka.apache.org/082/documentation.html#highlevelconsumerapi). 

=================

  * [Motivation](#motivation)
  * [Installation](#installation)
  * [Example](#example)
  * [Performance and stability](#performance-and-stability)
  * [API](#api)
  * [Sources](#sources)
  * [License](#license)

Motivation
==========

The need to have a production quality kafka0.8 high level consumer implementation in Nodejs. Please see:
  * [Performance and stability](#performance-and-stability)
for detailed information.

Installation
============

1. Make sure you have java v7 or higher installed
2. Run `npm install kafka-java-bridge`

Example
============
```javascript

var HLConsumer = require("kafka-java-bridge").HLConsumer;

var consumerOptions = {
    zookeeperUrl: "zookeeper1:2181,zookeeper2:2181,zookeeper3:2181/kafka",
    groupId: "example-consumer-group-id",
    topic: "example-topic"
};

var consumer = new HLConsumer(consumerOptions);

consumer.start(function (err) {
    if (err) {
        console.log("Error occurred when starting consumer. err:", err);
    } else {
        console.log("Started consumer successfully");
    }
});

consumer.on("message", function (msg) {
    console.log("On message. message:", msg);
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

Performance and stability
============

### Performance

Libraries compared:

* kafka-java-bridge , this package.
* [kafka-node](https://github.com/SOHU-Co/kafka-node), available High Level Consumer for kafka0.8.

We show below representative cpu consumption (lower is better) for processing same amount of messages per second(~11K).

![image](https://cloud.githubusercontent.com/assets/3764373/15294778/49a5fdce-1b96-11e6-827f-1d3a1e3159ec.png).

|*Library name* |*CPU% average*|
|:----------------:|:------------:|
|kafka-java-bridge |11.76         |
|kafka-node        |73            |

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
Each consumer can consume messages from one topic. For consuming messages from multiple topics you need multiple consumers.

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
| zookeeperUrl  | yes           |`String` |`undefined`    |Zookeeper connection string.|
| groupId       | yes           |`String` |`undefined`    |Kafka consumer groupId.  From [kafka documentation](http://kafka.apache.org/082/documentation.html#consumerconfigs): groupId is a string that uniquely identifies the group of consumer processes to which this consumer belongs. By setting the same group id multiple processes indicate that they are all part of the same consumer group.|
| topic         | yes           |`String` |`undefined`    |Kafka topic name.|
| serverPort    | No            |`Number` |`3042`         |Internal server port used to transfer the messages from the java thread to the node js thread.|
|threadCount    | No            |`Number` |`1`            |The threading model revolves around the number of partitions in your topic and there are some very specific rules. For More information: [kafka consumer groups](https://cwiki.apache.org/confluence/display/KAFKA/Consumer+Group+Example)|                                                                                                                                                 
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

Sources
=======

* [kafka consumer groups](https://cwiki.apache.org/confluence/display/KAFKA/Consumer+Group+Example).
* [Java book example reference](https://github.com/bkimminich/apache-kafka-book-examples).

License
=======
MIT
