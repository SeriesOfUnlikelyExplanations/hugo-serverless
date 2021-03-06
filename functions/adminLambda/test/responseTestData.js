'use strict';
const ssm = [
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
        Name: '/hugoServerless/distID',
        Type: "String",
        Value: "distID"
      },
      {
        Name: '/hugoServerless/postsTable',
        Type: "String",
        Value: "postsTable"
      },
      {
        Name: '/hugoServerless/myEmail',
        Type: "String",
        Value: "myEmail"
      },
      {
        Name: '/hugoServerless/postsTable',
        Type: "String",
        Value: "postsTable"
      },
    ]

module.exports = Object.freeze({
  ssm: {
    InvalidParameters: [ "" ],
    Parameters: ssm.concat([
      {
        Name: '/hugoServerless/siteName',
        Type: "String",
        Value: "siteName"
      },
      {
        Name: '/hugoServerless/noReplyEmail',
        Type: "String",
        Value: "noReplyEmail"
      }
    ])
  },
  ssmNoEmail: {
    InvalidParameters: [ "" ],
    Parameters: ssm.concat([
      {
        Name: '/hugoServerless/siteName',
        Type: "String",
        Value: "siteName"
      }
    ])
  },
  ssmBadLink: {
    InvalidParameters: [ "" ],
    Parameters: ssm.concat([
      {
        Name: '/hugoServerless/siteName',
        Type: "String",
        Value: "siteNameBadLink"
      },
      {
        Name: '/hugoServerless/noReplyEmail',
        Type: "String",
        Value: "noReplyEmail"
      }
    ])
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
  },
  describeVpcEndpoints: {
    "VpcEndpoints": [
      {
        "PolicyDocument": "{\"Version\":\"2008-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"*\",\"Resource\":\"*\"}]}",
        "VpcId": "vpc-aabb1122",
        "NetworkInterfaceIds": [],
        "SubnetIds": [],
        "PrivateDnsEnabled": true,
        "State": "available",
        "ServiceName": "com.amazonaws.us-east-1.dynamodb",
        "RouteTableIds": [
            "rtb-3d560345"
        ],
        "Groups": [],
        "VpcEndpointId": "vpce-032a826a",
        "VpcEndpointType": "Gateway",
        "CreationTimestamp": "2017-09-05T20:41:28Z",
        "DnsEntries": [],
        "OwnerId": "123456789012"
      },
      {
        "VpcEndpointId": "vpce-aabbaabbaabbaabba",
        "VpcEndpointType": "GatewayLoadBalancer",
        "VpcId": "vpc-111122223333aabbc",
        "ServiceName": "com.amazonaws.vpce.us-east-1.vpce-svc-123123a1c43abc123",
        "State": "available",
        "SubnetIds": [
            "subnet-0011aabbcc2233445"
        ],
        "RequesterManaged": false,
        "NetworkInterfaceIds": [
            "eni-01010120203030405"
        ],
        "CreationTimestamp": "2020-11-11T08:06:03.522Z",
        "Tags": [],
        "OwnerId": "123456789012"
      }
    ]
  },
  ddbScan: {
    ConsumedCapacity: {}, 
    Count: 2, 
    Items: [
     {
      "postPath": {
        S: "path1"
       }
     }, 
     {
      "postPath": {
        S: "path2"
       }
     }
    ], 
    ScannedCount: 3
  },
  ddbScanNoNew: {
    ConsumedCapacity: {}, 
    Count: 2, 
    Items: [
     {
      "postPath": {
        S: "path1"
       }
     }, 
     {
      "postPath": {
        S: "path2"
       }
     },
     {
      "postPath": {
        S: "path3"
       }
     }
    ], 
    ScannedCount: 3
  },
  ddbGetEmails: {
    "Item": {
      "postPath": {
      "S": "blog.always-onward.com"
      },
      "emails": {
      "L": [
       {
        "M": {
         "name": {
          "S": "bob"
         },
         "email": {
          "S": "bob@bob.com"
         }
        }
       },
       {
        "M": {
         "name": {
          "S": "Sue"
         },
         "email": {
          "S": "Sue@Sue.com"
         }
        }
       }
      ]
     }
    }
  },
  ddbBatchWriteItem: {
    UnprocessedItems: {},
    ItemCollectionMetrics: {
      postsTable: [
        {
          ItemCollectionKey: {
            postPath: {
              S: "path3"
            }
          },
          SizeEstimateRangeGB: [
            0.0,
            1.0
          ]
        }
      ]
    },
    ConsumedCapacity: [
      {
        TableName: "postsTable",
        CapacityUnits: 6.0,
        Table: {
          CapacityUnits: 3.0
        },
        LocalSecondaryIndexes: {
          AlbumTitleIndex: {
            CapacityUnits: 3.0
          }
        }
      }
    ]
  },
  rssFeed: `<rss xmlns:atom="http://www.w3.org/2005/Atom" version="2.0"><channel>
    <title>Posts</title>
    <link>https://siteName/</link>
    <description>blah</description>
    <generator>Hugo -- gohugo.io</generator>
    <language>en</language>
    <copyright>Copyright ?? 2020</copyright>
    <lastBuildDate>Sun, 05 Dec 2021 00:00:00 +0000</lastBuildDate>
    <atom:link href="https://siteName/index.xml" rel="self" type="application/rss+xml"/>
      <item>
        <title>Post1</title>
        <link>Link1</link>
        <pubDate>Sun, 05 Dec 2021 00:00:00 +0000</pubDate>
        <guid>path1</guid>
        <description>Lipsorum</description>
        <featureImage>https://siteName/image1.jpg</featureImage>
      </item>
      <item>
        <title>Post2</title>
        <link>Link2</link>
        <pubDate>Sat, 13 Nov 2021 00:00:00 +0000</pubDate>
        <guid>path2</guid>
        <description>Lipsorum</description>
        <featureImage>https://siteName/image2.jpg</featureImage>
      </item>
      <item>
        <title>Post3</title>
        <link>Link3</link>
        <pubDate>Sat, 13 Nov 2021 00:00:00 +0000</pubDate>
        <guid>path3</guid>
        <description>Lipsorum</description>
        <featureImage>https://siteName/image3.jpg</featureImage>
      </item>
    </channel></rss>`
  
})
