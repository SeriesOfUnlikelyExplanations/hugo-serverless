const AWS = require('aws-sdk');
const fs = require('fs-extra');


function promiseFromChildProcess(child) {
  return new Promise(function (resolve, reject) {
    child.addListener("error", reject);
    child.addListener("exit", resolve);
  });
}

exports.handler = async (event, context) => {
  console.log(event)
  var result;
  if (event.hasOwnProperty('source') && event.source == 'aws.datasync')  {
    AWS.config.update({region: event.region})
    var ssm = new AWS.SSM();
    var ssmData = await ssm.getParameters({Names: ['/OnwardBlog/datasyncWebsiteTask',
      '/OnwardBlog/datasyncSourceTask',
      '/OnwardBlog/deploymentLambda']}).promise();
    if (event.resources[0].includes(ssmData.Parameters.find(p => p.Name ==='/OnwardBlog/datasyncSourceTask').Value)) {
      console.log('Source Datalink task completed. Start Hugo Generation...');
      
      fs.copySync('config.toml', '/tmp/config.toml')
      fs.copySync('themes', '/tmp/themes')
      
      const deploy = await import('./deploy.mjs')
      const res = deploy.default();
      
      var lambda = new AWS.Lambda();

      console.log(ssmData.Parameters.find(p => p.Name ==='/OnwardBlog/deploymentLambda').Value)
      var params = {
        FunctionName: ssmData.Parameters.find(p => p.Name ==='/OnwardBlog/deploymentLambda').Value, 
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: '{ "message" : "syncPublic" }'
      };

      result = await new Promise((resolve, reject) => {
        lambda.invoke(params, (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
      });
    } else if (event.resources[0].includes(ssmData.Parameters.find(p => p.Name ==='/OnwardBlog/datasyncWebsiteTask').Value)) {
      console.log('Website Datalink task completed. Deleting the EFS drive...');
      result = 'pass';
    } else {
      console.log('Datalink task not supported');
      result = 'pass';
    };
  } else {
    console.log('Event not supported')
    result = 'pass';
  };
  console.log(result);
  return {result: result}
};
 
