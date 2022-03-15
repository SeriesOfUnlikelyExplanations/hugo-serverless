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
  .get('/points/47.60628,-122.33218')
  .reply(301,undefined,{location:"https://api.weather.gov/points/47.6062,-122.3321"})
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
      <div class="forecast-sectionforecast-section--day">
        <strong class="forecast-section__name">Sunday</strong>
        <img class="forecast-section__icon"src="https://api.weather.gov/icons/land/day/rain,90?size=medium"alt="LightRain">
        <div class="forecast-section__temp">47&deg;F</div>
        <div class="forecast-section__short">LightRain</div>
        <div class="forecast-section__wind">Wind:8to17mphS</div>
      </div>
      <div class="forecast-sectionforecast-section--night">
        <strong class="forecast-section__name">SundayNight</strong>
        <img class="forecast-section__icon"src="https://api.weather.gov/icons/land/night/rain,70/rain,40?size=medium"alt="LightRainLikely">
        <div class="forecast-section__temp">37&deg;F</div>
        <div class="forecast-section__short">LightRainLikely</div>
        <div class="forecast-section__wind">Wind:5to17mphESE</div>
      </div>
    </div>
  </div><p class="forecast-credits">Forecast provided by the <ahref="https://www.weather.gov/">NationalWeatherService</a>.</p>
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
      <div class="forecast-sectionforecast-section--day">
        <strong class="forecast-section__name">Tuesday</strong>
        <img class="forecast-section__icon" src="https://api.weather.gov/icons/land/day/rain,30/rain,20?size=medium"alt="ChanceLightRain">
        <div class="forecast-section__temp">42&deg;F</div>
        <div class="forecast-section__short">ChanceLightRain</div>
        <div class="forecast-section__wind">Wind:3to8mphNW</div>
      </div>
      <div class="forecast-sectionforecast-section--night">
        <strong class="forecast-section__name">TuesdayNight</strong>
        <img class="forecast-section__icon" src="https://api.weather.gov/icons/land/night/bkn/snow?size=medium"alt="MostlyCloudythenChanceLightSnow">
        <div class="forecast-section__temp">33&deg;F</div>
        <div class="forecast-section__short">MostlyCloudythenChanceLightSnow</div>
        <div class="forecast-section__wind">Wind:2to8mphENE</div>
      </div>
    </div>
    <div class="forecast-day">
      <div class="forecast-sectionforecast-section--day">
        <strongclass="forecast-section__name">Wednesday</strong>
        <img class="forecast-section__icon" src="https://api.weather.gov/icons/land/day/snow?size=medium"alt="ChanceLightSnow">
        <div class="forecast-section__temp">41&deg;F</div>
        <div class="forecast-section__short">ChanceLightSnow</div>
        <div class="forecast-section__wind">Wind:5mphSSE</div>
      </div>
      <div class="forecast-sectionforecast-section--night">
        <strong class="forecast-section__name">WednesdayNight</strong>
        <img class="forecast-section__icon" src="https://api.weather.gov/icons/land/night/snow?size=medium"alt="ChanceRainAndSnow">
        <div class="forecast-section__temp">35&deg;F</div>
        <div class="forecast-section__short">ChanceRainAndSnow</div>
        <div class="forecast-section__wind">Wind:3mphS</div>
      </div>
    </div>
  </div><p class="forecast-credits">Forecast provided by the <ahref="https://www.weather.gov/">NationalWeatherService</a>.</p>
  `.replace(/ /g,'').replace(/\n/g,''));
});
