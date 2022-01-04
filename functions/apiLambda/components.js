// List of component functions
module.exports = {

  // function to call an API
  httpRequest: function(params, postData) {
    var https = require('https');
    return new Promise(function(resolve, reject) {
      var req = https.request(params, function(res) {
        const response = {};
        response.statusCode = res.statusCode
        body = [];
        res.on('data', function(chunk) {
          body.push(chunk);
        });
        res.on('end', function() {
          response.body = JSON.parse(Buffer.concat(body).toString());
          resolve(response);
        });
      });
      req.on('error', function(err) {
        reject(err);
      });
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }
}
