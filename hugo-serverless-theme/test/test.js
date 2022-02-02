var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");
const jsdom = require('jsdom');
const JSDOM = jsdom.JSDOM;
const fs = require('fs');
const path = require('path');

const resData = require('./responseTestData.js');

var dom, window, document;
before(async function () {
  //setup the jsdom stuff
  const virtualConsole = new jsdom.VirtualConsole();
  virtualConsole.sendTo(console);
  dom = new JSDOM('',{ 
    url: "https://blog.always-onward.com/",
    referrer: "https://blog.always-onward.com/",
    runScripts: "dangerously", 
    resources: "usable" 
  })
  window = dom.window;
  document = dom.window.document;
  
  //load functions
  await new Promise((resolve, reject) => {
    var func = document.createElement('script');
    func.innerHTML = fs.readFileSync(path.resolve(__dirname, '../static/js/functions.js'))
    func.onload = () => { resolve() }
    document.body.appendChild(func);
  });
  
  //load mapbox
  window.URL.createObjectURL = function() {};
  await new Promise((resolve, reject) => {
    func = document.createElement('script');
    func.src = 'https://api.mapbox.com/mapbox-gl-js/v2.6.1/mapbox-gl.js'
    func.onload = () => { resolve() }
    document.body.appendChild(func);
  });
  //nock
  nock('https://blog.always-onward.com')
    .persist()
    .get('/api/auth/refresh')
    .reply(200, JSON.stringify(resData.logged_out));
  nock.emitter.on("no match", (req) => {
    console.log(req)
    assert(false, 'application failure: no match')
  })
  
  await window.eval(`new Promise(function (resolve) {
    if (document.readyState != "loading") {
      return resolve();
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        return resolve();
      });
    }
   });`);
})

//~ load_maps()
//~ loadComments(file_path)
//~ const res = await login()
//~ console.log(res);
//~ setComments(res);
//~ plan()

it('/login happy path (page with comments)', async () => {
  document.body.innerHTML = fs.readFileSync(path.resolve(__dirname, '../layouts/partials/post-comments.html'));
  const res = await window.eval('pageLoad("test.md")');
  
  // Check that user isn't logged in
  expect(res.status.login).to.equal(false);
  expect(res.status.redirect_url).to.contain('https');
  expect(document.getElementById('write-comment').hidden).to.equal(false);
  
  // check that comments block was updated
  console.log(document.getElementById('write-comment').innerHTML);
  expect(document.getElementById('write-comment').innerHTML).to.contain('Login to leave a comment!');
  expect(document.getElementById('write-comment').innerHTML).to.contain('href="https://auth.always-onward.com');
  
  // Check that there weren't any 
  
});
