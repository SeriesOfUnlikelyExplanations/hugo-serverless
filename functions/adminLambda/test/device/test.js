var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");

const AWS = require('aws-sdk');
const DynamoDB = AWS.DynamoDB;
const SSH = require('node-ssh')

var index = require('../../index');

const reqData = require('./requestTestData.js');
const resData = require('./responseTestData.js');

before(() => {
  class dynamoDBMock {
    get(params) {
      if (params.Key.token == 'test') {
        return { promise: async () => {return { Item: resData.getData}}}
      } else if (params.Key.token == 'bad_test') {
        return { promise: async () => {return { Item: resData.getData_bad}}}
      } else if (params.Key.token == 'missingMovie_test') {
        return { promise: async () => {return { Item: resData.getData_missingMovie}}}
      } else {
        return { promise: async () => {return {}}}
      }
    }
    update(params) {
      expect(params.TableName).to.equal('devicesTable')
      expect(['missingMovie_test', 'token1']).to.include(params.Key.token)
      expect(params.ReturnValues).to.equal('UPDATED_NEW')
      expect(params.ExpressionAttributeValues).to.have.key(':r')
      return { promise: async () => {return { Attributes: { typeData: { movies:
        params.ExpressionAttributeValues[':r']
      }}}}}
    }
  }
  ddbStub = sinon.stub(DynamoDB, 'DocumentClient').returns(new dynamoDBMock());

  class s3Mock {
    getSignedUrl(method, params) {
      expect(method).to.equal('getObject')
      if (params.Bucket == 'deviceSoftwareBucket') {
        expect(params.Bucket).to.equal('deviceSoftwareBucket')
        expect(params.Key).to.equal('test_device.tar.gz')
      } else {
        expect(params.Bucket).to.equal('moviesBucket')
        expect(['movie3.mp4','movie1.mp4']).to.include(params.Key)
      }
      expect(params.Expires).to.equal(300)
      return 'https://www.signedUrl.com';
    }
    headObject(params) {
      if (params.Key == "missing_movie.mp4") {
        return { promise: () => new Promise((resolve, reject)=> reject({code:'NotFound'})) }
      } else {
        return { promise: async () => { return {
          "AcceptRanges": "bytes",
          "ContentType": "text/html",
          "LastModified": "Thu, 16 Apr 2015 18:19:14 GMT",
          "ContentLength": 77,
          "VersionId": "null",
          "ETag": "30a6ec7e1a9ad79c203d05a589c8b400",
          "Metadata": {}
        }}}
      }
    }
  }
  s3stub = sinon.stub(AWS, 'S3').returns(new s3Mock());

  class routeMock {
    changeResourceRecordSets(params) {
      expect(params.ChangeBatch.Changes).to.deep.equal([{
        Action: 'UPSERT',
        ResourceRecordSet: {
          Name: 'test_device.always-onward.com',
          ResourceRecords: [{ Value: 'good_ip' }],
          TTL: 60,
          Type: 'A'
        }
      }])
      return { promise: async () => {return {"ChangeInfo":{"Id":"id","Status":"PENDING","Comment":"Routing"}}}}
    }
  }
  routeStub = sinon.stub(AWS, 'Route53').returns(new routeMock());

  class sshMock {
    connect(params) {
      console.log(params)
      if (params.host == 'good_ip') {
        return new Promise((resolve, reject)=> reject('Error: All configured authentication methods failed'))
      } else if (params.host == 'bad_ip') {
        return new Promise((resolve, reject)=> reject('something else'))
      } else {
        throw new Error('Bad IP address')
      }
    }
  }
  sshStub = sinon.stub(SSH, 'NodeSSH').returns(new sshMock());
})

after(() => {
  ddbStub.restore()
  s3stub.restore()
  routeStub.restore()
  sshStub.restore()
})

it("/device/update auth failed", async () => {
  const res = await index.handler(reqData.update_fail_auth, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(403);
  expect(res.body).to.equal('Forbidden');
});

it("/device/update", async () => {
  const res = await index.handler(reqData.update, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(302);
  expect(res.headers.location).to.include('https://www.signedUrl.com')
});

it("/device/update No update needed", async () => {
  const res = await index.handler(reqData.update_alreadyCurrent, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(204);
});

it("/device/updateip", async () => {
  const res = await index.handler(reqData.updateip, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal('{"Id":"id","Status":"PENDING","Comment":"Routing"}')
});

it("/device/updateip bad IP address", async () => {
  const res = await index.handler(reqData.updateip_bad, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(400);
  expect(res.body).to.equal('{"status":"SSH failure"}')
});

it("/device/getmovie", async () => {
  const res = await index.handler(reqData.getmovie, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal('{"status":"movieToDownload","name":"movie3.mp4","url":"https://www.signedUrl.com"}')
});

it("/device/getmovie without body", async () => {
  const res = await index.handler(reqData.getmovie_noBody, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(400);
  expect(res.body).to.equal('Missing Parameter')
});

it("/device/getmovie delete movie", async () => {
  const res = await index.handler(reqData.getmovie_delete, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal('{"status":"movieToDelete","name":"movie4.mp4"}')
});

it("/device/getmovie no action", async () => {
  const res = await index.handler(reqData.getmovie_noAction, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(204);
});

it("/device/getmovie missing movie", async () => {
  const res = await index.handler(reqData.getmovie_missing, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(204);
  expect(res.body).to.equal('["movie1.mp4","movie2.m4v","movie3.mp4"]')
});

