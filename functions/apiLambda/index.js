// Require the framework and instantiate it - https://github.com/jeremydaly/lambda-api
const api = require('lambda-api')()

api.register(require('./api'), { prefix: '/api' })

// Declare your Lambda handler
exports.handler = async (event, context) => {
  // Run the request
  console.log(event);
  const response = await api.run(event, context)
  console.log(response)
  return response
}


