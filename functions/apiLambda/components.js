// function to call an API
function httpRequest(params, postData = undefined) {
  console.log(params);
  var https = require('https');
  return new Promise(function(resolve, reject) {
    var req = https.request(params, function(res) {
      const response = {};
      if (response.statusCode == 302) {
        var url = new URL(response.headers.location)
        params.path = url.pathname;
        httpRequest();
      }
      response.statusCode = res.statusCode
      body = [];
      res.on('data', function(chunk) {
        body.push(chunk);
      });
      res.on('end', function() {
        try {
          response.body = JSON.parse(Buffer.concat(body).toString());
        } catch {
          console.log(Buffer.concat(body).toString());
          response.body = Buffer.concat(body).toString();
        };
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

// function to get all SSM parameters for path
function getSSM(ssm, path, config = {}, nextToken) {
  return ssm
  .getParametersByPath({ Path: path, Recursive: true, NextToken: nextToken })
  .promise()
  .then(({ Parameters, NextToken }) => {
    for (const i of Parameters) {
      config[i.Name.replace(`${path}/`,"")] = i.Value;
    }
    return NextToken ? getSSM(ssm, path, config, NextToken) : config;
  });
}

module.exports = { httpRequest, getSSM }
