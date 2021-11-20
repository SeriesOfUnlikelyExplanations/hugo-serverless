const Parser = require('rss-parser');
const htmlToText = require('html-to-text')
const mustacheMjml  = require('mustache.mjml')
const fs = require('fs')
var { SiteChecker } = require("broken-link-checker");

async function checkBrokenLinks(site) {
  //Crawl the site for broken links
  const uniqueLinks = await new Promise((resolve, reject) => {
  let brokenLinks = []
  const _siteChecker = new SiteChecker({ excludedKeywords: ["gaiagps.com", "amazon.com"] },
    {
      "error": error => reject,
      "link": (result, customData) => {if (result.broken) { brokenLinks.push(result.url.original) }},
      "end": () => resolve([...new Set(brokenLinks)])
    }
  );
  return _siteChecker.enqueue(site)
  })
};

async function sendEmail(site) {
  //Send an email to either me (if there are broken links) or to everyone with a link to the new post
  var html, toEmail, subject
  var emailParams = { Source: ssmData.Parameters.find(p => p.Name === '/AlwaysOnward/noReplyEmail').Value };
  console.log('Broken Links:')
  console.log(uniqueLinks)
  if (uniqueLinks.length === 0) {
    //create email for everyone
    let parser = new Parser({ customFields: {item: ['image','subtitle']}});

    let feed = await parser.parseURL('https://' + ssmData.Parameters.find(p => p.Name === '/OnwardBlog/siteName').Value + '/atom.xml');
    const { template, errors } = mustacheMjml(fs.readFileSync('./template.mjml').toString());
    console.log('template warnings', errors);

    html = template(feed);

    const ddb = new AWS.DynamoDB({signatureVersion: 'v4', region: event.awsRegion})
    toEmail = await ddb.getItem({
      Key: { 'listId': {'S': 'OnwardBlog' } },
      TableName: ssmData.Parameters.find(p => p.Name === '/AlwaysOnward/emailsTable').Value
    }).promise().then((r) => r.Item.emails.L.map(a => a.M.email.S))

    subject = 'Always-Onward - a new Blog Post is available to view';
  } else {
    html = "Blog has broken links - blog email not sent<br><br>" + uniqueLinks.join('<br>');
    toEmail = [ ssmData.Parameters.find(p => p.Name === '/AlwaysOnward/myEmail').Value ]
    subject = 'Broken Links';
  }
  console.log(html);
  //send the email
  emailParams.Message = {
    Body: { /* required */
      Html: {
        Charset: "UTF-8",
        Data: html
      },
      Text: {
        Charset: "UTF-8",
        Data: htmlToText.fromString(html, { wordwrap: 130 })
      }
    },
    Subject: {
      Charset: 'UTF-8',
      Data: subject
    }
  }
  if (event.sendEmail == 'Y') {
    for (const email of toEmail) {
      emailParams.Destination = { ToAddresses: [ email ]}
      await new AWS.SES().sendEmail(emailParams).promise().then((data) => {
        console.log(data.MessageId);
      }).catch((err) => {
        console.error(err, err.stack);
      });
    }
  }
};

module.exports = {
  start_datasync,
  checkBrokenLinks
};
