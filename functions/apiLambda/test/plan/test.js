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
  expect(body.html.replace(/ /g,'').replace(/\n/g,'')).to.equal(`<divclass="forecast-wrapper">
    <divclass="forecast-day">
    <strongclass="forecast-section__name">Sunday</strong>
    <table><tbody><tr>
    <td><imgclass="forecast-section__icon"src="https://api.weather.gov/icons/land/day/rain,90?size=medium"alt="LightRain"></td>
    <td><imgclass="forecast-section__icon"src="https://api.weather.gov/icons/land/night/rain,70/rain,40?size=medium"alt="LightRainLikely"></td>
    </tr><tr>
    <divclass="forecast-section__title">Day</div>
    <divclass="forecast-section__title">Night</div>
    </tr><tr>
    <divclass="forecast-section__temp">47&deg;F</div>
    <divclass="forecast-section__temp">37&deg;F</div>
    </tr><tr>
    <divclass="forecast-section__short">LightRain</div>
    <divclass="forecast-section__short">LightRainLikely</div>
    </tr><tr>
    <divclass="forecast-section__wind">Wind:8to17mphS</div>
    <divclass="forecast-section__wind">Wind:5to17mphESE</div>
    </tr></table></tbody>
    </div>
    <pclass="forecast-credits">Forecastprovidedbythe<ahref="https://www.weather.gov/">NationalWeatherService</a>.</p>
  `.replace(/ /g,'').replace(/\n/g,''));
});

it('/weather_with_dates', async () => {
  const res = await index.handler(reqData.weather_with_dates, {})
    .catch(err => assert(false, 'application failure: '.concat(err)));
  expect(res.statusCode).to.equal(200);
  const body = JSON.parse(res.body);
  expect(body.json.length).to.equal(14);
  expect(body.html.replace(/ /g,'').replace(/\n/g,'')).to.equal(`<divclass="forecast-wrapper">
  <divclass="forecast-day">
  <strongclass="forecast-section__name">Tuesday</strong>
  <table><tbody><tr>
  <td><imgclass="forecast-section__icon"src="https://api.weather.gov/icons/land/day/rain,30/rain,20?size=medium"alt="ChanceLightRain"></td>
  <td><imgclass="forecast-section__icon"src="https://api.weather.gov/icons/land/night/bkn/snow?size=medium"alt="MostlyCloudythenChanceLightSnow"></td>
  </tr><tr>
  <divclass="forecast-section__title">Day</div>
  <divclass="forecast-section__title">Night</div>
  </tr><tr>
  <divclass="forecast-section__temp">42&deg;F</div>
  <divclass="forecast-section__temp">33&deg;F</div>
  </tr><tr>
  <divclass="forecast-section__short">ChanceLightRain</div>
  <divclass="forecast-section__short">MostlyCloudythenChanceLightSnow</div>
  </tr><tr>
  <divclass="forecast-section__wind">Wind:3to8mphNW</div>
  <divclass="forecast-section__wind">Wind:2to8mphENE</div>
  </tr></table></tbody>
  <divclass="forecast-day">
  <strongclass="forecast-section__name">Wednesday</strong>
  <table><tbody><tr>
  <td><imgclass="forecast-section__icon"src="https://api.weather.gov/icons/land/day/snow?size=medium"alt="ChanceLightSnow"></td>
  <td><imgclass="forecast-section__icon"src="https://api.weather.gov/icons/land/night/snow?size=medium"alt="ChanceRainAndSnow"></td>
  </tr><tr>
  <divclass="forecast-section__title">Day</div>
  <divclass="forecast-section__title">Night</div>
  </tr><tr>
  <divclass="forecast-section__temp">41&deg;F</div>
  <divclass="forecast-section__temp">35&deg;F</div>
  </tr><tr>
  <divclass="forecast-section__short">ChanceLightSnow</div>
  <divclass="forecast-section__short">ChanceRainAndSnow</div>
  </tr><tr>
  <divclass="forecast-section__wind">Wind:5mphSSE</div>
  <divclass="forecast-section__wind">Wind:3mphS</div>
  </tr></table></tbody></div>
  <pclass="forecast-credits">Forecastprovidedbythe<ahref="https://www.weather.gov/">NationalWeatherService</a>.</p>
  `.replace(/ /g,'').replace(/\n/g,''));
});
