# Hugo Serverless
Hugo deployment package for static site generation through serverless. This project was based on [Hugo-Lambda](https://github.com/ryansb/hugo-lambda), but it's designed for larger websites (eg greater than 512MB) and it includes some extras, like checking for broken links once deployed and sending an email when a new post is created. The cost of runnin the website should be minimal (<$1-2 per month) and the majority of that cost is route53 domain registration. The project uses CDK to create all the infrastructure. It assumes you already have a couple of things setup - route53/domain certificate for your site and SES (if you want to send and email when a new post is created).

I've deployed it and it works for my purpose, but I haven't tried it with someone new/fresh install yet. If you want to give it a try, I'm happy to support you - open an issue if you run into any problems. 

### How to edit your website:
1. The CDK process creates a s3 bucket called {your site name}-Source. That bucket is where your Hugo website source directory goes. Making changes or uploading any new '.md' files to the S3 bucket will start the website build process. My [blog repo]() is an example of what needs to go in the source S3 bucket
1. The build process starts with a AWS Datasync task to move everything in the source S3 bucket into an [EFS drive](https://aws.amazon.com/efs/). I use EFS because the available lambda memory is too small for a bigger blog (mine is 4.3GB).
1. Once this first datasync job is complete, the build lambda is triggered. This lambda is a bit bigger (default is 5240 MB of memory, but you can change it in the config file). This lambda is strictly used for building the HUGO site and it runs in a VPC with the EFS drive. 
1. Once build is complete, a second Datasync job is kicked off to move the build output into an S3 bucket that hosts the website. The bucket has the same name as your website. CDK has already provisioned a cloudfront link to this S3 bucket and created the necessary route53 rules to make the website go live.
1. After this second Datasync job is complete, a cloudfront invalidation is run to clear out the cache and your website is live. 
1. Once the invalidation is complete, the smaller lambda triggers a broken link checker on the website to make sure all the links/images work. If this fails, and email is sent to you with a list of the broken links. If it succeeds (eg no broken links) then an email is sent to everyone in your dynamo DB distro list that highlights the last 4 blog posts.

### Couple of notes about how it works:
1. 
1. The project extensively uses AWS [SSM parameter store]{https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html} for parameters. You will need to put some of your secrets in there before you start this project.
1. The project uses github actions to run CDK/build the website. Check the build file in the github folder to see how it works. You will need to use github secrets for AWS credentials if you want to go that route.

### Config file
There is a config.toml file in the root of the project that houses all of the configuration stuff. I added some comments in the file on how to use them, but more info is here:
1. region - AWS region you want to deploy to
1. certificateArnSSM - name of the SSM parameter where you store your route53 certificateARN
1. hostedZoneIdSSM - SSM parameter name where you store your route53 hostedZoneID
1. siteName - Name of your site. This is used for a bunch of resource naming in addition to cloudfront/route53.
1. zoneName - Name of your route53 Zone. This is a route53 construct as well.
1. buildMemory - Memory size of the build lambda. Increase this for bigger websites. Max is [10GB](https://aws.amazon.com/about-aws/whats-new/2020/12/aws-lambda-supports-10gb-memory-6-vcpu-cores-lambda-functions/#:~:text=AWS%20Lambda%20customers%20can%20now,previous%20limit%20of%203%2C008%20MB.)
1. createNew -  flag if you want CDK to create a new Source bucket or if you already have one.

1. noReplyEmailSSM - SSM parameter where you store the email address you want to send the distro email from. You need to have SES configured to allow you to send from this email address.
1. myEmailSSM - SSM parameter where you store your email. This is where you will receive the email alert if there are broken links.
1. emailDynamoSSM - SSM parameter with the name of the DynamoDB table where you store the email distro list. The distro list needs to have one item with a key that matches your site name (we only use one item in the table). Sample data is below:

```
{
 "listId": "blog.always-onward.com",
 "emails": [
  {
   "name": "XX",
   "email": "XX@gmail.com"
  },
  {
   "name": "YY",
   "email": "YY@yahoo.com"
  }
 ]
}
```
TODO:
- [ ] Add 404 error page
- [ ] Delete cloudwatch logs on deploy
- [ ] Add comment capability
