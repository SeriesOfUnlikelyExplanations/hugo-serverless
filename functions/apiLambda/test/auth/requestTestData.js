'use strict';

module.exports = Object.freeze({
  logout: {
    httpMethod: "GET",
    path: '/api/auth/logout',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: [],
    multiValueHeaders: [],
    isBase64Encoded: false,
    body: ''
  },
  refresh_noRefreshToken: {
    httpMethod: "GET",
    path: '/api/auth/refresh',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: [],
    multiValueHeaders: [],
    isBase64Encoded: false,
    body: ''
  },
  refresh_withAccessToken: {
    httpMethod: "GET",
    path: '/api/auth/refresh',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    isBase64Encoded: false,
    body: ''
  },
  refresh_withRefreshTokennoAccessToken: {
    httpMethod: "GET",
    path: '/api/auth/refresh',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {Cookie: 'refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['refresh_token=refresh_token']},
    isBase64Encoded: false,
    body: ''
  },
  refresh_withBadToken: {
    httpMethod: "GET",
    path: '/api/auth/refresh',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {Cookie: 'refresh_token=bad_refresh_token'},
    multiValueHeaders: {Cookie: ['refresh_token=bad_refresh_token']},
    isBase64Encoded: false,
    body: ''
  },
  callback: {
    httpMethod: "GET",
    path: '/api/auth/callback',
    resource: '/{proxy+}',
    queryStringParameters: {code: 'code'},
    headers: [],
    multiValueHeaders: [],
    isBase64Encoded: false,
    body: ''
  },
  callback_noCode: {
    httpMethod: "GET",
    path: '/api/auth/callback',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: [],
    multiValueHeaders: [],
    isBase64Encoded: false,
    body: ''
  },
  callback_badCode: {
    httpMethod: "GET",
    path: '/api/auth/callback',
    resource: '/{proxy+}',
    queryStringParameters: {code: 'badcode'},
    headers: [],
    multiValueHeaders: [],
    isBase64Encoded: false,
    body: ''
  }
})
