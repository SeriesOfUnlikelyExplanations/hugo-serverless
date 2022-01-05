const AWS = require('aws-sdk')
const DynamoDB = AWS.DynamoDB;
const SSM = AWS.SSM;

// Comments - api
module.exports = (api, opts) => {
  api.use(async (req,res,next) => {
    res.cors()
    var ssm = new SSM({signatureVersion: 'v4', region: 'us-west-2'}});
    const data = await getSSM(ssm, '/hugoServerless')
    const config = {}
    for (const i of data) {
      config[i.Name.replace("/hugoServerless/","")] = i.Value;
    }
    req.config = config;
    req.config.host = ((req.headers.host === 'localhost:3000') ? 'localhost:3000' : 'blog.always-onward.com')
    next() // continue execution
  })

  //Define the open paths
  api.get('/status', async (req,res) => {
    return res.sendStatus(200)
  })
  // define the auth paths
  api.register(require('./routes/auth'), { prefix: '/auth' })
  api.get('/get_comments', async (req,res) => {
    var comments = []
    if ('post' in req.query) {
      const ddb = new DynamoDB.DocumentClient({signatureVersion: 'v4', region: req.config.region})
      comments = await ddb.query({
        KeyConditionExpression: 'postPath = :postPath',
        ExpressionAttributeValues: {
            ':postPath': req.query.post
        },
        TableName: req.config.commentsTable
       }).promise().then((r) => r.Items[0].comments)
       console.log(comments);
     }
    return res.status(200).json(comments)
  })
  //Check for Authorization
  api.use(Authorizer);
  api.get('/authStatus', async (req,res) => {
    return res.sendStatus(200)
  })
  api.post('/post_comment', async (req,res) => {
    console.log(req.body);
    console.log(req.idTokenPayload);
    const ddb = new DynamoDB.DocumentClient({signatureVersion: 'v4', region: req.config.region})
    const comment = {
      author: req.idTokenPayload.name.split(" ")[0],
      userId: req.userId,
      content: req.body.content 
    }
    await ddb.update({
      TableName: req.config.commentsTable,
      Key: { postPath: req.body.postPath },
      ReturnValues: 'ALL_NEW',
      UpdateExpression: 'set #comments = list_append(if_not_exists(#comments, :empty_list), :comment)',
      ExpressionAttributeNames: {
        '#comments': 'comments'
      },
      ExpressionAttributeValues: {
        ':comment': [comment],
        ':empty_list': []
      }
    }).promise()
    return res.sendStatus(200)
  })
  
  //Register admin endpoints
  api.use(adminCheck);
  api.get('/adminStatus', async (req,res) => {
    return res.sendStatus(200)
  })
  api.any('/*', async (req,res) => {
    return res.redirect('/')
  })
}

async function Authorizer(req, res, next) {
  if (!('access_token' in req.cookies)) { return res.sendStatus(403) }
  const {
    verifierFactory,
    errors: { JwtVerificationError, JwksNoMatchingKeyError },
  } = require('@southlane/cognito-jwt-verifier')

  // Put your config values here. calls https://cognito-idp.us-west-2.amazonaws.com/us-west-2_XXX/.well-known/jwks.json
  const verifierCofig = {
    region: 'us-west-2',
    userPoolId: req.config.UserPoolId,
    appClientId: req.config.UserPoolClientId,
  }
  const accessVerifier = verifierFactory(Object.assign(verifierCofig, {tokenType: 'access'}))
  const idVerifier = verifierFactory(Object.assign(verifierCofig, {tokenType: 'id'}))

  try {
    const accessTokenPayload = accessVerifier.verify(req.cookies.access_token);
    const idTokenPayload = idVerifier.verify(req.cookies.id_token);
    req.accessTokenPayload = await accessTokenPayload;
    req.idTokenPayload = await idTokenPayload;
    req.userId = req.idTokenPayload.sub
    req.isAdmin = req.idTokenPayload['custom:isAdmin']
    console.log('User is authorized')
    next()
  } catch (e) {
    console.log(e)
    res.clearCookie('access_token', this.tokenOptions)
    console.log('User is not authorized')
    return res.sendStatus(403)
  }
}

async function adminCheck(req, res, next) {
  if (req.isAdmin == 'True') {
    console.log('user is admin')
    next()
  } else {
    console.log('User is not admin')
    return res.sendStatus(403)
  }
}

function getSSM(ssm, path, memo = [], nextToken) {
  return ssm
    .getParametersByPath({ Path: path, WithDecryption: true, Recursive: true, NextToken: nextToken })
    .promise()
    .then(({ Parameters, NextToken }) => {
      const newMemo = memo.concat(Parameters);
      return NextToken ? getSSM(ssm, path, newMemo, NextToken) : newMemo;
    });
}
