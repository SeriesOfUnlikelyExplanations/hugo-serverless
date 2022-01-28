'use strict';

module.exports = Object.freeze({
  ssm: {
    InvalidParameters: [ "string" ],
    Parameters: [
          {
        Name: '/hugoServerless/datasyncSourceTask',
        Type: "String",
        Value: "datasyncSourceTask"
      },
      {
        Name: '/hugoServerless/datasyncWebsiteTask',
        Type: "String",
        Value: "datasyncWebsiteTask"
      },
      {
        Name: '/hugoServerless/datasyncThemeTask',
        Type: "String",
        Value: "datasyncThemeTask"
      },
      {
        Name: '/hugoServerless/vpcID',
        Type: "String",
        Value: "vpcID"
      },
      {
        Name: '/hugoServerless/securityGroupID',
        Type: "String",
        Value: "securityGroupID"
      },
      {
        Name: '/hugoServerless/subnetID',
        Type: "String",
        Value: "subnetID"
      },
      {
        Name: '/hugoServerless/postsTable',
        Type: "String",
        Value: "postsTable"
      },      
      {
        Name: '/hugoServerless/AuthDomain',
        Type: "String",
        Value: "AuthDomain"
      },      
      {
        Name: '/hugoServerless/UserPoolClientId',
        Type: "String",
        Value: "UserPoolClientId"
      },
      {
        Name: '/hugoServerless/UserPoolClientSecret',
        Type: "String",
        Value: "UserPoolClientSecret"
      },
      {
        Name: '/hugoServerless/googleApiKey',
        Type: "String",
        Value: "testGoogleKey"
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
  ddb_get:  {
    "ConsumedCapacity": {
      "CapacityUnits": 1,
      "TableName": "Thread"
    },
    "Item": {
      "postPath": "post_path",
      "comments": [
        {
          "userId": "userId",
          "author": "author",
          "content": "comment"
        }
      ]
    }
  }
})
