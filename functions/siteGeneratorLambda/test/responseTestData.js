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
      }
    ]
  }
})
