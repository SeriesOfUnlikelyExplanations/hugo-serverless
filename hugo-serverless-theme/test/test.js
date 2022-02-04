import 'jsdom-global/register.js'
import jsdom from 'jsdom-global'
import assert from 'assert';
import chai from 'chai';
import chaiNock from 'chai-nock';
chai.use(chaiNock);
const expect = chai.expect;
import nock from 'nock';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';

import { Litepicker } from 'litepicker';

import testData from './testData.js';
import { pageLoad } from '../static/js/functions.js';

describe('Testing frontend js', function() {
  this.timeout(1000);
  before(() => {    
    //nock
    this.apiNock = nock('https://blog.always-onward.com')
      .persist()
      .get('/api/auth/refresh')
      .reply(200, JSON.stringify(testData.logged_out))
      .get('/api/get_comments?post=test.md')
      .reply(200, JSON.stringify([{author: "me", content: "fun post"}]))
      .get('/test_page/mapfile.geojson')
      .replyWithFile(200, path.resolve('./test/map.geojson')); 
      
    nock('https://api.mapbox.com')
      .persist()
      .get('/mapbox-gl-js/v2.6.1/mapbox-gl.js')
      .reply(200, fs.readFileSync(path.resolve('./test/scripts/mapboxgl.js')).toString());   
      
    nock('https://cdn.jsdelivr.net')
      .persist()
      .get('/npm/litepicker/dist/css/litepicker.css')
      .reply(200, '');
      //~ .get('/npm/litepicker/dist/litepicker.js')
      //~ .reply(200, fs.readFileSync(path.resolve('./test/litepicker.js')).toString());
      
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
      resources: "usable"
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
    window.close();
    this.jsdom();
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
      expect(document.getElementById('write-comment').innerHTML).to.contain('Login to leave a comment!');
      expect(document.getElementById('write-comment').innerHTML).to.contain('href="https');
      
      expect(res.maps).to.be.false;
      expect(res.comments).to.equal('<article class="read-next-card"><div><b style="color:firebrick">me</b> says:</div><div>fun post</div></article>');
      expect(res.set_comments).to.equal('Needs to Login');
      expect(res.plan).to.be.false;
      expect(res.gallery).to.be.false;
    });
    it('post comment', async () => {
      const postNock = nock('https://blog.always-onward.com')
        .post('/api/post_comment', (body) => {
          expect(body.postPath).to.equal('test.md');
          expect(body.content).to.equal('');
          console.log(body);
          return body;
        })
        .reply(200, '')
      this.apiNock.interceptors.find(({uri}) =>  uri === '/api/auth/refresh').body = JSON.stringify(testData.logged_in);
      
      document.body.innerHTML = fs.readFileSync(path.resolve('./layouts/partials/post-comments.html')).toString().replace('{{ .File.Path }}','test.md');
      const res = await pageLoad("test.md")
      
      document.querySelector('#post_comment').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(postNock).to.have.been.requested;
      
      this.apiNock.interceptors.find(({uri}) =>  uri == '/api/auth/refresh').body = JSON.stringify(testData.logged_out);
    });
  });
  
  describe('test gallery', () => {
    it('Gallery - happy path', async () => {
      document.body.innerHTML = testData.gallery_html
      const res = await pageLoad("test.md")
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
      // cleanup
      res.gallery.intervals.forEach((interval) => {
        clearInterval(interval);
      });
    });
    it('Gallery - test left/right click)', async () => {
      document.body.innerHTML = testData.gallery_html
      const res = await pageLoad("test.md")
      document.querySelector('.next').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(res.gallery.carousels[0].innerHTML).to.contain('<li class="selected"><a href="#c0_slide2"></a></li>');
      document.querySelector('.next').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(res.gallery.carousels[0].innerHTML).to.contain('<li class="selected"><a href="#c0_slide1"></a></li>');
      document.querySelector('.prev').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(res.gallery.carousels[0].innerHTML).to.contain('<li class="selected"><a href="#c0_slide2"></a></li>');
      document.querySelector('.prev').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(res.gallery.carousels[0].innerHTML).to.contain('<li class="selected"><a href="#c0_slide1"></a></li>');
      // cleanup
      res.gallery.intervals.forEach((interval) => {
        clearInterval(interval);
      });
    });
    it('Gallery - test left/right key)', async () => {
      document.body.innerHTML = testData.gallery_html;
      const res = await pageLoad("test.md")
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(res.gallery.carousels[0].innerHTML).to.contain('<li class="selected"><a href="#c0_slide2"></a></li>');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      expect(res.gallery.carousels[0].innerHTML).to.contain('<li class="selected"><a href="#c0_slide1"></a></li>');
      // cleanup
      res.gallery.intervals.forEach((interval) => {
        clearInterval(interval);
      });
    });
    it('Gallery - test left/right key)', async () => {
      document.body.innerHTML = testData.gallery_html;
      const res = await pageLoad("test.md")
      await new Promise((resolve) => {setTimeout(resolve, 150)});
      expect(res.gallery.carousels[0].innerHTML).to.contain('<li class="selected"><a href="#c0_slide2"></a></li>');

      // cleanup
      res.gallery.intervals.forEach((interval) => {
        clearInterval(interval);
      });
    });
  });
  
  describe('test plan', () => {
    it('Plan - happy path', async () => {
      document.body.innerHTML = fs.readFileSync(path.resolve('./content/plan.html'));
      const res = await pageLoad("test.md", {Litepicker: Litepicker} )
      console.log(res);
      // Check that user isn't logged in
      expect(res.status.login).to.equal(false);
      expect(res.status.redirect_url).to.contain('https');
      expect(res.comments).to.be.false;
      expect(res.set_comments).to.be.false;
      expect(res.plan).to.be.true;
      expect(res.gallery).to.be.false;
      expect(res.maps).to.be.false;
      
    });
  });
  
  describe('test map', () => {
    xit('/login happy path (page with map)', async () => {
      document.body.innerHTML = `<div class="map" id="mapfile"></div>
      <table class="map_table">
        <tbody><tr>
          <td>
            <img src="/images/distance.png">
            <div id="mapfile_distance"></div>
          </td>
          <td id="mapfile_time"></td> 
          <td>
            <img src="/images/elevation.png">
            <div id="mapfile_elevation"></div>
          </td>
        </tr>
      </tbody></table>`
      
      window.URL.createObjectURL = function() {};
      await new Promise((resolve, reject) => {
        const func = document.createElement('script');
        func.src = 'https://api.mapbox.com/mapbox-gl-js/v2.6.1/mapbox-gl.js'
        func.onload = () => { resolve() }
        document.body.appendChild(func);
      });
      const res = await pageLoad("test.md")
      console.log(res);
      // Check that user isn't logged in
      expect(res.status.login).to.equal(false);
      expect(res.status.redirect_url).to.contain('https');

      expect(res.maps.length).to.equal(1)
      //~ expect(res.maps[0]).to.have.keys(['map', 'map_distance', 'map_time', 'map_elevation']);
      expect(res.comments).to.equal('<article class="read-next-card"><div><b style="color:firebrick">me</b> says:</div><div>fun post</div></article>');
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



