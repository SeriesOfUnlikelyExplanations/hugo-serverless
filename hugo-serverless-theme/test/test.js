import 'jsdom-global/register.js'
import jsdom from 'jsdom-global'
import assert from 'assert';
import { expect } from 'chai';
import nock from 'nock';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';

import resData from './responseTestData.js';
import { pageLoad } from '../static/js/functions.js';

describe('Testing frontend js', function() {
  this.timeout(1000);
  before(function () {
    //load mapbox - Not sure why this isn't loading from URL. It loads from the local file.
    //~ window.URL.createObjectURL = function() {};
    //~ await new Promise((resolve, reject) => {
      //~ const func = document.createElement('script');
      //~ func.src = 'https://api.mapbox.com/mapbox-gl-js/v2.6.1/mapbox-gl.js'
      //~ func.onload = () => { resolve() }
      //~ document.body.appendChild(func);
    //~ });
    
    //nock
    nock('https://blog.always-onward.com')
      .persist()
      .get('/api/auth/refresh')
      .reply(200, JSON.stringify(resData.logged_out))
      .get('/api/get_comments?post=test.md')
      .reply(200, JSON.stringify([]))
      .get('/test_page/mapfile.geojson')
      .replyWithFile(200, path.resolve('./test/map.geojson')); 
      //[{author: "me", content: "fun post"}]
      
    nock.emitter.on("no match", (req) => {
      console.log(req)
      assert(false, 'application failure: no match')
    })
  });
  beforeEach(() => {
    //setup the jsdom stuff
    this.jsdom = jsdom('',{ 
      url: "https://blog.always-onward.com",
      referrer: "https://blog.always-onward.com",
      runScripts: "dangerously", 
      resources: "usable",
      done: function (errors, window) {
        window.close(); 
      }
    })
    delete window.location
    Object.defineProperty(window, "location", {
      value: {
         href: 'https://blog.always-onward.com/test_page'
      },
      writable: true
    });
  })
  afterEach(() => {
    document.body.innerHTML = '';
  });
  describe('test comments', () => {
    it('/login happy path (page with comments)', async () => {
      document.body.innerHTML = fs.readFileSync(path.resolve('./layouts/partials/post-comments.html'));
      const res = await pageLoad("test.md")
      // Check that user isn't logged in
      expect(res.status.login).to.be.false;
      expect(res.status.redirect_url).to.contain('https');
      expect(document.getElementById('write-comment').hidden).to.be.false;
      
      // check that comments block was updated
      console.log(document.getElementById('write-comment').innerHTML);
      expect(document.getElementById('write-comment').innerHTML).to.contain('Login to leave a comment!');
      expect(document.getElementById('write-comment').innerHTML).to.contain('href="https');
      
      expect(res.maps).to.be.false;
      expect(res.comments).to.equal('');
      expect(res.set_comments).to.equal('Needs to Login');
      expect(res.plan).to.be.false;
      expect(res.gallery).to.be.false;
    });
  });
  
  describe('test gallery', () => {
    it('/login happy path (page with gallery)', async () => {
      document.body.innerHTML = `<div id="carousel0" class="carousel" duration="10" items="1">
          <ul>
                <li id="c0_slide1" style="min-width: 100%; padding-bottom: 500px"><img src="ready1.jpg" alt=""></li>
                <li id="c0_slide2" style="min-width: 100%; padding-bottom: 500px"><img src="ready2.jpg" alt=""></li> 
          </ul>
          <ol>
              <li><a href="#c0_slide1"></a></li>
              <li><a href="#c0_slide2"></a></li>
          </ol>
          <div class="prev">‹</div>
          <div class="next">›</div>
      </div>
      `
      const res = await pageLoad("test.md")
      console.log(res);
      // Check that user isn't logged in
      expect(res.status.login).to.be.false;
      expect(res.status.redirect_url).to.contain('https');
      
      expect(res.maps).to.be.false;
      expect(res.comments).to.be.false;
      expect(res.set_comments).to.be.false;
      expect(res.plan).to.be.false;
      expect(res.gallery.carousels.length).to.equal(1);
      expect(res.gallery.carousels[0].innerHTML.replace(/ *|\n|\t/gm, "").trim()).to.equal(`<ul>
                <li id="c0_slide1" style="min-width: 100%; padding-bottom: 500px"><img src="ready1.jpg" alt=""></li>
                <li id="c0_slide2" style="min-width: 100%; padding-bottom: 500px"><img src="ready2.jpg" alt=""></li>
          </ul>
          <ol>
              <li class="selected"><a href="#c0_slide1"></a></li>
              <li><a href="#c0_slide2"></a></li>
          </ol>
          <div class="prev" style="display: block;">‹</div>
          <div class="next" style="display: block;">›</div>`.replace(/ *|\n|\t/gm, ""));
      // interact with left and right button
      
      document.querySelector('.next').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(res.gallery.carousels[0].innerHTML).to.contain('<li class="selected"><a href="#c0_slide2"></a></li>');
      document.querySelector('.prev').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(res.gallery.carousels[0].innerHTML).to.contain('<li class="selected"><a href="#c0_slide1"></a></li>');
      // cleanup
      res.gallery.intervals.forEach((interval) => {
        clearInterval(interval);
      });
    });
  });
  describe('test map', () => {
    it('/login happy path (page with map)', async () => {
      document.body.innerHTML = `<div class="map" id="mapfile"></div>
      <table class="map_table">
        <tbody><tr>
          <td>
            <img src="/images/distance.png">
            <div id="hurricane-ridge_distance"></div>
          </td>
          <td id="hurricane-ridge_time"></td> 
          <td>
            <img src="/images/elevation.png">
            <div id="hurricane-ridge_elevation"></div>
          </td>
        </tr>
      </tbody></table>
      `
      const res = await pageLoad("test.md")
      console.log(res);
      // Check that user isn't logged in
      expect(res.status.login).to.equal(false);
      expect(res.status.redirect_url).to.contain('https');

      expect(res.maps).to.be.false;
      expect(res.comments).to.equal('');
      expect(res.set_comments).to.equal('Needs to Login')
      expect(res.plan).to.be.false;
      expect(res.gallery).to.be.false;
    });
  });
});


  

  //~ const res = {}
  //~ res.maps = load_maps()
  //~ res.comments = loadComments(file_path)
  //~ res.status = await login()
  //~ console.log(res.status);
  //~ res.set_comments = setComments(res.status);
  //~ res.plan = plan()
  //~ return res



