'use strict';

const now = new Date();
const start_date = now.getMonth() + 1 + "-" + (now.getDate()+3) + "-" + now.getFullYear();
const end_date = now.getMonth() + 1 + "-" + (now.getDate()+5) + "-" + now.getFullYear();

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
    path: '/api/plan/weather/47.6062/-122.3321',
    resource: '/{proxy+}',
    queryStringParameters: {start_date: start_date, finish_date: end_date},
    headers: {Cookie: 'access_token=access_token_noAdmin; id_token=id_token_noAdmin; refresh_token=refresh_token'},
    multiValueHeaders: {Cookie: ['access_token=access_token_noAdmin; id_token=id_token_noAdmin; refresh_token=refresh_token']},
    requestContext: {},
    pathParameters: {},
    stageVariables: {},
    isBase64Encoded: false,
    body: ''
  }
})
