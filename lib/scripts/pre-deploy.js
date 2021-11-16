//~ const yaml = require('js-yaml');
//~ const fs = require('fs')
//~ const AWS = require('aws-sdk');

//~ const configFile = 'vpclambda/_config.yml'

//~ let doc = yaml.load(fs.readFileSync(configFile, 'utf8'));

//~ doc.source_dir = '/mnt/hexo/source';
//~ doc.public_dir = '/mnt/hexo/public';

//~ fs.writeFile(configFile, yaml.dump(doc), (err) => {
    //~ if (err) {
        //~ console.log(err);
    //~ }
//~ });



//~ var cloudwatchlogs = new AWS.CloudWatchLogs();
//~ var params = {
  //~ logGroupName: 'STRING_VALUE' /* required */
//~ };
//~ cloudwatchlogs.deleteLogGroup(params, function(err, data) {
  //~ if (err) console.log(err, err.stack); // an error occurred
  //~ else     console.log(data);           // successful response
//~ });
