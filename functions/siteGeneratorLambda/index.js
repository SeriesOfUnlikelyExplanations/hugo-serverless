const { SSM } = require('aws-sdk');
const { promises: { readdir, unlink, rmdir } } = require('fs');
const { join } = require('path')

// Environment variables
const LOCAL_SOURCE_DIR = '/mnt/hugo'
const LOCAL_BUILD_DIR = '/mnt/hugo/public'

exports.handler = async (event, context) => {
  console.log(event);
  console.log("Checking the source directory...")
  console.log(await readdir(LOCAL_SOURCE_DIR, { withFileTypes: true }).map(dirent => dirent.name))
  console.log("Getting SSM parameters...")
  var ssm = new SSM();
  const ssmData = await getSSM(ssm, '/hugoServerless');
  if (event.resources[0].includes(ssmData.datasyncSourceTask)) {
    logger.info("It was the Source Datasync Task.")
    logger.info("Building Hugo site...")
    const hugo = require("hugo-extended");
    const { execAsync }  = require('child_process');
    try {
      const { stderr, stdout } = await execAsync(binPath, [`-s ${LOCAL_SOURCE_DIR}`, `-d ${LOCAL_BUILD_DIR}`]);
      console.log('stdout:', stdout);
      console.log('stderr:', stderr);
    } catch (e) {
      console.error(e); // should contain code (exit code) and signal (that caused the termination).
    }
    return {"statusCode": 200,
      "headers": {"Content-Type": "text/html"},
      "body": "Build complete", 
      "action": "deploy"
    }
  } else if (event.resources[0].includes(ssmData.datasyncWebsiteTask)) {
    console.log("It was the Website Datasync Task.")
    console.log("Deleting the EFS directory...")
    const files = await readdir(LOCAL_SOURCE_DIR, { withFileTypes: true })
    for (const file of files) {
      if (file.isDirectory()) {
        await rmdir(join(LOCAL_SOURCE_DIR, file))
      } else{
        await unlink(join(LOCAL_SOURCE_DIR, file))
      }
    }
    logger.info('Checking to see if it was deleted...')
    console.log(await readdir(LOCAL_SOURCE_DIR, { withFileTypes: true }).map(dirent => dirent.name))
    logger.info("Delete Complete.")
    
    return {"statusCode": 200,
      "headers": {"Content-Type": "text/html"},
      "body": "Delete complete",
      "action": "None"
    }
    
  } else {
    return {"statusCode": 404,
      "headers": {"Content-Type": "text/html"},
      "body": "Datasync task not found",
      "action": "None"
    }
  }
}

function getSSM(ssm, path, config = {}, nextToken) {
  return ssm
    .getParametersByPath({ Path: path, Recursive: true, NextToken: nextToken })
    .promise()
    .then(({ Parameters, NextToken }) => {
      for (const i of Parameters) {
        config[i.Name.replace(path+"/","")] = i.Value;
      }
      return NextToken ? getSSM(ssm, path, config, NextToken) : config;
    });
}
