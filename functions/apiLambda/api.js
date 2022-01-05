var { SSM } = require("aws-sdk");

// Comments - api
module.exports = (api, opts) => {
  api.use(async (req,res,next) => {
    res.cors()
    var ssm = new SSM({signatureVersion: 'v4', region: 'us-west-2'});
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
    const comments = [
      {
        author:"Katie",
        content:"Thank you!!"
      },
      {
        author:"Tom",
        content:"Thank you!!"
      }
    ]
    
    return res.status(200).json(comments)
  })
  //Check for Authorization
  api.use(Authorizer);
  api.get('/authStatus', async (req,res) => {
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
