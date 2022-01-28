var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
var index = require('../../index');

const reqData = require('./requestTestData.js');
const resData = require('./responseTestData.js');

const URI = 'https://blog.always-onward.com'

// Setup the mock for cognito token endpoint
// https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html
var authdomainNock = nock('https://authdomain', {
    reqheaders: {
      'Authorization': headerValue => {
        expect(headerValue).to.equal('Basic '+ Buffer.from('UserPoolClientId'+':'+'UserPoolClientSecret').toString('base64'))
        return true
      },
      'Content-Type': 'application/x-www-form-urlencoded'
    },
  })

  authdomainNock.persist().post('/oauth2/token', (body) => {
    if (body.grant_type != 'refresh_token' || body.refresh_token != 'refresh_token') { return false }
    expect(body.client_id).to.equal('UserPoolClientId');
    return true
  })
  .reply(200, resData.token);

it("/logout", async () => {
  const res = await index.handler(reqData.logout, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(302);
  expect(res.multiValueHeaders.location).to.include('https://AuthDomain/logout?client_id=UserPoolClientId&logout_uri='+URI)
  expect(res.multiValueHeaders['set-cookie'].join()).to.include('id_token')
  expect(res.multiValueHeaders['set-cookie'].join()).to.include('refresh_token')
  expect(res.multiValueHeaders['set-cookie'].join()).to.include('access_token')
  expect(res.multiValueHeaders['set-cookie'].every(x => x.includes('Expires=Thu, 01 Jan 1970 00:00:00 GMT'))).to.be.true;
});

it("/refresh No Refresh Token", async () => {
  const res = await index.handler(reqData.refresh_noRefreshToken, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal(`{"login":false,"redirect_url":"https://AuthDomain/login?client_id=UserPoolClientId&response_type=code&scope=email+openid+phone+profile&redirect_uri=${URI}/api/auth/callback"}`)
});

it("/refresh with Access Token", async () => {
  const res = await index.handler(reqData.refresh_withAccessToken, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal('{"login":true,"redirect_url":"/api/auth/logout"}')
});

it("/refresh with Refresh Token, No Access Token", async () => {
  const res = await index.handler(reqData.refresh_withRefreshTokennoAccessToken, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.multiValueHeaders['set-cookie'].join()).to.include('id_token')
  expect(res.multiValueHeaders['set-cookie'].join()).to.include('access_token')
  expect(res.body).to.equal('{"login":true,"redirect_url":"/api/auth/logout"}')
});

it("/refresh with bad Refresh Token", async () => {
  authdomainNock
    .post('/oauth2/token', body => {
      if (body.refresh_token != 'bad_refresh_token') { return false }
      expect(body.grant_type).to.equal('refresh_token');
      expect(body.client_id).to.equal('UserPoolClientId');
      return true
    })
    .reply(400, resData.badToken)

  const res = await index.handler(reqData.refresh_withBadToken, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  expect(res.body).to.equal(`{"login":false,"redirect_url":"https://AuthDomain/login?client_id=UserPoolClientId&response_type=code&scope=email+openid+phone+profile&redirect_uri=${URI}/api/auth/callback"}`)
});

it("/callback ", async () => {
  authdomainNock
    .post('/oauth2/token', body => (body.grant_type == 'authorization_code' && body.code == 'code'))
    .reply(200, resData.authCodeGrant)

  const res = await index.handler(reqData.callback, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(302);
  expect(res.multiValueHeaders['set-cookie'].join()).to.include('id_token')
  expect(res.multiValueHeaders['set-cookie'].join()).to.include('refresh_token')
  expect(res.multiValueHeaders['set-cookie'].join()).to.include('access_token')
  expect(res.multiValueHeaders.location).to.include(URI)
});

it("/callback without auth code", async () => {
  const res = await index.handler(reqData.callback_noCode, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(302);
  expect(res.multiValueHeaders).not.to.have.key('set-cookie')
  expect(res.multiValueHeaders.location).to.include(URI)
});

it("/callback with bad auth code", async () => {
  authdomainNock
    .post('/oauth2/token', body => (body.grant_type == 'authorization_code' && body.code != 'code'))
    .reply(200, resData.authCodeGrantBadCode)

  const res = await index.handler(reqData.callback_badCode, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(302);
  expect(res.multiValueHeaders).not.to.have.key('set-cookie')
  expect(res.multiValueHeaders.location).to.include(URI)
});
