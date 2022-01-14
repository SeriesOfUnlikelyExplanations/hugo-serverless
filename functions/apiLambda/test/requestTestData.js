'use strict';

module.exports = Object.freeze({
  status: {
    httpMethod: "GET",
    path: '/api/status',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: [],
    multiValueHeaders: [],
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: ''
  },
  contactus: {
    httpMethod: "GET",
    path: '/api/contact-us',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: [],
    multiValueHeaders: [],
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: ''
  },
  noroute: {
    httpMethod: "GET",
    path: '/api/blah',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: ''
  },
  privateStatus_badToken: {
    httpMethod: "GET",
    path: '/api/authStatus',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {Cookie: 'access_token=bad_access_token; id_token=bad_id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=bad_access_token; id_token=bad_id_token; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: ''
  },
  privateStatus: {
    httpMethod: "GET",
    path: '/api/authStatus',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: ''
  },
  noAdminStatus: {
    httpMethod: "GET",
    path: '/api/adminStatus',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {Cookie: 'access_token=access_token_noAdmin; id_token=id_token_noAdmin; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token_noAdmin; id_token=id_token_noAdmin; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: ''
  },
  AdminStatus: {
    httpMethod: "GET",
    path: '/api/adminStatus',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: ''
  }
})