var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");
const verifier = require('@southlane/cognito-jwt-verifier')

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

  //~ importTest("Test the Auth Routes", './auth/test.js');
});
