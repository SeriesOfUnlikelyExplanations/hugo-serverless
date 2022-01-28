
const picker = new Litepicker({ 
  element: document.getElementById('litepicker'),
  singleMode: false
});


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
      alert(results[0].geometry.location);
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function fillInAddress() {
  var place = autocomplete.getPlace();
  codeAddress(document.getElementById('autocomplete').value);
}

document.addEventListener('DOMContentLoaded', function() {
  var my_url = new URL('https://blog.always-onward.com');
  
  return fetch(request_url)
  .then((res) => res.json())
  .then((data) => {
    console.log(data);
    var google_maps_script = document.createElement('script');
    google_maps_script.setAttribute('src',`https://maps.googleapis.com/maps/api/js?key=${data.googleApiKey}&libraries=places&callback=initAutocomplete`);
    document.head.appendChild(google_maps_script);
  });
}


