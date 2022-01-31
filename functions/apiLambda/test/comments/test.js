var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");
const AWS = require('aws-sdk')
const DynamoDB = AWS.DynamoDB;

var index = require('../../index');

const reqData = require('./requestTestData.js');
const resData = require('./responseTestData.js');

class dynamoDBMock {
  update(params) {
    console.log(params);
    expect(params.TableName).to.equal('postsTable');
    expect(params.Key.postPath).to.equal('post_path');
    expect(params.ReturnValues).to.equal('ALL_NEW');
    expect(params.UpdateExpression).to.equal('set #comments = list_append(if_not_exists(#comments, :empty_list), :comment)');
    expect(params.ExpressionAttributeNames['#comments']).to.equal('comments');
    expect(params.ExpressionAttributeValues[':comment'][0].content).to.equal('content');
    expect(params.ExpressionAttributeValues[':comment'][0].userId).to.equal('good_userId');
    expect(params.ExpressionAttributeValues[':comment'][0].author).to.equal('Max');
    expect(params.ExpressionAttributeValues[':empty_list'].length).to.equal(0);
    return { promise: async () => {return { err: [], data: []}}}
  }
  get(params) {
    expect(params.TableName).to.equal('postsTable')
    expect(params.Key).to.have.key('postPath')
    expect(params.Key.postPath).to.equal('post_path')
    return { promise: async () => {return resData.ddb_get}}
  }
}
ddbStub = sinon.stub(DynamoDB, 'DocumentClient').returns(new dynamoDBMock());
it('/get_comments', async () => {
  const res = await index.handler(reqData.get_comments, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal('[{"userId":"userId","author":"author","content":"comment"}]');
});
it('/post_comment', async () => {
  const res = await index.handler(reqData.post_comments, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
});
