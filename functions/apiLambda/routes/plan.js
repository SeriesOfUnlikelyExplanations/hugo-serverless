const { httpRequest } = require('../components');

module.exports = (api, opts) => {
  api.get('/weather/:lat/:long', async (req,res) => {
    const date_offset = Math.floor((Date.parse(req.query.start_date) - new Date())/(24 * 60 * 60 * 1000)) || 1;
    const days = Math.floor((Date.parse(req.query.finish_date) - Date.parse(req.query.start_date))/(24 * 60 * 60 * 1000)) || 1;
     const fetcher = new ForecastFetcher({
      days: days,
      offset: date_offset
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
class ForecastFetcher {
  constructor({timeout = 3000, days = 5, offset = 1, host = "api.weather.gov"}) {
    this.host = host;
    this.timeout = timeout;
    this.days = days;
    this.offset = offset;
  }
  renderer = (forecastDay) => {
    const { day, night } = forecastDay;
    const nightHTML = `<div class="forecast-section forecast-section--night">
      <strong class="forecast-section__name">${night.name}</strong>
      <img class="forecast-section__icon" src="${night.icon}" alt="${night.shortForecast}">
      <div class="forecast-section__temp">${night.temperature}&deg; ${night.temperatureUnit}</div>
      <div class="forecast-section__short">${night.shortForecast}</div>
      <div class="forecast-section__wind">Wind: ${night.windSpeed} ${night.windDirection}</div>
    </div>`
    if (night && !day) {
      return `<div class="forecast-day forecast-day--night-only">          
        ${nightHTML}
      </div>`;
    }
    return `<div class="forecast-day">    
      <div class="forecast-section forecast-section--day">
        <strong class="forecast-section__name">${day.name}</strong>
        <img class="forecast-section__icon" src="${day.icon}" alt="${day.shortForecast}">
        <div class="forecast-section__temp">${day.temperature}&deg; ${day.temperatureUnit}</div>
        <div class="forecast-section__short">${day.shortForecast}</div>
        <div class="forecast-section__wind">Wind: ${day.windSpeed} ${day.windDirection}</div>
      </div>
      ${nightHTML}
    </div>`;
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
    const { periods } = forecast;
    let offset = 0;
    let days = this.days;
    if (!periods[0].isDaytime) {
      offset = 1;
      days -= 1;
      forecastMarkup += this.renderer({ night: periods[0] });
    }
    for (let i = offset; i < days * 2; i += 2) {
      const forecastDay = {
        day: periods[i],
        night: periods[i + 1],
      };
      forecastMarkup += this.renderer(forecastDay);
    }
    return this.wrapRenderer(forecast, forecastMarkup);
  };
}
