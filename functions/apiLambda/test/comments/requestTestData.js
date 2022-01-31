'use strict';

module.exports = Object.freeze({
  get_comments: {
    httpMethod: "GET",
    path: '/api/get_comments',
    resource: '/{proxy+}',
    queryStringParameters: { post: 'post_path' },
    multiValueQueryStringParameters: { post: [ 'post_path' ] },
    headers: {Cookie: 'access_token=access_token_noAdmin; id_token=id_token_noAdmin; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token_noAdmin; id_token=id_token_noAdmin; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: ''
  },
  post_comments: {
    httpMethod: "POST",
    path: '/api/post_comment',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {Cookie: 'access_token=access_token_noAdmin; id_token=id_token_noAdmin; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token_noAdmin; id_token=id_token_noAdmin; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: '{ "content": "content", "postPath": "post_path" }'
  }
})
