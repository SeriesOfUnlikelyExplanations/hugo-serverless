var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");
const { promises: { copyFile } } = require('fs');

var index = require('../index');

const reqData = require('./requestTestData.js');
const resData = require('./responseTestData.js');

function importTest(name, path) {
  describe(name, function () {
    require(path);
  });
}

// https://sinonjs.org/how-to/stub-dependency/
describe('Testing Generator lambda', function() {
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
    copyFile('./config.toml','./site/config.toml').then(console.log)
    index.LOCAL_SOURCE_DIR = '/test/site'
    index.LOCAL_BUILD_DIR = '/test/site/public'
  });

  describe('DataSync Tasks', () => {
    it('Source Task', async () => {
      
      const res = await index.handler(reqData.source, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.equal('OK');
    });
    it('Website Task', async () => {
      const res = await index.handler(reqData.website, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(302);
      expect(res.multiValueHeaders.location).to.include('https://github.com/SeriesOfUnlikelyExplanations/always-onward/issues')
    });
    it('Theme Task', async () => {
      const res = await index.handler(reqData.theme, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(302);
      expect(res.multiValueHeaders.location).to.include('https://github.com/SeriesOfUnlikelyExplanations/always-onward/issues')
    });
  });

  //~ importTest("Test the Auth Routes", './auth/test.js');

});
