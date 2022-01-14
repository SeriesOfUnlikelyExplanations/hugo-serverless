var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");
const { copyFileSync, existsSync, unlinkSync, rmdirSync, readdirSync } = require('fs');

var index = require('../index');

const reqData = require('./requestTestData.js');
const resData = require('./responseTestData.js');

function importTest(name, path) {
  describe(name, function () {
    require(path);
  });
}

const SOURCE_DIR = 'test/site'

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
    copyFileSync('./test/config.toml',`./${SOURCE_DIR}/config.toml`)
    index.setEfsDir(SOURCE_DIR);
    if (existsSync(`${SOURCE_DIR}/public`)) {
      rmdirSync(`${SOURCE_DIR}/public`, { recursive: true })
    }
  });

  describe('DataSync Tasks', () => {
    it('Source Task - missing config', async () => {
      unlinkSync(`./${SOURCE_DIR}/config.toml`);
      const res = await index.handler(reqData.source, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(500);
      expect(res.body).to.contain('Error');
      expect(existsSync(`${SOURCE_DIR}/public`)).to.be.false;
      expect(existsSync(`${SOURCE_DIR}/public/sitemap.xml`)).to.be.false;
      copyFileSync('./test/config.toml',`./${SOURCE_DIR}/config.toml`)
    });
    it('Source Task', async () => {
      const res = await index.handler(reqData.source, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.equal('Build complete');
      expect(res.action).to.equal('deploy');
      expect(existsSync(`${SOURCE_DIR}/public`)).to.be.true;
      expect(existsSync(`${SOURCE_DIR}/public/sitemap.xml`)).to.be.true;
    });
    it('Website Task', async () => {
      const res = await index.handler(reqData.website, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.equal('Delete complete');
      expect(res.action).to.equal('None');
      expect(readdirSync(`${SOURCE_DIR}`)).to.be.instanceof(Array);
      expect(readdirSync(`${SOURCE_DIR}`)).to.have.length(0);
    });
    it('Theme Task', async () => {
      const res = await index.handler(reqData.theme, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(404);
      expect(res.body).to.equal('Datasync task not found');
      expect(res.action).to.equal('None');
    });
  });

  //~ importTest("Test the Auth Routes", './auth/test.js');

});
