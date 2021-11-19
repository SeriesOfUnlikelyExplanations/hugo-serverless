import subprocess, os, logging, boto3

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
  region = event['region']
  func = boto3.client('lambda', region_name = region)
  ssm = boto3.client('ssm', region_name = region)
  logger.info("Checking the source directory...")
  run_command('ls -n {}'.format(LOCAL_SOURCE_DIR))
  logger.info("Building Hugo site")
  run_command("hugo/hugo -s {0} -d {1}".format(LOCAL_SOURCE_DIR,LOCAL_BUILD_DIR))
  run_command("ls -l {0}".format(LOCAL_BUILD_DIR))

  parameter = ssm.get_parameter(Name='/AlwaysOnward/datasyncSourceTask', WithDecryption=True)
  print(parameter['Parameter']['Value'])
  
  if parameter['Parameter']['Value'] in event['resources'][0]:
    lambdaFunction = ssm.get_parameter(Name='/AlwaysOnward/datasyncSourceTask', WithDecryption=True)
    d = {'action': 'deploy'}
    response = client.invoke(
      FunctionName=lambdaFunction['Parameter']['Value'],
      LogType='None',
      Payload=json.dumps(d)
    )
  return {"statusCode": 200, \
    "headers": {"Content-Type": "text/html"}, \
    "body": "Build complete"}
