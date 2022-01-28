const AWS = require('aws-sdk')
const SSM = AWS.SSM;
const { authRoutes, Authorizer } = require('./routes/auth')
const { getComments, postComments } = require('./routes/comments')
const { getSSM } = require('./components');

// Comments - api
module.exports = (api, opts) => {
  api.use(async (req,res,next) => {
    res.cors()
    var ssm = new SSM({signatureVersion: 'v4', region: 'us-west-2'});
    req.config = await getSSM(ssm, '/hugoServerless')
    req.config.host = ((req.headers.host === 'localhost:3000') ? 'localhost:3000' : 'blog.always-onward.com')
    next() // continue execution
  })

  //Define the open paths
  api.get('/status', async (req,res) => {
    return res.sendStatus(200)
  })
  // define the auth paths
  api.register(authRoutes, { prefix: '/auth' })
  
  api.register(getComments, { prefix: '' })
  //Check for Authorization
  api.use(Authorizer);
  api.get('/authStatus', async (req,res) => {
    return res.sendStatus(200)
  });
  api.get('/userInfo', async (req,res) => {
    return res.status(200).json({
      userDetails: req.idTokenPayload,
      googleApiKey: req.config.GoogleApiKey
    })
  })
  api.register(postComments, { prefix: '' })
  
  //Register admin endpoints
  api.use(adminCheck);
  api.get('/adminStatus', async (req,res) => {
    return res.sendStatus(200)
  });
  api.any('/*', async (req,res) => {
    return res.redirect('/')
  });
};

async function adminCheck(req, res, next) {
  if (req.isAdmin == 'True') {
    console.log('user is admin')
    next()
  } else {
    console.log('User is not admin')
    return res.sendStatus(403)
  }
}
