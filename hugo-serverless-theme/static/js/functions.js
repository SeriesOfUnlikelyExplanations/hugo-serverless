//
// top level functions
// login()
// loadWeather(lat, long, start_days, finish_days) - 
// load_maps() - loads any maps for any "map" class object
// carousel() - loads the image carousels for every "carousel" class object
//

function login() {
  var my_url = new URL(window.location.href);
  var code = my_url.searchParams.get("code");
  if (code != null) {
    var request_url = new URL('/api/auth/calback', my_url);
    request_url.search = new URLSearchParams({code: code}).toString();
  } else {
    var request_url = new URL('/api/auth/refresh', my_url);
  }
  return fetch(request_url)
  .then((res) => res.json())
  .then((data) => {
    setComments(data.login);
    plan()
  });
};

//
// comments functions
//

function setComments(login) {
  if (login) {
    document.getElementById('write-comment').hidden = false;
  } else {
    document.getElementById('write-comment').innerHTML = '<a href="'+data.redirect_url+'">Login to leave a comment!</a>'
    document.getElementById('write-comment').hidden = false;
    document.getElementById('write-comment').onClick = function(e) {
      e.preventDefault();
      sessionStorage.setItem('redirect',location.href);
      location.replace($(this).attr('href'));
    };
  }
};

async function loadComments(post_path) {
  //call api
  console.log(post_path);
  const request_url = new URL( '/api/get_comments', new URL(window.location.href));
  request_url.search = new URLSearchParams({post: post_path }).toString();
  const commentFeed = await fetch(request_url).then((res) => res.json())
  console.log(commentFeed);
  
  var commentFeedHTML = ''
  commentFeed.forEach((comment) => {
    commentFeedHTML += '<article class="read-next-card"><div><b style="color:firebrick">'
    commentFeedHTML += comment.author
    commentFeedHTML += '</b> says:</div><div>'
    commentFeedHTML += comment.content
    commentFeedHTML += '</div></article>'
  });
  document.getElementById('comments-feed').innerHTML = commentFeedHTML
}

  
function formSubmit(post_path) {
  var url = "/api/post_comment";
  var request = new XMLHttpRequest();
  request.open('POST', url, true);
  request.onload = function() { // request successful
    console.log(request.responseText);
    loadComments(post_path)
  };
  request.onerror = function() {
    console.log(request.responseText);
  };
  request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  request.send(JSON.stringify({
    content: document.getElementById("content").value,
    postPath: post_path
  }));
}

