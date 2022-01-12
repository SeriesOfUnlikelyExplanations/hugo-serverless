import subprocess, os, logging, boto3, json

# Environment variables
LOCAL_SOURCE_DIR = '/mnt/hugo'
LOCAL_BUILD_DIR = '/mnt/hugo/public'

# Setting up a logger with a more readable format
logger = logging.getLogger()
if logger.handlers:
  for handler in logger.handlers:
    logger.removeHandler(handler)
logging.basicConfig(format='%(asctime)s [%(levelname)s]: %(message)s',level=logging.DEBUG)

# Runs a shell command. Throws an exception if fails.
def run_command(command):
  command_list = command.split(' ')
  try:
    logger.info("Running shell command: \"{0}\"".format(command))
    result = subprocess.run(command_list, stdout=subprocess.PIPE);
    logger.info("Command output:\n---\n{0}\n---".format(result.stdout.decode('UTF-8')))
  except Exception as e:
    logger.error("Exception: {0}".format(e))
    raise e
  return True

def lambda_handler(event, context):
  logger.info(event)
  logger.info("Checking the source directory...")
  run_command('ls -n {}'.format(LOCAL_SOURCE_DIR))
  
  logger.info("Getting SSM parameter...")
  region = event['region']
  ssm = boto3.client('ssm', region_name = region)
  parameters = ssm.get_parameters(Names = [
    '/hugoServerless/datasyncSourceTask',
    '/hugoServerless/datasyncWebsiteTask'
  ])
  logger.info('Checking which task was completed...')
  if next(item['Value'] for item in parameters['Parameters'] if item["Name"] == '/hugoServerless/datasyncSourceTask') in event['resources'][0]:
    logger.info("It was the Source Datasync Task.")
    logger.info("Building Hugo site...")
    run_command("hugo/hugo -s {0} -d {1}".format(LOCAL_SOURCE_DIR,LOCAL_BUILD_DIR))
    run_command("ls -l {0}".format(LOCAL_BUILD_DIR))
    logger.info("Build complete.")
    return {"statusCode": 200,
      "headers": {"Content-Type": "text/html"},
      "body": "Build complete", 
      "action": "deploy"
    }
  elif next(item['Value'] for item in parameters['Parameters'] if item["Name"] == '/hugoServerless/datasyncWebsiteTask') in event['resources'][0]:
    logger.info("Website Datasync Task. Deleting the EFS directory...")
    for f in os.listdir(LOCAL_SOURCE_DIR):
      logger.info(f)
      run_command('rm -r {0}/{1}'.format(LOCAL_SOURCE_DIR, f))
    logger.info('Checking to see if it was deleted...')
    run_command('ls -n {}'.format(LOCAL_SOURCE_DIR))
    logger.info("Delete Complete.")
    return {"statusCode": 200,
      "headers": {"Content-Type": "text/html"},
      "body": "Delete complete",
      "action": "None"
    }
  else:
    return {"statusCode": 404,
      "headers": {"Content-Type": "text/html"},
      "body": "Datasync task not found",
      "action": "None"
    }
