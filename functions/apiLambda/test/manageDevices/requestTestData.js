'use strict';

module.exports = Object.freeze({
  createDeviceToken_missingName: {
    httpMethod: "POST",
    path: '/api/managedevices/createDeviceToken',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: '{}'
  },
  createDeviceToken: {
    httpMethod: "POST",
    path: '/api/managedevices/createDeviceToken',
    resource: '/{proxy+}',
    queryStringParameters: {},
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: '{"name": "newDevice"}'
  },
  createDeviceToken_withType: {
    httpMethod: "POST",
    path: '/api/managedevices/createDeviceToken',
    resource: '/{proxy+}',
    queryStringParameters: {},
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: '{"name": "newDevice","type":"MediaPlayer","typeData":{"movies":["Moana","Ghostbusters"]}}'
  },
  getTokens: {
    httpMethod: "GET",
    path: '/api/managedevices/getTokens',
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
  getToken: {
    httpMethod: "GET",
    path: '/api/managedevices/getTokens',
    resource: '/{proxy+}',
    queryStringParameters: {token: 'token1'},
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: ''
  },
  deleteUnusedTokens_all: {
    httpMethod: "POST",
    path: '/api/managedevices/deleteUnusedTokens',
    resource: '/{proxy+}',
    queryStringParameters: {name: 'Device1'},
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: '{}'
  },
  deleteUnusedTokens_notTokenOne: {
    httpMethod: "POST",
    path: '/api/managedevices/deleteUnusedTokens',
    resource: '/{proxy+}',
    queryStringParameters: {},
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: '{"token":"token1"}'
  },
  deleteUnusedTokens_notDeviceOne: {
    httpMethod: "POST",
    path: '/api/managedevices/deleteUnusedTokens',
    resource: '/{proxy+}',
    queryStringParameters: {},
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: '{"name":"device1"}'
  },
  moviesUpload: {
    httpMethod: "GET",
    path: '/api/managedevices/movie_upload',
    resource: '/{proxy+}',
    queryStringParameters: {filename: 'movie.mp4', filetype: 'mp4'},
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    isBase64Encoded: false,
    body: ''
  },
  getMovies: {
    httpMethod: "GET",
    path: '/api/managedevices/get_movies',
    resource: '/{proxy+}',
    queryStringParameters: {filename: 'movie.mp4', filetype: 'mp4'},
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    isBase64Encoded: false,
    body: ''
  },
  addMovie: {
    httpMethod: "POST",
    path: '/api/managedevices/update_movie',
    resource: '/{proxy+}',
    queryStringParameters: {},
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    isBase64Encoded: false,
    body: JSON.stringify({token:'token1',movie:'movie.mp4',action:'add'})
  },
  removeMovie: {
    httpMethod: "POST",
    path: '/api/managedevices/update_movie',
    resource: '/{proxy+}',
    queryStringParameters: {},
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    isBase64Encoded: false,
    body: JSON.stringify({token:'token1',movie:'movie2.mp4',action:'remove'})
  },
  updateMovie_bad: {
    httpMethod: "POST",
    path: '/api/managedevices/update_movie',
    resource: '/{proxy+}',
    queryStringParameters: {},
    headers: {Cookie: 'access_token=access_token; id_token=id_token; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token; id_token=id_token; refresh_token=refresh_token']},
    isBase64Encoded: false,
    body: JSON.stringify({token:'token1',movie:'movie2.mp4'})
  },
})