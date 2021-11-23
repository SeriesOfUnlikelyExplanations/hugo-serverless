const AWS = require('aws-sdk');
const { checkBrokenLinks, invalidate, sendEmail } = require('./deploy.js');

exports.handler = async (event, context) => {
  console.log(event);
  var result;
  if (event.hasOwnProperty('Records') && event.Records[0].eventName == 'ObjectCreated:Put') {
    console.log('Source bucket has been updated - starting Source Datasync task...');
    console.log(event.Records[0].s3);
    AWS.config.update({region: event.Records[0].awsRegion})
    var ssm = new AWS.SSM();
    var ssmData = await ssm.getParameters({Names: ['/hugoServerless/datasyncSourceTask']}).promise();
    //Start the initial datasync task - move S3Source bucket into EFS
    const datasync = new AWS.DataSync();
    await new Promise(resolve => setTimeout(resolve, 30000))
    
    result = await new Promise(function(resolve, reject) {
      datasync.startTaskExecution({ TaskArn: ssmData.Parameters.find(p => p.Name ==='/hugoServerless/datasyncSourceTask').Value}, function(err, data) {
        if (err !== null) reject(err);
        else resolve(data);
      });
    });
    console.log('Source datasync task started.');
  } else if (event.hasOwnProperty('action') && event.action == 'deploy') {
    console.log('Build has been compled - starting Website Datasync task...');
    AWS.config.update({region: event.region})
    var ssm = new AWS.SSM();
    var ssmData = await ssm.getParameters({Names: ['/hugoServerless/datasyncWebsiteTask']}).promise();
    //Start the initial datasync task - move S3Source bucket into EFS
    const datasync = new AWS.DataSync();
    
    result = await new Promise(function(resolve, reject) {
      datasync.startTaskExecution({ TaskArn: ssmData.Parameters.find(p => p.Name ==='/hugoServerless/datasyncWebsiteTask').Value}, function(err, data) {
        if (err !== null) reject(err);
        else resolve(data);
      });
    });
    console.log('Website datasync task started.');
  } else if (event.hasOwnProperty('source') && event.source == 'aws.datasync') {
    console.log('Datasync task completed. Checking which task it was...');
    AWS.config.update({region: event.region})
    var ssm = new AWS.SSM();
    var ssmData = await ssm.getParameters({Names: [
      '/hugoServerless/siteName',
      '/hugoServerless/datasyncWebsiteTask',
      '/hugoServerless/datasyncSourceTask',
      '/hugoServerless/distID',
      '/hugoServerless/noReplyEmail',
      '/hugoServerless/emailsTable',
      '/hugoServerless/myEmail'
    ]}).promise();
    if (event.resources[0].includes(ssmData.Parameters.find(p => p.Name ==='/hugoServerless/datasyncWebsiteTask').Value)) {
      console.log('Website Datasync task was the one completed. Starting cloudfront Invalidation...');
      var cloudfront = new AWS.CloudFront();
      await invalidate(cloudfront, ssmData.Parameters.find(p => p.Name === '/hugoServerless/distID').Value);

      console.log('Invalidation complete. Starting the broken link checker...')
      const brokenLinks = await checkBrokenLinks('https://' + ssmData.Parameters.find(p => p.Name === '/hugoServerless/siteName').Value);
      if (ssmData.Parameters.find(p => p.Name === '/hugoServerless/noReplyEmail').Value) {
        console.log('Broken Link Checker complete. Sending email...');
        console.log(brokenLinks);
        const ddb = new AWS.DynamoDB({signatureVersion: 'v4', region: event.awsRegion})
        email = { 
          fromEmail: ssmData.Parameters.find(p => p.Name === '/hugoServerless/noReplyEmail').Value,
          toEmail: await ddb.getItem({
            Key: { 'listId': {'S': ssmData.Parameters.find(p => p.Name === '/hugoServerless/siteName').Value } },
            TableName: ssmData.Parameters.find(p => p.Name === '/hugoServerless/emailsTable').Value
          }).promise().then((r) => r.Item.emails.L.map(a => a.M.email.S)),
          adminEmail: ssmData.Parameters.find(p => p.Name === '/hugoServerless/myEmail').Value
        }
        const ses = new AWS.SES()
        result = await sendEmail(brokenLinks,'https://' + ssmData.Parameters.find(p => p.Name === '/hugoServerless/siteName').Value, email, ses);
        console.log(result);
        console.log('Email Sent. All done.');
      } else {
        console.log('Invalidation complete. All done.')
      }
    } else if (event.resources[0].includes(ssmData.Parameters.find(p => p.Name ==='/hugoServerless/datasyncSourceTask').Value)){
      console.log('Source Datasync task completed. Emptying the website bucket so it is ready for deployment...');
      Bucket = ssmData.Parameters.find(p => p.Name === '/hugoServerless/siteName').Value;
      var s3 = new AWS.S3();
      const { Contents } = await s3.listObjects({ Bucket }).promise();
      if (Contents.length > 0) {
        await s3
          .deleteObjects({
            Bucket,
            Delete: {
              Objects: Contents.map(({ Key }) => ({ Key }))
            }
          })
          .promise();
      }
      console.log('Website Bucket has been emptied.');
    } else {
      console.log('Datalink task not supported');
      result = 'Fail';
    };
  } else {
    console.log('Event not supported');
    result = 'Fail';
  };
  return {status: 'ok', result: result}
};
