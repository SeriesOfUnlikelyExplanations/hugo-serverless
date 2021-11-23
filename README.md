# Hugo Serverless
Hugo deployment package for static site generation through serverless. This project was based on [Hugo-Lambda](https://github.com/ryansb/hugo-lambda), but it's designed for larger websites (eg greater than 512MB) and it includes some extras, like checking for broken links once deployed and sending an email when a new post is created. The cost of runnin the website should be minimal (<$1-2 per month) and the majority of that cost is route53 domain registration. The project uses CDK to create all the infrastructure. It assumes you already have a couple of things setup - route53/domain certificate for your site and SES (if you want to send and email when a new post is created).

I've deployed it and it works for my purpose, but I haven't tried it with someone new/fresh install yet. If you want to give it a try, I'm happy to support you - open an issue if you run into any problems. 

### How to edit your website:
1. The CDK process creates a s3 bucket called {your site name}-Source. That bucket is where your Hugo website source directory goes. Making changes or uploading any new '.md' files to the S3 bucket will start the website build process.
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
There is a config.toml file in the root of the project that houses all of the configuration stuff. I added some comments in the file on how to use it, but more info is here:
1. 


TODO:
Move email & deploy variables to toml file
Add 404 error page
Delete cloudwatch on deploy
Add comment capability
