'use strict';

module.exports = Object.freeze({
  weather: {
    httpMethod: "GET",
    path: '/api/plan/weather/47.6062/-122.3321',
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
  weather_with_dates: {
    httpMethod: "GET",
    path: '/api/plan/weather/47.6062/-122.3321?start_date=2-7-2022&finish_date=2-11-2022',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {Cookie: 'access_token=access_token_noAdmin; id_token=id_token_noAdmin; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token_noAdmin; id_token=id_token_noAdmin; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: ''
  }
})
