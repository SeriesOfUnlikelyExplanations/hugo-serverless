# hugo-serverless
Hugo deployment package for static site generation through serverless. This project was based on [Hugo-Lambda](https://github.com/ryansb/hugo-lambda), but it's designed for larger websites (eg greater than 512MB) and it includes some extras, like checking for broken links once deployed and sending an email when a new post is created.

How it works:
1. The project uses CDK to create all the infrastructure. It assumes you already have a couple of things setup - route53/domain certificate for your site and SES (if you want to send and email when a new post is created). 
1. There is a config.toml file in the root of the project that houses all of the configuration stuff. It's fairly self explanitory, but  


I've deployed it and it works for my purpose, but I haven't tried it with someone new/fresh install yet. If you want to give it a try, I'm happy to support you - open an issue if you run into any problems. 


TODO:
Send email on deploy complete

Move email & deploy variables to toml file
delete website bucket before starting website datasync task
Add 404 error page
Delete cloudwatch on deploy
