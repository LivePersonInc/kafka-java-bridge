var fs = require("fs");
var java = require("java");
var path = require("path");
var baseDir = path.resolve(__dirname, "../../java/lib");
var dependencies = fs.readdirSync(baseDir);

dependencies.forEach(function (dependency) {
    java.classpath.push(baseDir + "/" + dependency);
});

exports.getJavaInstance = function () {
    return java;
};
