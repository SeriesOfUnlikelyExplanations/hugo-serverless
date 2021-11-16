const { execSync } = require('child_process');
var fs = require('fs');
var path = require('path');
const mime = require('mime');
const AWS = require("aws-sdk");
const stream = require("stream")
async = require("async")
const zlib = require('zlib');
var tar = require('tar');
var tars = require('tar-stream');
const yaml = require('js-yaml')

execSync('tsc');
const config = require('../lib/config');
AWS.config.update({region:config.region});

s3Sync(false)

async function s3Sync(fullReset) {
  // get SSM keys
  var ssm = new AWS.SSM();
  var ssmData = await ssm.getParameters({Names: ['/OnwardBlog/photosBucket']}).promise();

  // initialize S3
    const s3 = new AWS.S3({
    accessKeyId:  process.env.AWS_ACCESS_KEY_ID || process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET,
  });

  const fileContents = fs.readFileSync('./_config.yml', 'utf8');
  const ymlData = yaml.load(fileContents);
  const source_dir = ymlData.source_dir

  //upload tar files
  const files = fs.readdirSync(path.join(source_dir, '_posts'));
  await new Promise((resolve, reject) => {
    async.eachSeries(files, (file, cb) => {
      const filePath = path.join(source_dir, '_posts', file);
      const stat = fs.statSync(filePath)
      if (stat && stat.isDirectory()) {
        console.log('Compressing '+file)
        const pass = new stream.PassThrough()
        const s3params = {
          Bucket: ssmData.Parameters.find(p => p.Name === '/OnwardBlog/photosBucket').Value,
          Key: path.basename(file) + '.tar.gz',
          Body: pass,
          ContentType: 'application/gzip'
        }
        s3.upload(s3params, (err, data) => {
          if (err) console.log(err)
          if (data) {
            cb()
            console.log('Successfully uploaded ' + file + '.tar.gz')
          }
        })
        console.log(filePath);
        tar.c({ gzip: true, C: path.join(source_dir, '_posts') }, [file])
          .pipe(pass)
      } else {
        cb()
      }
    }, function(err) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve();
      }
    });
  });

  if (fullReset) {
    //download tar files
    const listAllKeys = (params, out = []) => new Promise((resolve, reject) => {
      s3.listObjectsV2(params).promise()
      .then(({Contents, IsTruncated, NextContinuationToken}) => {
        let result = Contents.map(a => a.Key).filter((x) => { return /.(tar.gz)$/i.test(x) })
        
        out.push(...result);
        !IsTruncated ? resolve(out) : resolve(listAllKeys(Object.assign(params, {ContinuationToken: NextContinuationToken}), out));
      })
      .catch(reject);
    });
    const keys = await listAllKeys({Bucket: ssmData.Parameters.find(p => p.Name ==='/OnwardBlog/photosBucket').Value})
    async.eachSeries(keys, async (key, cb) => {
      console.log('Downloading: ' + key);
      var fileParams = {
        Bucket: ssmData.Parameters.find(p => p.Name === '/OnwardBlog/photosBucket').Value,
        Key: key
      }
      var outputPath = path.join(source_dir, '_posts', key.replace('.tar.gz', ""))
      const s3ReadStream = s3.getObject(fileParams).createReadStream();
      var extract = tars.extract();
      extract.on('warn', (e) => {console.log(e)})
      extract.on('entry', (header, inputStream, next) => {
        if (header.type === 'directory') {
          fs.mkdir(path.join(source_dir, '_posts', header.name), {recursive:true}, (err) => {
            inputStream.resume()
            if (err) return console.error(err);
            console.log('Directory created ' + header.name);
            next()
          })
        } else {
          inputStream.pipe(fs.createWriteStream(path.join(source_dir, '_posts', header.name)));
          inputStream.on('error', (e) => {console.log(e)})
          inputStream.on('end', () => {
            next()
          });
          inputStream.resume();
        }
      });

      extract.on('finish', () => {
        console.log('Finished download ' + outputPath)
      });
      s3ReadStream
        .pipe(zlib.createGunzip())
        .pipe(extract);
    });
  }
}
