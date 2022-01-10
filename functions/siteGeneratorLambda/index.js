const { SSM } = require('aws-sdk');
const { promises: { readdir } } = require('fs');

// Environment variables
const LOCAL_SOURCE_DIR = '/mnt/hugo'
const LOCAL_BUILD_DIR = '/mnt/hugo/public'

exports.handler = async (event, context) => {
  console.log(event);
  console.log("Checking the source directory...")
  console.log(await readdir(source, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name))
  var ssm = new SSM();
  
}

function getSSM(ssm, path, config = {}, nextToken) {
  return ssm
    .getParametersByPath({ Path: path, Recursive: true, NextToken: nextToken })
    .promise()
    .then(({ Parameters, NextToken }) => {
      for (const i of Parameters) {
        config[i.Name.replace("/AlwaysOnward/","")] = i.Value;
      }
      return NextToken ? getSSM(ssm, path, config, NextToken) : config;
    });
}
