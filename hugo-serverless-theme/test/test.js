var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");
const { JSDOM } = require("jsdom");

var functions = require('../static/js/functions.js');


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
