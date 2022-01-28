const AWS = require('aws-sdk')
const DynamoDB = AWS.DynamoDB;
const SSM = AWS.SSM;
const { authRoutes, Authorizer } = require('./routes/auth')
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
  api.get('/get_comments', async (req,res) => {
    var comments = []
    if ('post' in req.query) {
      const ddb = new DynamoDB.DocumentClient({signatureVersion: 'v4', region: req.config.region})
      const response = await ddb.get({
        Key: {
            'postPath': req.query.post
        },
        TableName: req.config.postsTable
      }).promise().then((r) => r.Item)
      console.log(response);
      if (response) {
         comments = response.comments
      }
      console.log(comments);
    }
    return res.status(200).json(comments)
  })
  //Check for Authorization
  api.use(Authorizer);
  api.get('/authStatus', async (req,res) => {
    return res.sendStatus(200)
  });
  api.get('/userInfo', async (req,res) => {
    return res.status(200).json({
      userDetails: req.idTokenPayload,
      googleApiKey: req.config.googleApiKey
    })
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
      TableName: req.config.postsTable,
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
    }).promise();
    return res.sendStatus(200)
  });
  
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
