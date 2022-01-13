'use strict';

module.exports = Object.freeze({
  getData: {
    "MAC": "",
    "name": "test_device",
    "token": "test",
    "type": "",
    "typeData": {
      "movies": [
        "movie1.mp4",
        "movie2.m4v",
        "movie3.mp4"
      ]
    },
    "userId": "7b2bd148-2e03-40e9-9a76-a5853a1102e3"
  },
  getData_bad: {
    "MAC": "",
    "name": "bad_test_device",
    "token": "bad_test",
    "type": "",
    "typeData": {
      "movies": [
        "movie1.mp4",
        "movie2.m4v",
        "movie3.mp4"
      ]

    },
    "userId": "7b2bd148-2e03-40e9-9a76-a5853a1102e3"
  },
  getData_missingMovie: {
    "MAC": "",
    "name": "missingMovie_test_device",
    "token": "missingMovie_test",
    "type": "",
    "typeData": {
      "movies": [
        "movie1.mp4",
        "movie2.m4v",
        "movie3.mp4",
        "missing_movie.mp4"
      ]
    },
    "userId": "7b2bd148-2e03-40e9-9a76-a5853a1102e3"
  }
})