//
// Set date picker & location auto-complete
//
function plan() {
  var lat, long, start_date, finish_date;
  function loadWeather(lat, long, start_date, finish_date) {
    if !(lat && long && start_date && finish_date) {
      return
    }
    var url = new URL(`/api/plan/weather/${lat}/${long}`),
    url.search = new URLSearchParams({ start_date:start_date, finish_date:finish_date }).toString();
    fetch(url).then((response) => {
      weatherElement = document.getElementById("weather");
      weatherElement.innerHTML = response;
    });
  };
  
  // date picker
  let lightPickerElement = document.getElementById('litepicker')
  if (document.getElementById('litepicker')) {
    new Litepicker({ 
      element: lightPickerElement,
      singleMode: false,
      setup:  (picker) => {
      picker.on('button:apply', (date1, date2) => {
        start_days = date1;
        finish_days = date2;
        loadWeather(lat, long, start_days, finish_days)
      });
    });
  }
   
  // location auto-complete
  var placeSearch, autocomplete, geocoder;
  function initAutocomplete() {
    geocoder = new google.maps.Geocoder();
    autocomplete = new google.maps.places.Autocomplete(
      (document.getElementById('autocomplete')), {
        types: ['geocode']
      });
    autocomplete.addListener('place_changed', fillInAddress);
  }

  function codeAddress(address) {
    geocoder.geocode({
      'address': address
    }, function(results, status) {
      if (status == 'OK') {
        // This is the lat and lng results[0].geometry.location
        [lat, long] = results[0].geometry.location.split(', ');
        loadWeather(lat, long, start_days, finish_days)
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
  }

  function fillInAddress() {
    var place = autocomplete.getPlace();
    codeAddress(document.getElementById('autocomplete').value);
  }
  
  //Load the Google script for location auto-complete
  if (document.getElementById('autocomplete')) {
    var request_url = new URL('/api/userInfo', new URL(window.location.href));
    return fetch(request_url)
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      var google_maps_script = document.createElement('script');
      google_maps_script.setAttribute('src',`https://maps.googleapis.com/maps/api/js?key=${data.googleApiKey}&libraries=places&callback=initAutocomplete`);
      document.head.appendChild(google_maps_script);
    });
  }
  //~ const weather = document.querySelector("#weather");
  //~ weather.appendChild(forecastNode);
};

//
// ------------- Function to load maps on the page if they exist
//
function load_maps() {
  mapboxgl.accessToken = 'pk.eyJ1Ijoid29vZGFyZHRob21hcyIsImEiOiJja3h1d25qanQwc2w0MnBwb2NuNWN3ajQwIn0.hTIyVRngyfAlIJEyGlT1ng';
  const maps = document.querySelectorAll('.map');
  if (maps) {
    maps.forEach(async function( mapElement ) {
      var data = await fetch(mapElement.id+'.geojson').then(response => response.json())
      const map = new mapboxgl.Map({
        container: mapElement.id,
        center: [data.features[0].properties.longitude, data.features[0].properties.latitude],
        pitch: 45,
        bearing: 0,
        attributionControl: false,
        logoPosition: 'bottom-right',
        style: 'mapbox://styles/mapbox/satellite-v9',
        zoom: 11
      });
      
      map.on('load', () => {
        map.addSource('route', {
          'type': 'geojson',
          'data': data
        });
        map.addControl(new mapboxgl.NavigationControl());
        map.addLayer({
          'id': 'route',
          'type': 'line',
          'source': 'route',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#0096FF',
            'line-width': 2
          }
        });
        map.addLayer({
          'id': 'title',
          'type': 'symbol',
          'source': 'route',
          'layout': {
            'text-field': ['get', 'title'],
            'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
            'text-radial-offset': 0.5,
            'text-justify': 'auto'
          }
        });
        map.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
        // add the DEM source as a terrain layer with exaggerated height
        map.setTerrain({
          'source': 'mapbox-dem',
          'exaggeration': 1.5
        });

        // add a sky layer that will show when the map is highly pitched
        map.addLayer({
          'id': 'sky',
          'type': 'sky',
          'paint': {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });
      });
      const map_properties = data.features[0].properties
      const map_distance = document.getElementById(mapElement.id+'_distance')
      map_distance.innerHTML  = `${Math.round(map_properties.distance*0.000621371192*100)/100} mi`
      const map_time = document.getElementById(mapElement.id+'_time')
      if (map_time < 3600) {
        map_time.innerHTML  = `${Math.floor(map_properties.total_time/60)}m ${Math.round(map_properties.total_time % 60)}s`
      } else {
        map_time.innerHTML  = `${Math.floor(map_properties.total_time/3600)}h ${Math.round((map_properties.total_time % 3600)/60)}m`
      };
      const map_elevation = document.getElementById(mapElement.id+'_elevation')
      map_elevation.innerHTML =  `${Math.round(map_properties.total_ascent*3.28084)} ft`
    });
  };
}

//
// --------- Carosel Functions -----------------
//

function carousel() {
  const carousels = document.querySelectorAll('.carousel');
  if (carousels) {
    carousels.forEach(function( carousel ) {
      const ele = carousel.querySelector('ul');
      const bullets = carousel.querySelectorAll('ol li');
      const nextarrow = carousel.querySelector('.next');
      const prevarrow = carousel.querySelector('.prev');
      // Initialize the carousel
      nextarrow.style.display = 'block';
      prevarrow.style.display = 'block';
      ele.scrollLeft = 0;
      bullets[0].classList.add('selected');
      const scrollTo = function(event) {
        event.preventDefault();
        ele.scrollLeft = ele.querySelector(this.getAttribute('href')).offsetLeft;

        // Set selected bullet
        bullets.forEach(function(bullet) {
          bullet.classList.remove('selected');
        });
        this.parentElement.classList.add('selected');
      }
      const nextSlide = function() {
        if(!carousel.querySelector('ol li:last-child').classList.contains('selected')) {
          carousel.querySelector('ol li.selected').nextElementSibling.querySelector('a').click();
        } else {
          carousel.querySelector('ol li:first-child a').click();
        }
      }
      const prevSlide = function() {
        if(!carousel.querySelector('ol li:first-child').classList.contains('selected')) {
          carousel.querySelector('ol li.selected').previousElementSibling.querySelector('a').click();
        } else {
          carousel.querySelector('ol li:last-child a').click();
        }
      }
      // Attach the handlers
      nextarrow.addEventListener("click", nextSlide);
      prevarrow.addEventListener("click", prevSlide);
      bullets.forEach(function(bullet) {
        bullet.querySelector('a').addEventListener('click', scrollTo);
      });

      //setInterval for autoplay
      if(carousel.getAttribute('duration')) {
        setInterval(function(){ 
          if (ele != document.querySelector(".carousel:hover ul")) {
            nextarrow.click();
          }
        }, carousel.getAttribute('duration'));
      }
    }); //end foreach

    document.addEventListener('keydown', function (e){
      var elements = document.querySelectorAll('.carousel');
      if(e.key == 'ArrowLeft') {
        elements.forEach( function(element) {
          element.querySelector('.prev').click();
        });
      }
      if(e.key == 'ArrowRight') {
        elements.forEach( function(element) {
          element.querySelector('.next').click();
        });
      }
    });
  };
};
