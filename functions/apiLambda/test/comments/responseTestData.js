'use strict';

module.exports = Object.freeze({
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
