const { httpRequest } = require('../components');

module.exports = (api, opts) => {
  api.get('/weather/:lat/:long/', async (req,res) => {
    const date_offset = Math.floor((Date.parse(req.query.date) - new Date())/(24 * 60 * 60 * 1000)) || 1;
    const days = req.query.days || 1;
    
    req.params.lat
    return res.sendStatus(200)
  })
  
}


async function loadWeather(lat, long, start_days, finish_days) {
  const weather = document.querySelector("#weather");
  
  demoButton.removeEventListener("click", runDemo);
  demoButton.remove();
  const fetcher = new ForecastFetcher({
    maxDays: finish_days,
  });
  const forecast = await fetcher.lookupForecastForLatLng(lat, long);
  const forecastNode = fetcher.markupForecast(forecast);
  weather.appendChild(forecastNode);
};


//
// -------  Weather forecast functions  --------
// https://daltonrowe.com/local-forecasts-weather-gov-api.html#
// https://www.weather.gov/documentation/services-web-api
//
class ForecastFetcher {
  constructor({timeout: 3000, days: 5, host: "https://api.weather.gov/"}) {
    this.host = host;
    this.timeout = timeout;
    this.days = days;
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
    return ` 
      <div class="forecast-wrapper">
        ${forecastMarkup}
      </div>
      <p class="forecast-credits">Forecast provided by the <a href="https://www.weather.gov/">National Weather Service</a>.</p>`;
  };
  // fetch data via the nws api
  useNWS = async (route) => {
    const response = await fetch(`${this.config.host}${route}`, {
      method: "GET",
    });
    return response.json();
  };
  // lookup and provide point information
  lookupPoint = async (lat, lng) => {
    return this.useNWS(`points/${lat},${lng}`);
  };
  // lookup and provide forecast info
  lookupForecast = async (office, gridX, gridY) => {
    return this.useNWS(`gridpoints/${office}/${gridX},${gridY}/forecast`);
  };
  // combine point and forecast lookups
  lookupForecastForLatLng = async (lat, lng) => {
    const point = await this.lookupPoint(lat, lng);
    const { cwa, gridX, gridY } = point.properties;
    return await this.lookupForecast(cwa, gridX, gridY);
  };
  // manipulate html strings, or let user do it
  markupForecast = (forecast) => {
    let forecastMarkup = "";
    const { periods } = forecast.properties;
    let offset = 0;
    let maxDays = this.config.maxDays;
    if (!periods[0].isDaytime) {
      offset = 1;
      maxDays -= 1;
      forecastMarkup += this.dayRenderer({ night: periods[0] });
    }
    for (let i = offset; i < maxDays * 2; i += 2) {
      const forecastDay = {
        day: periods[i],
        night: periods[i + 1],
      };
      forecastMarkup += this.dayRenderer(forecastDay);
    }
    const forecastWrapper = document.createElement("DIV");
    forecastWrapper.innerHTML = this.wrapRenderer(forecast, forecastMarkup);
    return forecastWrapper;
  };
}
