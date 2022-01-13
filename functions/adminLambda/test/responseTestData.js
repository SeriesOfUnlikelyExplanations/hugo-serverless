'use strict';

module.exports = Object.freeze({
  ssm: {
    InvalidParameters: [ "string" ],
    Parameters: [
      {
          Name: '/AlwaysOnward/UserPoolId',
          Type: "String",
          Value: "'/AlwaysOnward/UserPoolClientId'"
      },
      {
          Name: '/AlwaysOnward/UserPoolClientId',
          Type: "String",
          Value: "UserPoolClientId"
      },
      {
          Name: '/AlwaysOnward/AuthDomain',
          Type: "String",
          Value: "AuthDomain"
      },
      {
          Name: '/AlwaysOnward/UserPoolClientSecret',
          Type: "String",
          Value: "UserPoolClientSecret"
      },
      {
          Name: '/AlwaysOnward/offersBucket',
          Type: "String",
          Value: "offersBucket"
      },
      {
          Name: '/AlwaysOnward/region',
          Type: "String",
          Value: "region"
      },
      {
          Name: '/AlwaysOnward/devicesTable',
          Type: "String",
          Value: "devicesTable"
      },
      {
          Name: '/AlwaysOnward/offersTable',
          Type: "String",
          Value: "offersTable"
      },
      {
          Name: '/AlwaysOnward/deviceSoftwareBucket',
          Type: "String",
          Value: "deviceSoftwareBucket"
      },
      {
          Name: '/AlwaysOnward/moviesBucket',
          Type: "String",
          Value: "moviesBucket"
      },
      {
          Name: '/AlwaysOnward/currentSoftwareVersion',
          Type: "String",
          Value: "currentSoftwareVersion"
      }
    ]
  },
  verifier: {
    "at_hash": "BSEId5nF27zMrN9BLX-T_A",
    "sub": "good_userId",
    "aud": "5ra91i9p4trq42m2vnjs0pv06q",
    "event_id": "b6d7a62d-54da-49e6-a839-66506f0c21b5",
    "token_use": "id",
    "auth_time": 1587311838,
    "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_PDsy6i0Bf",
    "name": "Max Ivanov",
    "cognito:username": "24e26910-e7b9-4aad-a994-387942f164e7",
    "exp": 1587315438,
    "iat": 1587311838,
    "email": "max@southlane.com",
    "custom:isAdmin": "True"
  },
  verifier_bad: {
    "at_hash": "BSEId5nF27zMrN9BLX-T_A",
    "sub": "good_userId",
    "aud": "5ra91i9p4trq42m2vnjs0pv06q",
    "event_id": "b6d7a62d-54da-49e6-a839-66506f0c21b5",
    "token_use": "id",
    "auth_time": 1587311838,
    "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_PDsy6i0Bf",
    "name": "Max Ivanov",
    "cognito:username": "24e26910-e7b9-4aad-a994-387942f164e7",
    "exp": 1587315438,
    "iat": 1587311838,
    "email": "max@southlane.com"
  },
  verifier_noAdmin: {
    "at_hash": "BSEId5nF27zMrN9BLX-T_A",
    "sub": "good_userId",
    "aud": "5ra91i9p4trq42m2vnjs0pv06q",
    "event_id": "b6d7a62d-54da-49e6-a839-66506f0c21b5",
    "token_use": "id",
    "auth_time": 1587311838,
    "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_PDsy6i0Bf",
    "name": "Max Ivanov",
    "cognito:username": "24e26910-e7b9-4aad-a994-387942f164e7",
    "exp": 1587315438,
    "iat": 1587311838,
    "email": "max@southlane.com"
  },
})
