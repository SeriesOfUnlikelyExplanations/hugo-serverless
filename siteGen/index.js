const AWS = require('aws-sdk');
const fs = require('fs-extra');
const util = require('util');
import hugo from "hugo-extended";
import { exec } from "child_process";


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
      '/OnwardBlog/datasyncSourceTask']}).promise();
    if (event.resources[0].includes(ssmData.Parameters.find(p => p.Name ==='/OnwardBlog/datasyncSourceTask').Value)) {
      console.log('Source Datalink task completed. Start Hugo Generation...');
      
      fs.copySync('config.toml', '/tmp/config.toml')
      fs.copySync('themes', '/tmp/themes')
      
      const binPath = await hugo();
      const child = exec(binPath, ['-s', '/tmp', '-c', '/mnt/hugo/content', '-d', '/mnt/hugo/public']);
      
      child.stdout.on('data', function (data) {
          console.log('stdout: ' + data);
      });
      child.stderr.on('data', function (data) {
          console.log('stderr: ' + data);
      });
      child.on('close', function (code) {
          console.log('closing code: ' + code);
      });
      
      const res = await promiseFromChildProcess(child)
      
      console.log(res)
      
      var ssm = new AWS.SSM();
      var ssmData = await ssm.getParameters({Names: ['/OnwardBlog/deploymentLambda']}).promise();
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
 
