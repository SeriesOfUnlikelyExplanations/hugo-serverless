const { EC2, SSM, DataSync, CloudFront, DynamoDB, S3, SES }   = require('aws-sdk');
const { checkBrokenLinks, invalidate, sendEmail } = require('./deploy.js');

exports.handler = async (event, context) => {
  console.log(event);
  var result;
  var REGION ;
  if (event.hasOwnProperty('Records')) {
    REGION  = event.Records[0].awsRegion
  } else {
    REGION  = event.region
  }
  const ssm = new SSM({region:REGION});
  const ssmData = await getSSM(ssm, '/hugoServerless');
  
  if (event.hasOwnProperty('Records') && event.Records[0].eventName == 'ObjectCreated:Put') {
    console.log('Source bucket has been updated.');
    //Start the initial datasync task - move S3Source bucket into EFS
    const datasync = new DataSync({region:REGION});
    console.log('Starting Theme Datasync task...');
    await datasync.startTaskExecution({ TaskArn: ssmData.datasyncThemeTask}).promise();
    console.log('Theme datasync task started.');
    console.log('Starting Source Datasync task...');
    await datasync.startTaskExecution({ TaskArn: ssmData.datasyncSourceTask}).promise();
    console.log('Source datasync task started.');

    // CREATE VPC endpoint here
    const ec2 = new EC2({region:REGION});
    console.log('Creating VPC endpoints...');
    var params = {
      ServiceName: `com.amazonaws.${event.Records[0].awsRegion}.ssm`, /* required */
      VpcId: ssmData.vpcID, /* required */
      PrivateDnsEnabled: true,
      SecurityGroupIds: [ssmData.securityGroupID],
      SubnetIds: [ssmData.subnetID],
      VpcEndpointType: 'Interface'
    };
    await ec2.createVpcEndpoint(params).promise()
    console.log('VPC endpoints created.');
    
  } else if (event.hasOwnProperty('action') && event.action == 'deploy') {
    console.log('Build has been completed - starting Website Datasync task...');
    //Start the initial datasync task - move S3Source bucket into EFS
    const datasync = new DataSync({region:REGION});
    await datasync.startTaskExecution({ TaskArn: ssmData.datasyncWebsiteTask}).promise();
    console.log('Website datasync task started.');
    
  } else if (event.hasOwnProperty('source') && event.source == 'aws.datasync') {
    console.log('Datasync task completed. Checking which task it was...');
    if (event.resources[0].includes(ssmData.datasyncWebsiteTask)) {
      console.log('Website Datasync task was the one completed. Starting cloudfront Invalidation...');
      var cloudfront = new CloudFront({region:REGION});
      await invalidate(cloudfront, ssmData.distID);
      console.log('Invalidation complete.')
      console.log('Starting the broken link checker...')
      const brokenLinks = await checkBrokenLinks('https://' + ssmData.siteName);
      console.log('Broken Link Checker complete.');
      if (ssmData.noReplyEmail) {
        console.log('Sending email...');
        console.log(brokenLinks);
        try {
          const ddb = new DynamoDB({signatureVersion: 'v4', region:REGION})
          email = { 
            fromEmail: ssmData.noReplyEmail,
            toEmail: await ddb.getItem({
              Key: { 'listId': {'S': ssmData.siteName} },
              TableName: ssmData.emailDynamo
            }).promise().then((r) => r.Item.emails.L.map(a => a.M.email.S)),
            adminEmail: ssmData.myEmail
          }
          const ses = new SES({region:REGION})
          //~ result = await sendEmail(brokenLinks,'https://' + ssmData.siteName, email, ses);
          console.log('Email Sent.');
        } catch (e) {
          console.error(e);
        }
      }
      // REMOVE VPC endpoints here
      const ec2 = new EC2({region:REGION});
      console.log('Deleting VPC endpoints...');
      const vpcData = await ec2.describeVpcEndpoints({}).promise();
      await ec2.deleteVpcEndpoints({
        VpcEndpointIds: vpcData.VpcEndpoints.map(({VpcEndpointId}) => VpcEndpointId)
      }).promise();
      console.log('VPC endpoints deleted. All done.');
    } else if (event.resources[0].includes(ssmData.datasyncSourceTask)){
      console.log('Source Datasync task completed. Emptying the website bucket so it is ready for deployment...');
      var s3 = new S3({region:REGION});
      const { Contents } = await s3.listObjects({ Bucket: ssmData.siteName }).promise();
      if (Contents.length > 0) {
        await s3
          .deleteObjects({
            Bucket: ssmData.siteName,
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

function getSSM(ssm, path, config = {}, nextToken) {
  return ssm
    .getParametersByPath({ Path: path, Recursive: true, NextToken: nextToken })
    .promise()
    .then(({ Parameters, NextToken }) => {
      for (const i of Parameters) {
        config[i.Name.replace(path+"/","")] = i.Value;
      }
      return NextToken ? getSSM(ssm, path, config, NextToken) : config;
    });
}
