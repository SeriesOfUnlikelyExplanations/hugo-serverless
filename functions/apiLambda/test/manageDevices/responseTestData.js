'use strict';

module.exports = Object.freeze({
  putItem: {},
  scan: [
    {
      "token": "token1",
      "userID": 'good_userId',
      "MAC": '',
      "typeData":{},
      'name': 'device1'
    },
    {
      "token": "token2",
      "userID": 'good_userId',
      "MAC": '',
      "typeData":{
        movies: [
          'movie1.mpg',
          "movie2.mp4"
        ]
      },
      'name': 'device2'
    }
  ],
  ddbGet: {
    "token": "token2",
    "userID": 'good_userId',
    "MAC": '',
    "typeData":{
      movies: [
        'movie1.mpg',
        "movie2.mp4"
      ]
    },
    'name': 'device2'
  },
  listObjects:{"Contents": [
    {
      "LastModified": "2019-11-05T23:11:50.000Z",
      "ETag": "\"621503c373607d548b37cff8778d992c\"",
      "StorageClass": "STANDARD",
      "Key": "movie1.mpg",
      "Size": 391
    },
    {
      "LastModified": "2019-11-05T23:11:50.000Z",
      "ETag": "\"a2cecc36ab7c7fe3a71a273b9d45b1b5\"",
      "StorageClass": "STANDARD",
      "Key": "movie2.mp4",
      "Size": 373
    },
    {
      "LastModified": "2019-11-05T23:11:50.000Z",
      "ETag": "\"08210852f65a2e9cb999972539a64d68\"",
      "StorageClass": "STANDARD",
      "Key": "movie3.mov",
      "Size": 399
    },
    {
      "LastModified": "2019-11-05T23:11:50.000Z",
      "ETag": "\"d1852dd683f404306569471af106988e\"",
      "StorageClass": "STANDARD",
      "Key": "movie3.wav",
      "Size": 6225
    }
   ]}
})
