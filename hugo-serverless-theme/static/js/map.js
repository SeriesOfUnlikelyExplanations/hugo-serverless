document.addEventListener('DOMContentLoaded', function() {
  mapboxgl.accessToken = 'pk.eyJ1Ijoid29vZGFyZHRob21hcyIsImEiOiJja3h1d25qanQwc2w0MnBwb2NuNWN3ajQwIn0.hTIyVRngyfAlIJEyGlT1ng';
  const maps = document.querySelectorAll('.map');
  
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
});
