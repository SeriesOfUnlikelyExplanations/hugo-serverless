const { httpRequest } = require('../components');

module.exports = (api, opts) => {
  api.get('/weather/:lat/:long', async (req,res) => {
    console.log(req.query);
    console.log((Date.parse(req.query.finish_date) - Date.parse(req.query.start_date))/(24 * 60 * 60 * 1000))
    console.log((Date.parse(req.query.start_date) - new Date())/(24 * 60 * 60 * 1000))
    const fetcher = new ForecastFetcher({
      days: Math.ceil((Date.parse(req.query.finish_date) - Date.parse(req.query.start_date))/(24 * 60 * 60 * 1000)) || 1,
      offset: Math.ceil((Date.parse(req.query.start_date) - new Date())/(24 * 60 * 60 * 1000)) || 1
    });
    const forecast = await fetcher.lookupForecastForLatLng(req.params.lat, req.params.long);
    const forecastNode = fetcher.markupForecast(forecast);
    return res.status(200).json({json: forecast.periods, html: forecastNode});
  })
}

//
// -------  Weather forecast functions  --------
// https://daltonrowe.com/local-forecasts-weather-gov-api.html#
// https://www.weather.gov/documentation/services-web-api
//

async function fetchForecast(lat, long, lengthDays, offsetDays) {
  // fetch data via the nws api
  async function useNWS (route) {
    const options = {
      hostname: this.host,
      port: 443,
      path: route,
      method: 'GET',
      headers: {
        'Accept': 'application/json',  
        'Content-Type': 'application/json',
        'User-Agent': 'ONWARD-ADVENTURES'
      }
    };
    return await httpRequest(options);
  };
  // lookup and provide point information
  const lookupPoint = await useNWS(`/points/${lat},${lng}`);
  console.log(lookupPoint);
  const { cwa, gridX, gridY } = lookupPoint.body.properties;
  // lookup and provide forecast info
  const lookupForecast = await useNWS(`/gridpoints/${cwa}/${gridX},${gridY}/forecast`)
    .then((r) => r.body.properties);
  
  var offsetPeriods = offsetDays*2;
  var lengthPeriods = lengthDays*2;
  const { periods } = lookupForecast;
  const forecastResponse = []
  if (!periods[0].isDaytime) {
    offset += 1;
    days -= 1;
    forecastResponse.append({ night: periods[0] })
  }
  for (let i = offset; i < (offset + days); i += 2) {
    const forecastDay = {
      day: periods[i],
      night: periods[i + 1],
    };
    forecastResponse.append(forecastDay);
  }
}
  

class ForecastFetcher {
  constructor({timeout = 3000, days = 5, offset = 1, host = "api.weather.gov"}) {
    this.host = host;
    this.timeout = timeout;
    this.days = days;
    this.offset = offset;
  }
  renderer = (forecastDay) => {
    const { day, night } = forecastDay;
    return `<div class="forecast-day">   
      <strong class="forecast-section__name">${day.name || night.name}</strong>
      <table><tbody>
        <tr>
          <td><img class="forecast-section__icon" src="${day.icon}" alt="${day.shortForecast}"></td>
          <td><img class="forecast-section__icon" src="${night.icon}" alt="${night.shortForecast}"></td>
        </tr>
        <tr>
          <div class="forecast-section__title">Day</div>
          <div class="forecast-section__title">Night</div>
        </tr>
        <tr>
          <div class="forecast-section__temp">${day.temperature}&deg; ${day.temperatureUnit}</div>
          <div class="forecast-section__temp">${night.temperature}&deg; ${night.temperatureUnit}</div>
        </tr>
        <tr>
          <div class="forecast-section__short">${day.shortForecast}</div>
          <div class="forecast-section__short">${night.shortForecast}</div>
        </tr>
        <tr>
          <div class="forecast-section__wind">Wind: ${day.windSpeed} ${day.windDirection}</div>
          <div class="forecast-section__wind">Wind: ${night.windSpeed} ${night.windDirection}</div>
        </tr>
      </table></tbody>`
  };
  wrapRenderer = (forecast, forecastMarkup) => {
    return `<div class="forecast-wrapper">
        ${forecastMarkup}
      </div>
      <p class="forecast-credits">Forecast provided by the <a href="https://www.weather.gov/">National Weather Service</a>.</p>`;
  };
  // fetch data via the nws api
  useNWS = async (route) => {
    const options = {
      hostname: this.host,
      port: 443,
      path: route,
      method: 'GET',
      headers: {
        'Accept': 'application/json',  
        'Content-Type': 'application/json',
        'User-Agent': 'ONWARD-ADVENTURES'
      }
    };
    return await httpRequest(options);
  };
  // lookup and provide point information
  lookupPoint = async (lat, lng) => {
    return this.useNWS(`/points/${lat},${lng}`);
  };
  // lookup and provide forecast info
  lookupForecast = async (office, gridX, gridY) => {
    return this.useNWS(`/gridpoints/${office}/${gridX},${gridY}/forecast`)
      .then((r) => r.body.properties);
  };
  // combine point and forecast lookups
  lookupForecastForLatLng = async (lat, lng) => {
    const point = await this.lookupPoint(lat, lng);
    console.log(point);
    const { cwa, gridX, gridY } = point.body.properties;
    return await this.lookupForecast(cwa, gridX, gridY);
  };
  // manipulate html strings, or let user do it
  markupForecast = (forecast) => {
    let forecastMarkup = "";
    var offset = this.offset*2;
    var days = this.days*2;
    const { periods } = forecast;
    if (!periods[0].isDaytime) {
      offset += 1;
      days -= 1;
      forecastMarkup += this.renderer({ night: periods[0] });
    }
    for (let i = offset; i < (offset + days); i += 2) {
      const forecastDay = {
        day: periods[i],
        night: periods[i + 1],
      };
      forecastMarkup += this.renderer(forecastDay);
    }
    return this.wrapRenderer(forecast, forecastMarkup);
  };
}
