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
  parameters = ssm.get_parameters(Name= [
    '/hugoServerless/datasyncSourceTask',
    '/hugoServerless/themeBucket'
  ])
  sourceTask = next(item for item in parameters if item["Name"] == '/hugoServerless/datasyncSourceTask')
  logger.info('Checking which task was completed...')
  if parameter['Parameter']['Value'] in event['resources'][0]:
    logger.info("It was the Source Datasync Task."
    logger.info("Checking if there was a theme folder in the source bucket..."
    THEMEPATH = LOCAL_SOURCE_DIR+'/themes/hugo-serverless-theme'
    theme_present = os.path.isdir(THEMEPATH)
    logger.info(theme_present);   
    if !theme_present:
      console.log('No theme. Using Default...');
      s3_client = boto3.client('s3')
      themeBucket = next(item for item in parameters if item["Name"] == '/hugoServerless/themeBucket')
      keys = []
      dirs = []
      next_token = ''
      while next_token is not None:
        if next_token == '':
          results = s3_client.list_objects_v2(bucket = themeBucket)
        else:
          results = s3_client.list_objects_v2(bucket = themeBucket, ContinuationToken = next_token)
        contents = results.get('Contents')
        for i in contents:
            k = i.get('Key')
            if k[-1] != '/':
                keys.append(k)
            else:
                dirs.append(k)
        next_token = results.get('NextContinuationToken')
      for d in dirs:
        dest_pathname = os.path.join(THEMEPATH, d)
        if not os.path.exists(os.path.dirname(dest_pathname)):
          os.makedirs(os.path.dirname(dest_pathname))
      for k in keys:
        dest_pathname = os.path.join(THEMEPATH, k)
        if not os.path.exists(os.path.dirname(dest_pathname)):
          os.makedirs(os.path.dirname(dest_pathname))
        s3_client.download_file(themeBucket, k, dest_pathname)
      console.log('Downloaded default theme.');
      
    logger.info("Building Hugo site...")
    run_command("hugo/hugo -s {0} -d {1}".format(LOCAL_SOURCE_DIR,LOCAL_BUILD_DIR))
    run_command("ls -l {0}".format(LOCAL_BUILD_DIR))
    
    logger.info("Build complete.")
    return {"statusCode": 200,
      "headers": {"Content-Type": "text/html"},
      "body": "Build complete", 
      "action": "deploy"
    }
  else:
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
