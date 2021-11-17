import hugo from "hugo-extended";
import { exec } from "child_process";
const { copySync } from 'fs-extra';

function promiseFromChildProcess(child) {
  return new Promise(function (resolve, reject) {
    child.addListener("error", reject);
    child.addListener("exit", resolve);
  });
}

const deploy = async () => {
  copySync('config.toml', '/tmp/config.toml')
  copySync('themes', '/tmp/themes')
  copySync('node_modules', '/tmp/node_modules')
  process.chdir('/tmp');
      
  const binPath = await hugo();
  const child = exec(binPath, ['-e', 'production']);

  child.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
  });
  child.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
  });
  child.on('close', function (code) {
      console.log('closing code: ' + code);
  });

  const res = await promiseFromChildProcess(child)
  console.log(res)
  return res
};

export default deploy;
