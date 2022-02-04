var assert = require('assert');
var expect = require('chai').expect;
const nock = require('nock');
const sinon = require("sinon");
const verifier = require('@southlane/cognito-jwt-verifier')
const AWS = require('aws-sdk')
const DynamoDB = AWS.DynamoDB;

var index = require('../../index');

const reqData = require('./requestTestData.js');
const resData = require('./responseTestData.js');

nock('https://api.weather.gov')
  .persist()
  .get('/points/47.6062,-122.3321')
  .reply(200, JSON.stringify(resData.lookupPoint))
  .get('/gridpoints/SEW/124,67/forecast')
  .reply(200, JSON.stringify(resData.getForecast))

it('/weather', async () => {
  const res = await index.handler(reqData.weather, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  const body = JSON.parse(res.body);
  expect(body.json.length).to.equal(14);
  expect(body.html.replace(/ /g,'').replace(/\n/g,'')).to.equal(`<div class="forecast-wrapper">
    <div class="forecast-day">
    <div class="forecast-section forecast-section--day">
      <strong class="forecast-section__name">Today</strong>
      <img class="forecast-section__icon" src="https://api.weather.gov/icons/land/day/bkn?size=medium" alt="Mostly Cloudy">
      <div class="forecast-section__temp">48&deg; F</div>
      <div class="forecast-section__short">Mostly Cloudy</div>
      <div class="forecast-section__wind">Wind: 7 mph SSE</div>
    </div>
    <div class="forecast-section forecast-section--night">
    <strong class="forecast-section__name">Tonight</strong>
    <img class="forecast-section__icon" src="https://api.weather.gov/icons/land/night/rain,50/rain,90?size=medium" alt="Light Rain">
    <div class="forecast-section__temp">43&deg; F</div>
    <div class="forecast-section__short">Light Rain</div>
    <div class="forecast-section__wind">Wind: 6 to 9 mph S</div>
    </div>
    </div>
    </div>
    <p class="forecast-credits">Forecast provided by the <a href="https://www.weather.gov/">National Weather Service</a>.</p>
  `.replace(/ /g,'').replace(/\n/g,''));
});

it('/weather_with_dates', async () => {
  const res = await index.handler(reqData.weather_with_dates, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  const body = JSON.parse(res.body);
  expect(body.json.length).to.equal(14);
  expect(body.html.replace(/ /g,'').replace(/\n/g,'')).to.equal(`<div class="forecast-wrapper">
    <div class="forecast-day">
    <div class="forecast-section forecast-section--day">
      <strong class="forecast-section__name">Today</strong>
      <img class="forecast-section__icon" src="https://api.weather.gov/icons/land/day/bkn?size=medium" alt="Mostly Cloudy">
      <div class="forecast-section__temp">48&deg; F</div>
      <div class="forecast-section__short">Mostly Cloudy</div>
      <div class="forecast-section__wind">Wind: 7 mph SSE</div>
    </div>
    <div class="forecast-section forecast-section--night">
    <strong class="forecast-section__name">Tonight</strong>
    <img class="forecast-section__icon" src="https://api.weather.gov/icons/land/night/rain,50/rain,90?size=medium" alt="Light Rain">
    <div class="forecast-section__temp">43&deg; F</div>
    <div class="forecast-section__short">Light Rain</div>
    <div class="forecast-section__wind">Wind: 6 to 9 mph S</div>
    </div>
    </div>
    </div>
    <p class="forecast-credits">Forecast provided by the <a href="https://www.weather.gov/">National Weather Service</a>.</p>
  `.replace(/ /g,'').replace(/\n/g,''));
});
