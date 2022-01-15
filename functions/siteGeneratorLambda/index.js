const { SSM } = require('aws-sdk');
const { promises: { readdir, unlink, rmdir } } = require('fs');
const { join } = require('path')
const { execFileSync } = require('child_process');

// Environment variables
let EFS_DIR = '/mnt/hugo';

// Used for Testing
exports.setEfsDir = (value) => {
  EFS_DIR = value;
}

exports.handler = async (event, context) => {
  console.log(event);
  console.log("Checking the source directory...")
  await readdir(EFS_DIR, { withFileTypes: true }).then((f) => { console.log(f.map(dirent => dirent.name)) })
  console.log("Getting SSM parameters...")
  var ssm = new SSM({region:event.region});
  const ssmData = await getSSM(ssm, '/hugoServerless');
  if (event.resources[0].includes(ssmData.datasyncSourceTask)) {
    console.log("It was the Source Datasync Task.")
    console.log("Building Hugo site...")
    try {
      const hugo = await import("hugo-extended");
      const binPath = await hugo.default();
      const result = execFileSync(binPath, ['-s', EFS_DIR]).toString();
      console.log(result);
    } catch (e) {
      console.error(e); // should contain code (exit code) and signal (that caused the termination).
      return {"statusCode": 500,
        "body": e.toString(), 
        "action": "None"
      }
    }
    return {"statusCode": 200,
      "region": event.region,
      "body": "Build complete", 
      "action": "deploy"
    }
  } else if (event.resources[0].includes(ssmData.datasyncWebsiteTask)) {
    console.log("It was the Website Datasync Task.")
    console.log("Deleting the EFS directory...")
    const files = await readdir(EFS_DIR, { withFileTypes: true })
    for (const file of files) {
      if (file.isDirectory()) {
        await rmdir(join(EFS_DIR, file.name), { recursive: true })
      } else {
        await unlink(join(EFS_DIR, file.name))
      }
    }
    console.log('Checking to see if it was deleted...')
    await readdir(EFS_DIR, { withFileTypes: true }).then((f) => { console.log(f.map(dirent => dirent.name)) })
    console.log("Delete Complete.")   
    return {"statusCode": 200,
      "region": event.region,
      "body": "Delete complete",
      "action": "None"
    }
    
  } else {
    return {"statusCode": 404,
      "region": event.region,
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
