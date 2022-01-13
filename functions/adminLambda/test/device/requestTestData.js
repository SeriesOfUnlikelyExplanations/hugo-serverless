'use strict';

module.exports = Object.freeze({
  update_fail_auth: {
    httpMethod: "GET",
    path: '/api/device/update',
    resource: '/{proxy+}',
    queryStringParameters: [],
    headers: {'Authorization': 'Bearer fail'},
    isBase64Encoded: false,
    body: ''
  },
  update: {
    httpMethod: "GET",
    path: '/api/device/update',
    resource: '/{proxy+}',
    queryStringParameters: {version:'test'},
    headers: {'Authorization': 'Bearer test'},
    isBase64Encoded: false,
    body: ''
  },
  update_badDeviceName: {
    httpMethod: "GET",
    path: '/api/device/update',
    resource: '/{proxy+}',
    queryStringParameters: {version:'test'},
    headers: {'Authorization': 'Bearer bad_test'},
    isBase64Encoded: false,
    body: ''
  },
  update_alreadyCurrent: {
    httpMethod: "GET",
    path: '/api/device/update',
    resource: '/{proxy+}',
    queryStringParameters: {version:'currentSoftwareVersion'},
    headers: {'Authorization': 'Bearer test'},
    isBase64Encoded: false,
    body: ''
  },
  updateip: {
    httpMethod: "POST",
    path: '/api/device/updateip',
    resource: '/{proxy+}',
    queryStringParameters: {},
    headers: {'Authorization': 'Bearer test'},
    isBase64Encoded: false,
    body: '{"ip": "good_ip", "mac": "mac_address"}'
  },
  updateip_bad: {
    httpMethod: "POST",
    path: '/api/device/updateip',
    resource: '/{proxy+}',
    queryStringParameters: {},
    headers: {'Authorization': 'Bearer test'},
    isBase64Encoded: false,
    body: '{"ip": "bad_ip", "mac": "mac_address"}'
  },
  getmovie_noBody: {
    httpMethod: "GET",
    path: '/api/device/getmovie',
    resource: '/{proxy+}',
    queryStringParameters: {},
    headers: {'Authorization': 'Bearer test'},
    isBase64Encoded: false,
    body: '{"ip": "192.168.0.23", "mac": "mac_address"}'
  },
  getmovie: {
    httpMethod: "GET",
    path: '/api/device/getmovie',
    resource: '/{proxy+}',
    queryStringParameters: {movies: [
      "movie1.mp4",
      "movie2.m4v"
    ].join(",")},
    headers: {'Authorization': 'Bearer test'},
    isBase64Encoded: false,
    body: ''
  },
  getmovie_delete: {
    httpMethod: "GET",
    path: '/api/device/getmovie',
    resource: '/{proxy+}',
    queryStringParameters: {movies: [
      "movie1.mp4",
      "movie2.m4v",
      "movie3.mp4",
      "movie4.mp4"
    ].join(",")},
    headers: {'Authorization': 'Bearer test'},
    isBase64Encoded: false,
    body: ''
  },
  getmovie_noAction: {
    httpMethod: "GET",
    path: '/api/device/getmovie',
    resource: '/{proxy+}',
    queryStringParameters: {movies: [
      "movie1.mp4",
      "movie2.m4v",
      "movie3.mp4"
    ].join(",")},
    headers: {'Authorization': 'Bearer test'},
    isBase64Encoded: false,
    body: ''
  },
  getmovie_missing: {
    httpMethod: "GET",
    path: '/api/device/getmovie',
    resource: '/{proxy+}',
    queryStringParameters: {movies: [
      "movie1.mp4",
      "movie2.m4v",
      "movie3.mp4"
    ].join(",")},
    headers: {'Authorization': 'Bearer missingMovie_test'},
    isBase64Encoded: false,
    body: ''
  }
})


