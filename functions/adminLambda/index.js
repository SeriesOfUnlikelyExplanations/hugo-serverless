const AWS = require('aws-sdk');
const { checkBrokenLinks, invalidate, sendEmail } = require('./deploy.js');
const blc = require("broken-link-checker");

exports.handler = async (event, context) => {
  console.log(event);
  const result = {};
  var REGION;
  if (event.hasOwnProperty('Records')) {
    REGION  = event.Records[0].awsRegion
  } else {
    REGION  = event.region
  }
  const ssm = new AWS.SSM({region:REGION});
  const ssmData = await getSSM(ssm, '/hugoServerless');
  
  if (event.hasOwnProperty('Records') && event.Records[0].eventName == 'ObjectCreated:Put') {
    console.log('Source bucket has been updated.');
    //Start the initial datasync task - move S3Source bucket into EFS
    const datasync = new AWS.DataSync({region:REGION});
    console.log('Starting Theme Datasync task...');
    result.themeDatasync = await datasync.startTaskExecution({ TaskArn: ssmData.datasyncThemeTask}).promise();
    console.log('Theme datasync task started.');
    console.log('Starting Source Datasync task...');
    result.sourceDatasync = await datasync.startTaskExecution({ TaskArn: ssmData.datasyncSourceTask}).promise();
    console.log('Source datasync task started.');

    // CREATE VPC endpoint here
    const ec2 = new AWS.EC2({region:REGION});
    console.log('Creating VPC endpoints...');
    var params = {
      ServiceName: `com.amazonaws.${event.Records[0].awsRegion}.ssm`, /* required */
      VpcId: ssmData.vpcID, /* required */
      PrivateDnsEnabled: true,
      SecurityGroupIds: [ssmData.securityGroupID],
      SubnetIds: [ssmData.subnetID],
      VpcEndpointType: 'Interface'
    };
    result.vpcEndpoint = await ec2.createVpcEndpoint(params).promise()
    console.log('VPC endpoints created.');
    result.statusCode = 200
    
  } else if (event.hasOwnProperty('action') && event.action == 'deploy') {
    console.log('Build has been completed - starting Website Datasync task...');
    //Start the initial datasync task - move S3Source bucket into EFS
    const datasync = new AWS.DataSync({region:REGION});
    result.websiteDatasync = await datasync.startTaskExecution({ TaskArn: ssmData.datasyncWebsiteTask}).promise();
    console.log('Website datasync task started.');
    result.statusCode = 200
    
  } else if (event.hasOwnProperty('source') && event.source == 'aws.datasync') {
    console.log('Datasync task completed. Checking which task it was...');
    if (event.resources[0].includes(ssmData.datasyncWebsiteTask)) {
      console.log('Website Datasync task was the one completed. Starting cloudfront Invalidation...');
      var cloudfront = new AWS.CloudFront({region:REGION});
      result.invalidate = await invalidate(cloudfront, ssmData.distID);
      console.log('Invalidation complete.')
      console.log('Starting the broken link checker...')
      const brokenLinks = await checkBrokenLinks(blc.SiteChecker, 'https://' + ssmData.siteName);
      console.log(brokenLinks);
      result.brokenLinks = brokenLinks;
      console.log('Broken Link Checker complete.');
      if (ssmData.noReplyEmail) {
        console.log('Sending email...');
        try {
          const ddb = new AWS.DynamoDB({signatureVersion: 'v4', region:REGION})
          const params = { 
            site: 'https://' + ssmData.siteName,
            fromEmail: ssmData.noReplyEmail,
            brokenLinks: brokenLinks
          }
          const ses = new AWS.SES({region:REGION})
          if (brokenLinks.length === 0) {
            params.toEmail = await ddb.getItem({
              Key: { 'postPath': {'S': ssmData.siteName} },
              TableName: ssmData.postsTable
            }).promise().then((r) => r.Item.emails.L.map(a => a.M.email.S))
            params.posts = await ddb.scan({
              TableName: ssmData.postsTable, /* required */
              AttributesToGet: ['postPath'],
            }).promise().then((r) => r.Items.map(a => a.postPath.S))
            
            params.toEmail = [ ssmData.myEmail ] // remove this to re-enable emails to everyone
            
          } else {
            params.toEmail = [ ssmData.myEmail ]
            params.brokenLinksFlag = true;
          }
          const {response, newPosts} = await sendEmail(params, ses);
          result.email = response;
          console.log(newPosts);
          if (newPosts.length > 0) {
            const items = newPosts.map(post => { 
              return {
                PutRequest: { 
                  Item: { 
                    postPath: { S: post } 
                  }
                }
              }
            });
            console.log(items);
            result.newPosts = await ddb.batchWriteItem({ RequestItems: { [ssmData.postsTable]: items.slice(0, 25)}}).promise()
          }
          console.log('Email Sent.');
        } catch (e) {
          console.error(e);
          throw(e);
        }
      }
      // REMOVE VPC endpoints here
      const ec2 = new AWS.EC2({region:REGION});
      console.log('Deleting VPC endpoints...');
      const vpcData = await ec2.describeVpcEndpoints({}).promise();
      result.deletedvpcs = await ec2.deleteVpcEndpoints({
        VpcEndpointIds: vpcData.VpcEndpoints.map(({VpcEndpointId}) => VpcEndpointId)
      }).promise();
      console.log('VPC endpoints deleted. All done.');
      result.statusCode = 200
      
    } else if (event.resources[0].includes(ssmData.datasyncSourceTask)){
      console.log('Source Datasync task completed. Emptying the website bucket so it is ready for deployment...');
      var s3 = new AWS.S3({region:REGION});
      const { Contents } = await s3.ListObjectsV2({ Bucket: ssmData.siteName }).promise();
      if (Contents.length > 0) {
        result.deleted = await s3
          .deleteObjects({
            Bucket: ssmData.siteName,
            Delete: {
              Objects: Contents.map(({ Key }) => ({ Key }))
            }
          }).promise();
      }
      console.log('Website Bucket has been emptied.');
      result.statusCode = 200
      
    } else {
      console.log('Datalink task not supported');
      result.body = 'Datalink task not supported'
      result.statusCode = 404
    };
  } else {
    console.log('Event not supported');
    result.body = 'Event not supported'
    result.statusCode = 404
  };
  return result
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
