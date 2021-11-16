const { handler } = require('../index.js')

const result = handler({
  version: '0',
  id: '7d3e7f7b-8a8d-f93d-edd1-892ea0148b4f',
  'detail-type': 'DataSync Task Execution State Change',
  source: 'aws.datasync',
  account: '718523126320',
  time: '2021-11-10T05:10:46Z',
  region: 'us-west-2',
  resources: [
    'arn:aws:datasync:us-west-2:718523126320:task/task-0fa815fd0f66f3f3e/execution/exec-092a886cc4280ab56'
  ],
  detail: { State: 'SUCCESS' }
}, {}).then(console.log);
