import hugo from "hugo-extended";
import { exec } from "child_process";

const deploy = async () => {
  const binPath = await hugo();
  const child = exec(binPath, ['-s', '/tmp', '-c', '/mnt/hugo/content', '-d', '/mnt/hugo/public']);

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
