var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");
const AWS = require('aws-sdk')
const DynamoDB = AWS.DynamoDB;

var index = require('../../index');

const reqData = require('./requestTestData.js');
const resData = require('./responseTestData.js');

before(() => {
  class dynamoDBMock {
    put(params) {
      expect(params.TableName).to.equal('devicesTable')
      expect(params.Item).to.have.keys(['token','userId','MAC','name','type','typeData'])
      return { promise: async () => {return { Items: resData.putItem}}}
    }
    scan(params) {
      return { promise: async () => {return { Items: resData.scan}}}
    }
    delete(params) {
      expect(params.TableName).to.equal('devicesTable')
      expect(['token1','token2']).to.include(params.Key.token)
      return { promise: async () => {return { Items: resData.offerData}}}
    }
    update(params) {
      expect(params.TableName).to.equal('devicesTable')
      expect(params.Key.token).to.equal('token1')
      expect(params.ReturnValues).to.equal('UPDATED_NEW')
      expect(params.ExpressionAttributeValues).to.have.key(':r')
      console.log(params.ExpressionAttributeValues[':r'])
      return { promise: async () => {return { Attributes: { typeData: { movies:
        params.ExpressionAttributeValues[':r']
      }}}}}
    }
    createSet(params) {
      return params
     }
    get(params) {
      expect(params.TableName).to.equal('devicesTable')
      return { promise: async () => {return { Item: resData.ddbGet}}}
    }
  }
  ddbStub = sinon.stub(DynamoDB, 'DocumentClient').returns(new dynamoDBMock());

  class s3Mock {
    getSignedUrl(method, params) {
      expect(method).to.equal('putObject')
      expect(params.Bucket).to.equal('moviesBucket')
      expect(params.Key).to.equal('movie.mp4')
      expect(params.ContentType).to.equal('mp4')
      expect(params.Expires).to.equal(300)
      return 'https://www.signedUrl.com';
    }
    listObjectsV2(params) {
      expect(params.Bucket).to.equal('moviesBucket')
      return { promise: async () => {return resData.listObjects}}
    }
  }
  s3Stub = sinon.stub(AWS, 'S3').returns(new s3Mock());
})

after(() => {
  ddbStub.restore()
  s3Stub.restore()
})

it("/createDeviceToken missing device name", async () => {
  const res = await index.handler(reqData.createDeviceToken_missingName, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(400);
});

it("/createDeviceToken", async () => {
  const res = await index.handler(reqData.createDeviceToken, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(JSON.parse(res.body)).to.have.keys('token','MAC','name','type','typeData')
});

it("/createDeviceToken with type", async () => {
  const res = await index.handler(reqData.createDeviceToken_withType, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(JSON.parse(res.body)).to.have.keys('token','MAC','name','type','typeData')
});

it("/getTokens", async () => {
  const res = await index.handler(reqData.getTokens, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal('[{"token":"token1","userID":"good_userId","MAC":"","typeData":{},"name":"device1"},{"token":"token2","userID":"good_userId","MAC":"","typeData":{"movies":["movie1.mpg","movie2.mp4"]},"name":"device2"}]')
});

it("/getTokens specific token", async () => {
  const res = await index.handler(reqData.getToken, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal( '{"token":"token1","userID":"good_userId","MAC":"","typeData":{},"name":"device1"}')
});

it("/deleteUnusedTokens no params", async () => {
  const res = await index.handler(reqData.deleteUnusedTokens_all, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal(
    '{"deletedItems":[{"token":"token1","deviceName":"device1"},{"token":"token2","deviceName":"device2"}]}'
  )
});

it("/deleteUnusedTokens not token1", async () => {
  const res = await index.handler(reqData.deleteUnusedTokens_notTokenOne, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal(
    '{"deletedItems":[{"token":"token2","deviceName":"device2"}]}'
  )
});

it("/deleteUnusedTokens not token1", async () => {
  const res = await index.handler(reqData.deleteUnusedTokens_notDeviceOne, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal(
    '{"deletedItems":[{"token":"token2","deviceName":"device2"}]}'
  )
});

it("/movie_upload", async () => {
  const res = await index.handler(reqData.moviesUpload, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.include('https://www.signedUrl.com')
});

it("/get_movies", async () => {
  const res = await index.handler(reqData.getMovies, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal('[{"movie":"movie1.mpg","device1":{"flag":false,"token":"token1"},"device2":{"flag":true,"token":"token2"}},{"movie":"movie2.mp4","device1":{"flag":false,"token":"token1"},"device2":{"flag":true,"token":"token2"}},{"movie":"movie3.mov","device1":{"flag":false,"token":"token1"},"device2":{"flag":false,"token":"token2"}},{"movie":"movie3.wav","device1":{"flag":false,"token":"token1"},"device2":{"flag":false,"token":"token2"}}]');
});

it("/update_movie add & remove movie", async () => {
  var res = await index.handler(reqData.addMovie, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal('["movie1.mpg","movie2.mp4","movie.mp4"]')
  res = await index.handler(reqData.removeMovie, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal('["movie1.mpg","movie.mp4"]')
});

it("/update_movie bad request", async () => {
  const res = await index.handler(reqData.updateMovie_bad, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(400);
  expect(res.body).to.equal('Missing Parameter')
});
