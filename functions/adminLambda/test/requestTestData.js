'use strict';

module.exports = Object.freeze({
  s3Upload: {
    Records: [
      {
        eventVersion: '2.1',
        eventSource: 'aws:s3',
        awsRegion: 'us-west-2',
        eventTime: '2022-01-14T00:55:51.621Z',
        eventName: 'ObjectCreated:Put',
      }
    ]
  },
  buildComplete: { 
    statusCode: 200,
    region: 'us-west-2',
    body: 'Build complete', 
    action: 'deploy' 
  },
  sourceDatasyncComplete: {
    version: '0',
    id: '1234',
    'detail-type': 'DataSync Task Execution State Change',
    source: 'aws.datasync',
    account: '1234',
    time: '2022-01-14T01:00:09Z',
    region: 'us-west-2',
    resources: [
      'datasyncSourceTask/execution/exec-0a86ad6d2994fec11'
    ],
    detail: { State: 'SUCCESS' }
  }
})
