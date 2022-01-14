'use strict';

module.exports = Object.freeze({
  ssm: {
    InvalidParameters: [ "" ],
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
      }
    ]
  },
  vpcEndpoint: {
    "VpcEndpoint": {
      "PolicyDocument": "{\"Version\":\"2008-10-17\",\"Statement\":[{\"Sid\":\"\",\"Effect\":\"Allow\",\"Principal\":\"\*\",\"Action\":\"\*\",\"Resource\":\"\*\"}]}",
      "VpcId": "vpc-1a2b3c4d",
      "State": "available",
      "ServiceName": "com.amazonaws.us-east-1.s3",
      "RouteTableIds": [
        "rtb-11aa22bb"
      ],
      "VpcEndpointId": "vpc-1a2b3c4d",
      "CreationTimestamp": "2015-05-15T09:40:50Z"
    }
  }
})
