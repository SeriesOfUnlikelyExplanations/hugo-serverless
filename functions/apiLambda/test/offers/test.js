var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");
const AWS = require('aws-sdk');
const DynamoDB = AWS.DynamoDB;

var index = require('../../index');

const reqData = require('./requestTestData.js');
const resData = require('./responseTestData.js');

it("/presigned_upload no tokens", async () => {
  const res = await index.handler(reqData.presigned_upload_noTokens, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(403);
  expect(res.body).to.equal('Forbidden');
});

it("/presigned_upload no filename", async () => {
  const res = await index.handler(reqData.presigned_upload_noFilename, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(400);
  expect(res.body).to.equal('Filename is missing');
});

it("/presigned_upload", async () => {
  class signedUrlMock {
    getSignedUrl(method, params) {
      expect(method).to.equal('putObject')
      expect(params.Bucket).to.equal('offersBucket')
      expect(params.Key).to.include('blag')
      expect(params.ContentType).to.equal('pdf')
      expect(params.Expires).to.equal(300)
      return 'https://www.signedUrl.com';
    }
  }
  sinon.stub(AWS, 'S3').returns(new signedUrlMock());

  const res = await index.handler(reqData.presigned_upload, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.include('https://www.signedUrl.com')
  AWS.S3.restore()
});

it("/get_comparison", async () => {
  class dynamoDBMock {
    query(params) {
      return { promise: async () => {return { Items: resData.offerData}}}
    }
  }
  sinon.stub(DynamoDB, 'DocumentClient').returns(new dynamoDBMock());

  const res = await index.handler(reqData.get_comparison, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal(resData.offerData_final)
  DynamoDB.DocumentClient.restore()
});
