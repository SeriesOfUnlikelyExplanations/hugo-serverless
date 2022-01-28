const AWS = require('aws-sdk')
const DynamoDB = AWS.DynamoDB;

const getComments = (api, opts) => {
  api.get('/get_comments', async (req,res) => {
    var comments = [];
    if ('post' in req.query) {
      const ddb = new DynamoDB.DocumentClient({signatureVersion: 'v4', region: req.config.region})
      const response = await ddb.get({
        Key: {
            'postPath': req.query.post
        },
        TableName: req.config.postsTable
      }).promise()
      console.log(response);
      if ('Item' in response && 'comments' in response.Item) {
         comments = response.Item.comments
      }
      console.log(comments);
    }
    return res.status(200).json(comments)
  })
};

const postComments = (api, opts) => {
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
};

module.exports = { getComments, postComments };
