const AWS = require('aws-sdk')
const DynamoDB = AWS.DynamoDB;
const SSM = AWS.SSM;
   
const ddb = new DynamoDB.DocumentClient({signatureVersion: 'v4', region: 'us-west-2'})

test()

async function test() {
  const comment = {
    author: 'tom',
    userId: '1234',
    content: 'test'
  }
  const result = await ddb.update({
    TableName: 'HugoApiStack-CommentsTableBBDBF0A8-1DEVFSV1B0O8C',
    Key: { postPath:  'posts/2021/2021-12-5-baker-lake/baker-lake.md'},
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
  console.log(result)
}
