var fs = require("fs");
var java = require("java");
var path = require("path");
var appRoot = require('app-root-path');


var baseDir = path.resolve(__dirname, '../../java/lib');
var externalDependenciesDir = appRoot + '/kafka-java-bridge/java/lib';
var resourcesDir = path.resolve(__dirname, '../../java/resources');
var externalLog4jPropsFilePath = appRoot + '/kafka-java-bridge/log4j/log4j.properties';
var internalLog4jPropsFilePath = resourcesDir + '/log4j.properties';
var log4jPropsFilePath = internalLog4jPropsFilePath;

if(fs.existsSync(externalLog4jPropsFilePath)){
    log4jPropsFilePath = externalLog4jPropsFilePath;
}

java.options.push('-Dlog4j.configuration=file:' + log4jPropsFilePath);

addDependencies(baseDir);
addDependencies(externalDependenciesDir);

function addDependencies(dir){
    if(!fs.existsSync(dir)){
        return;
    }
    var dependencies = fs.readdirSync(dir);


    dependencies.forEach(function (dependency) {
        java.classpath.push(baseDir + "/" + dependency);
    });
}

exports.getJavaInstance = function () {
    return java;
};
