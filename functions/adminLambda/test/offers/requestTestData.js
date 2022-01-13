'use strict';

module.exports = Object.freeze({
  presigned_upload_noTokens: {
    httpMethod: "GET",
    path: '/api/offers/presigned_upload',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: [],
    multiValueHeaders: [],
    isBase64Encoded: false,
    body: ''
  },
  presigned_upload_noFilename: {
    httpMethod: "GET",
    path: '/api/offers/presigned_upload',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    isBase64Encoded: false,
    body: ''
  },
  presigned_upload: {
    httpMethod: "GET",
    path: '/api/offers/presigned_upload',
    resource: '/{proxy+}',
    queryStringParameters: {filename: 'blag', filetype: 'pdf'},
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    isBase64Encoded: false,
    body: ''
  },
  get_comparison: {
    httpMethod: "GET",
    path: '/api/offers/get_comparison',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    isBase64Encoded: false,
    body: ''
  }
})
