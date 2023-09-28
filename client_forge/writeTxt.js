function writeTxt(str) {
    var fs = require('fs');
 
    fs.appendFile('test.txt', str + '\n', function (err) {
        if (err)
            console.log(err);
    });
}
module.exports = writeTxt;