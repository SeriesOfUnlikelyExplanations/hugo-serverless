const { handler } = require('../index.js')

const result = handler({Records: [{
  eventName: 'ObjectCreated:Put',
  sendEmail: 'N',
  awsRegion: 'us-west-2'
}]}).then(console.log);
