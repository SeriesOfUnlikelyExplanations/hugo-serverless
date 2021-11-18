const AWS = require('aws-sdk');

exports.handler = async (event, context) => {
  console.log(event);
  var result;
  if (event.hasOwnProperty('Records') && event.Records[0].eventName == 'ObjectCreated:Put') {
    console.log('Source bucket has been updated - starting Datasync task...');
    AWS.config.update({region: event.Records[0].awsRegion})
    var ssm = new AWS.SSM();
    var ssmData = await ssm.getParameters({Names: ['/OnwardBlog/datasyncSourceTask']}).promise();
    //Start the initial datasync task - move S3Source bucket into EFS
    const datasync = new AWS.DataSync();
    await new Promise(resolve => setTimeout(resolve, 30000))
    
    result = await new Promise(function(resolve, reject) {
      datasync.startTaskExecution({ TaskArn: ssmData.Parameters.find(p => p.Name ==='/OnwardBlog/datasyncSourceTask').Value}, function(err, data) {
        if (err !== null) reject(err);
        else resolve(data);
      });
    });
    console.log('Datasync task started.');
  } else if (event.hasOwnProperty('source') && event.source == 'aws.datasync') {
    console.log('Datasync task completed. Checking which task it was...');
    AWS.config.update({region: event.region})
    var ssm = new AWS.SSM();
    var ssmData = await ssm.getParameters({Names: [
      '/OnwardBlog/siteName',
      '/OnwardBlog/datasyncWebsiteTask'
      ]}).promise();
    if (event.resources[0].includes(ssmData.Parameters.find(p => p.Name ==='/OnwardBlog/datasyncWebsiteTask').Value)) {
      console.log('Website Datasync task was the one completed. Starting the broken link checker...')
      //complete the deployment tasks after launching the 
      const result = await checkBrokenLinks('https://' + ssmData.Parameters.find(p => p.Name === '/OnwardBlog/siteName').Value);
    } else {
      console.log('Datalink task not supported');
      result = 'pass';
    };
  };
  return {status: 'ok', result: result}
};
 
