var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");
const fs = require('fs');

var index = require('../index');

const reqData = require('./requestTestData.js');
const resData = require('./responseTestData.js');

function importTest(name, path) {
  describe(name, function () {
    require(path);
  });
}

const SOURCE_DIR = `${__dirname}/site`

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
    console.log(__dirname)
    fs.copyFileSync(`${__dirname}/config.toml`,`${SOURCE_DIR}/config.toml`)
    index.setEfsDir(SOURCE_DIR);
    if (fs.existsSync(`${SOURCE_DIR}/public`)) {
      fs.rmSync(`${SOURCE_DIR}/public`, { recursive: true })
    }
  });
  after(() => {
    fs.copyFileSync(`${__dirname}/config.toml`,`${SOURCE_DIR}/config.toml`)
  });

  describe('DataSync Tasks', () => {
    it('Source Task - missing config', async () => {
      fs.unlinkSync(`${SOURCE_DIR}/config.toml`);
      const res = await index.handler(reqData.source, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(500);
      expect(res.body).to.contain('Error');
      expect(fs.existsSync(`${SOURCE_DIR}/public`)).to.be.false;
      expect(fs.existsSync(`${SOURCE_DIR}/public/sitemap.xml`)).to.be.false;
      fs.copyFileSync(`${__dirname}/config.toml`,`${SOURCE_DIR}/config.toml`)
    });
    it('Source Task', async () => {
      const res = await index.handler(reqData.source, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.equal('Build complete');
      expect(res.action).to.equal('deploy');
      expect(fs.existsSync(`${SOURCE_DIR}/public`)).to.be.true;
      expect(fs.existsSync(`${SOURCE_DIR}/public/sitemap.xml`)).to.be.true;
    });
    it('Website Task', async () => {
      const res = await index.handler(reqData.website, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.equal('Delete complete');
      expect(res.action).to.equal('None');
      expect(fs.readdirSync(`${SOURCE_DIR}`)).to.be.instanceof(Array);
      expect(fs.readdirSync(`${SOURCE_DIR}`)).to.have.length(0);
    });
    it('Theme Task', async () => {
      const res = await index.handler(reqData.theme, {})
        .catch(err => assert(false, 'application failure: '.concat(err)));
      expect(res.statusCode).to.equal(404);
      expect(res.body).to.equal('Datasync task not found');
      expect(res.action).to.equal('None');
    });
  });
});
