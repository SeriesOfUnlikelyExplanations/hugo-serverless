'use strict';

module.exports = Object.freeze({
  token: {
    "access_token":"access_token",
    "id_token":"id_token",
    "token_type":"Bearer",
    "expires_in":3600
  },
  badToken: {
    "error":"invalid_request"
  },
  authCodeGrant: {
    "access_token":"access_token",
    "id_token":"id_token",
    "refresh_token":"refresh_token",
    "token_type":"Bearer",
    "expires_in":3600
  },
  authCodeGrantBadCode: {
    "error":"invalid_grant"
  }
})



