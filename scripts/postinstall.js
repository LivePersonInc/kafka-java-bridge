var path = require('path');
var fs = require('fs');
var execSync = require('child_process').execSync;

var javaDir = path.join(__dirname, '../java');
if(!fs.existsSync(javaDir + "/out")){
    fs.mkdirSync(javaDir + "/out");
}

execSync("javac -cp " + javaDir + "/lib/\\* -d " + javaDir +"/out " + javaDir + "/src/com/liveperson/kafka/consumer/*.java", {stdio:[0,1,2]});
execSync("javac -cp " + javaDir + "/lib/\\* -d " + javaDir +"/out " + javaDir + "/src/com/liveperson/kafka/producer/*.java", {stdio:[0,1,2]});
execSync("jar cvf " + javaDir + "/lib/bridge.jar -C " + javaDir + "/out/ .", {stdio:[0,1,2]});
