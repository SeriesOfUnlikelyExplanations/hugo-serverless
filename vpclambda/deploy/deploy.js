const fs = require("fs");
const AWS = require("aws-sdk");
const path = require("path");
const mime = require('mime');
const yaml = require('js-yaml')
const { execSync } = require('child_process');
const config = require('../lib/config');
AWS.config.update({region:config.region});


//deploy cdk first
console.log('Deploying CDK...')
let stdout = execSync('cdk deploy --require-approval never --outputs-file output.json');
console.log(stdout)
console.log('CDK deployment complete.')

deploy()

async function deploy() {
  // get SSM keys
  var ssm = new AWS.SSM();
  var ssmData = await ssm.getParameters({Names: ['/OnwardBlog/siteName', '/OnwardBlog/distID', '/OnwardBlog/deploymentLambda']}).promise();
  const fileContents = fs.readFileSync('./_config.yml', 'utf8');
  const data = yaml.load(fileContents);
  const public_dir = data.public_dir

  //Now deploy the s3 contents
  console.log('Deploying files to S3...')
  const s3= new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET,
  });
  function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach((name) => {
      var filePath = path.join(currentDirPath, name);
      var stat = fs.statSync(filePath);
      if (stat.isFile()) {
        callback(filePath, stat);
      } else if (stat.isDirectory()) {
        walkSync(filePath, callback);
      }
    });
  }
  const promises = [];
  walkSync(public_dir, async (filePath, stat) => {
    let bucketPath = filePath.substring(public_dir.length+1);
    let params = {
      Bucket: ssmData.Parameters.find(p => p.Name === '/OnwardBlog/siteName').Value,
      Key: bucketPath,
      Body: fs.readFileSync(filePath),
      ContentType: mime.getType(filePath)
    };
    await new Promise(r => setTimeout(r, 5));
    promises.push(s3.putObject(params, function(err, data) {
      if (err) { console.log(err) }
    }).promise());
  });
  await Promise.all(promises)
  console.log('S3 deployment complete.')

  //Kickoff the cloudfront invalidation
  console.log('Starting cloudfront invalidation...')
  var cloudfront = new AWS.CloudFront();
  const r = await cloudfront.createInvalidation({
    DistributionId: ssmData.Parameters.find(p => p.Name === '/OnwardBlog/distID').Value,
    InvalidationBatch: {
      CallerReference: new Date().toISOString(),
      Paths: {
        Quantity: '1',
        Items: [
          '/*'
        ]
      }
    }
  }).promise();
  if (!r.Invalidation) {
    console.log(r)
    throw new Error('Bad response')
  }
  check(cloudfront, ssmData.Parameters.find(p => p.Name === '/OnwardBlog/distID').Value, r.Invalidation.Id)
  console.log('Cloudfront invalidation complete.')
  //deployment complete - call the lambda to check broken links and send email to subscribers
  console.log('Deployment complete. Invoking lambda...')
  var lambda = new AWS.Lambda();
  const results = await lambda.invoke({
    FunctionName: ssmData.Parameters.find(p => p.Name === '/OnwardBlog/deploymentLambda').Value,
    Payload: `{"awsRegion": "${config.region}","sendEmail": "N"}`
  }).promise()
  console.log(results)
}

async function check(cf, distId, id) {
  const r = await cf
    .getInvalidation({ DistributionId: distId, Id: id })
    .promise()
  if (r.Invalidation && r.Invalidation.Status === 'Completed') {
    await new Promise(resolve => setTimeout(resolve, 10000));
    return true
  }
  await new Promise(resolve => setTimeout(resolve, 1000));

  return check(cf, distId, id)
}

