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
  this.timeout(10000);
  before(async () => {    
    //nock
    this.apiNock = nock('https://blog.always-onward.com')
      .persist()
      .get('/api/auth/refresh')
      .reply(200, JSON.stringify(testData.logged_out))
      .get('/api/get_comments?post=test.md')
      .reply(200, JSON.stringify([{author: "me", content: "fun post"}]))
      .get('/test_page/mapfile.geojson')
      .replyWithFile(200, path.resolve('./test/map.geojson'))
      .get('/api/userInfo')
      .reply(200, JSON.stringify({googleApiKey: "test"}))
      .get('/api/plan/weather/47.6062/-122.3493?start_date=2-7-2022&finish_date=2-11-2022')
      .reply(200, testData.weather);
      
    nock('https://api.mapbox.com')
      .persist()
      .get('/mapbox-gl-js/v2.6.1/mapbox-gl.js')
      .reply(200, '');   
      
    nock('https://cdn.jsdelivr.net')
      .persist()
      .get('/npm/litepicker/dist/css/litepicker.css')
      .reply(200, '')
      .get('/npm/litepicker/dist/litepicker.js')
      .reply(200, '');
      
    nock('https://maps.googleapis.com')
      .persist()
      .get('/maps/api/js?key=test&libraries=places&callback=initAutocomplete')
      .reply(200, '');
      
    nock.emitter.on("no match", (req) => {
      console.log(req)
      assert(false, 'application failure: no match')
    });
    
    this.Litepicker = Litepicker;
    
    class GeoCoderMock {
      geocode(params, callback) {
        expect(params.address).to.equal(document.getElementById('where').value);
        callback([{geometry: {location: {
          lat: () => '47.6062',
          lng: () => '-122.3493'
        }}}], 'OK');
        return true
      }
    };
    class AutocompleteMock {
      addListener(type, callback) {
        expect(type).to.equal('place_changed');
        expect(callback).to.be.a('function');
        return true
      }
      getPlace(params) {
        return true
      }
    };
    this.google = {maps: {
      Geocoder: sinon.fake.returns(new GeoCoderMock()),
      places: { 
        Autocomplete: sinon.fake.returns(new AutocompleteMock())
      }
    }};
    
    class Map {
      on(params, callback) {
        expect(params).to.equal('load');
        callback();
        return true
      }
      addSource(params) {
        return true
      }
      addControl(params) {
        return true
      }
      addLayer(params) {
        return true
      }
      setTerrain(params) {
        return true
      }
    };
    class mockClass {};
    this.mapboxgl = {
      Map: sinon.fake.returns(new Map()),
      NavigationControl: sinon.fake.returns(new mockClass())
    };
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
         href: 'https://blog.always-onward.com/test_page/'
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
    it('Datepicker - happy path', async () => {
      document.body.innerHTML = fs.readFileSync(path.resolve('./content/plan.html'));
      const res = await pageLoad("test.md", {Litepicker: this.Litepicker, google: this.google} )
      // Check that user isn't logged in
      expect(res.status.login).to.equal(false);
      expect(res.status.redirect_url).to.contain('https');
      expect(res.comments).to.be.false;
      expect(res.set_comments).to.be.false;
      //~ expect(res.plan).to.be.true;
      expect(res.gallery).to.be.false;
      expect(res.maps).to.be.false;
      expect(document.getElementById('when').value).to.equal('');
      document.getElementsByClassName('day-item')[6].click();
      document.getElementsByClassName('day-item')[9].dispatchEvent(new MouseEvent("mouseover"));
      document.getElementsByClassName('day-item')[10].click();
      expect(document.getElementById('when').value).to.have.lengthOf(23);
      expect(document.getElementById('when').value[4]).to.equal('-');
    });
    it('Autocomplete & Geocode - happy path', async () => {
      document.body.innerHTML = fs.readFileSync(path.resolve('./content/plan.html'));
      window.google = this.google;
      const res = await pageLoad("test.md", {Litepicker: this.Litepicker} )
      res.plan.initAutocomplete();
      expect(this.google.maps.places.Autocomplete.firstArg).to.equal(document.getElementById('where'));
      expect(this.google.maps.places.Autocomplete.lastArg.types[0]).to.equal('geocode');
      
      document.getElementById('where').value = 'Tacoma, Wa'
      document.getElementsByClassName('day-item')[6].click();
      document.getElementsByClassName('day-item')[10].click();
      res.plan.codeAddress();
      await window.weather;
      console.log(document.getElementById("weather").innerHTML);
      expect(document.getElementById("weather").innerHTML).to.contain('<img class="forecast-section__icon" src="https://api.weather.gov/icons/land/day/snow,30?size=medium" alt="Chance Light Snow">');
    });
  });
  
  describe('test map', () => {
    it('/login happy path (page with map)', async () => {
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
      
      const res = await pageLoad("test.md", {mapboxgl: this.mapboxgl});
      // Check that user isn't logged in
      expect(res.status.login).to.equal(false);
      expect(res.status.redirect_url).to.contain('https');
      
      expect(this.mapboxgl.Map.firstArg).to.have.keys('pitch','bearing','attributionControl','logoPosition','style','zoom','center','container');
      expect(this.mapboxgl.Map.firstArg.container).to.equal('mapfile');
      expect(this.mapboxgl.Map.firstArg.center[0]).to.equal(-123.50920635934256);
      expect(this.mapboxgl.Map.firstArg.center[1]).to.equal(47.97225472382581);
      expect(res.maps.length).to.equal(1)
      const map = await res.maps[0];
      expect(map).to.have.keys(['map', 'map_distance', 'map_time', 'map_elevation']);
      expect(map.map_distance.innerHTML).to.equal('3.24 mi');
      expect(map.map_time.innerHTML).to.equal('2h 10m');
      expect(map.map_elevation.innerHTML).to.equal('375 ft');
    });
  });
});


