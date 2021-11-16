const AWS = require('aws-sdk');
var Hexo = require('hexo');
const fs = require('fs');
const yaml = require('js-yaml')

exports.handler = async (event, context) => {
  console.log(event)
  var result;
  if (event.hasOwnProperty('source') && event.source == 'aws.datasync')  {
    AWS.config.update({region: event.region})
    var ssm = new AWS.SSM();
    var ssmData = await ssm.getParameters({Names: ['/OnwardBlog/datasyncWebsiteTask',
      '/OnwardBlog/datasyncSourceTask']}).promise();
    if (event.resources[0].includes(ssmData.Parameters.find(p => p.Name ==='/OnwardBlog/datasyncSourceTask').Value)) {
      console.log('Source Datalink task completed. Start Hexo Generation...');
      const fileContents = fs.readFileSync('./_config.yml', 'utf8');
      const data = yaml.load(fileContents);
      console.log(data);
      
      var hexo = new Hexo(process.cwd(), {debug: true});
      await hexo.init()
      await hexo.call('generate', {}).then(console.log)
      
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
      result = 'passed';
    } else {
      console.log('Datalink task not supported');
      result = 'passed';
    };
  } else {
    console.log('Event not supported')
    result = 'passed';
  };
  console.log(result);
  return {result: result}
};
 
