const Parser = require('rss-parser');
const htmlToText = require('html-to-text')
const mustacheMjml  = require('mustache.mjml')
const fs = require('fs')

async function checkBrokenLinks(SiteChecker, site) {
  //Crawl the site for broken links
  return await new Promise((resolve, reject) => {
    let brokenLinks = []
    const _siteChecker = new SiteChecker({ excludedKeywords: ["gaiagps.com", "amazon.com"] },
      {
        "error": error => reject,
        "link": (result, customData) => {if (result.broken) { brokenLinks.push(result.url.original) }},
        "end": () => resolve([...new Set(brokenLinks)])
      }
    );
    _siteChecker.enqueue(site)
  })
};

async function sendEmail(uniqueLinks, site, email, ses) {
  //Send an email to either me (if there are broken links) or to everyone with a link to the new post
  var html, toEmail, subject
  var emailParams = { Source: email.fromEmail };
  if (uniqueLinks.length === 0) {
    //create email for everyone
    console.log('Parsing RSS feed for email...');
    let parser = new Parser({ customFields: {item: ['featureImage']}});

    let feed = await parser.parseURL(site + '/index.xml');
    console.log(feed);
    const { template, errors } = mustacheMjml(fs.readFileSync('./template.mjml').toString());
    console.log('template warnings', errors);

    html = template(feed);
    toEmail = [ email.adminEmail ] // email.toEmail
    subject = 'Always-Onward - a new Blog Post is available to view';
  } else {
    html = "Blog has broken links - blog email not sent<br><br>" + uniqueLinks.join('<br>');
    toEmail = [ email.adminEmail ]
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
  for (const email of toEmail) {
    emailParams.Destination = { ToAddresses: [ email ]}
    await ses.sendEmail(emailParams).promise().then((data) => {
      console.log(data.MessageId);
    }).catch((err) => {
      console.error(err, err.stack);
    });
  }
};

async function invalidate(cf, distId) {
  async function _check(cf, distId, id) {
    const r = await cf.getInvalidation({ 
      DistributionId: distId, Id: id 
    }).promise()
    console.log(r);
    if (r.Invalidation && r.Invalidation.Status === 'Completed') {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    return _check(cf, distId, id)
  }
  const r = await cf.createInvalidation({
    DistributionId: distId,
    InvalidationBatch: {
      CallerReference: new Date().toISOString(),
      Paths: {
        Quantity: '1',
        Items: [
          '/*'
        ]
      }
    }
  }).promise();
  if (!r.Invalidation) {
    console.log(r)
    throw new Error('Bad response')
  }
  return await _check(cf, distId, r.Invalidation.Id)
}


module.exports = {
  sendEmail,
  checkBrokenLinks,
  invalidate
};
