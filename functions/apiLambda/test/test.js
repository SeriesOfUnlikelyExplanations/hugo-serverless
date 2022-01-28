var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");
const verifier = require('@southlane/cognito-jwt-verifier')
const AWS = require('aws-sdk')
const DynamoDB = AWS.DynamoDB;

var index = require('../index');

const reqData = require('./requestTestData.js');
const resData = require('./responseTestData.js');

function importTest(name, path) {
  describe(name, function () {
    require(path);
  });
}

// https://sinonjs.org/how-to/stub-dependency/
describe('Testing routing lambda', function() {
  this.timeout(4000);
  before(() => {
    nock('https://ssm.us-west-2.amazonaws.com')
      .persist()
      .post('/')
      .reply(200, resData.ssm);

    nock.emitter.on("no match", (req) => {
      console.log(req)
      assert(false, 'application failure: no match')
    })
    sinon.stub(verifier, 'verifierFactory')
      .returns({verify: async (token) => {
        if (['access_token','id_token'].some(i => i == token)) {
          return resData.verifier
        } else if (['access_token_noAdmin','id_token_noAdmin'].some(i => i == token)) {
          return resData.verifier_noAdmin
        } else {
          throw 'error'
        }
      }})
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
  });

  describe('test root apis', () => {
    it('/status', async () => {
      const res = await index.handler(reqData.status, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.equal('OK');
    });
    it('/blah missing route', async () => {
      const res = await index.handler(reqData.noroute, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(302);
      expect(res.multiValueHeaders.location).to.include('/')
    });
  });

  describe('test authenticated  routes', () => {
    it('/authStatus', async () => {
      const res = await index.handler(reqData.privateStatus, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.equal('OK');
    });
    it('/authStatus Bad Token', async () => {
      const res = await index.handler(reqData.privateStatus_badToken, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(403);
      expect(res.body).to.equal('Forbidden');
    });
    it('/userInfo ', async () => {
      const res = await index.handler(reqData.userInfo, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.equal('{"userDetails":{"at_hash":"BSEId5nF27zMrN9BLX-T_A","sub":"good_userId","aud":"5ra91i9p4trq42m2vnjs0pv06q","event_id":"b6d7a62d-54da-49e6-a839-66506f0c21b5","token_use":"id","auth_time":1587311838,"iss":"https://cognito-idp.us-east-1.amazonaws.com/us-east-1_PDsy6i0Bf","name":"Max Ivanov","cognito:username":"24e26910-e7b9-4aad-a994-387942f164e7","exp":1587315438,"iat":1587311838,"email":"max@southlane.com","custom:isAdmin":"True"},"googleApiKey":"testGoogleKey"}');
    });
    it('/adminStatus failed', async () => {
      const res = await index.handler(reqData.noAdminStatus, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(403);
      expect(res.body).to.equal('Forbidden');
    });
    it('/adminStatus succeeded', async () => {
      const res = await index.handler(reqData.AdminStatus, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.equal('OK');
    });
  });
  describe('test comments', () => {
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
  });
  
  importTest("Test the Auth Routes", './auth/test.js');
});
