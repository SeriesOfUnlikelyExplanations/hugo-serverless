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
      },
      {
        Name: '/hugoServerless/siteName',
        Type: "String",
        Value: "siteName"
      },
      {
        Name: '/hugoServerless/distID',
        Type: "String",
        Value: "distID"
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
  },
  listWebsiteBucket: {
    Contents: [
       {
      ETag: "\"70ee1738b6b21e2c8a43f3a5ab0eee71\"", 
      Key: "happyface.jpg", 
      LastModified: "2015-05-15T09:40:50Z", 
      Size: 11, 
      StorageClass: "STANDARD"
     }, 
       {
      ETag: "\"becf17f89c30367a9a44495d62ed521a-1\"", 
      Key: "test.jpg", 
      LastModified: "2015-05-15T09:40:50Z", 
      Size: 4192256, 
      StorageClass: "STANDARD"
     }
    ], 
    IsTruncated: true, 
    KeyCount: 2, 
    MaxKeys: 2, 
    Name: "examplebucket", 
    NextContinuationToken: "1w41l63U0xa8q7smH50vCxyTQqdxo69O3EmK28Bi5PcROI4wI/EyIJg==", 
    Prefix: ""
  }
})
