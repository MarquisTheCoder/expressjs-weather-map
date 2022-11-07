"use strict";

/*
 Creator: Deshawn Marquis, Williams,
 GitHub Profile: https://github.com/MarquisTheCoder,
 Date Created: 9/26/22,
 Time Created: 10:20 AM,
 File Name: weather_map.js,
 File Description: 
 */


$(function(){
     
     const DEFAULT_CITY = 'San Antonio, TX'
     const MAP_CONTAINER = $('#map-container')
     const CARD_HOLDER = $('.card-holder')
     const SEARCH_BUTTON = $('#search-location-btn')
     
     updateScreen(DEFAULT_CITY, MAPBOX_API_KEY);
     
     //generating card to display map data
     let generateCards = function( date, temp, description, humidity, wind, pressure, icon){
          let cardTemplate = `<div class="card card-main" style=" width: 18rem; background-color: #15181D88; border: solid #01010122 1px;">
                                <div class="card-body d-flex-column text-center">
                                     <h5 class="card-title text text-center" id="date"style="background-color: #00000033">${date}</h5>
                                     <h6 class="card-subtitle mb-2 text-center mt-3">${parseInt(1.8*(parseInt(temp)-273) + 32)}&#8457;</h6>
                                     <img src="http://openweathermap.org/img/w/${icon}.png" alt="">
                                     <hr>
                                     <p class="card-text text-center data">Description - ${description}</p><hr>
                                     <p class="card-text text-center data">Humidity - ${humidity}</p><hr>
                                     <p class="card-text text-center data">Wind - ${wind}</p><hr>
                                     <p class="card-text text-center data">Pressure - ${pressure}</p>
                                </div>
                             </div>`
          
          CARD_HOLDER.append(cardTemplate)
     }
     
     //generating the latitude loingtitude from the mapbox_api
     function reverseGeocodeRestaurant(latitude, longitude, api_key){
                    let apiUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places/';
                    return fetch(`${apiUrl}${longitude},${latitude}.json?access_token=${api_key}`)
                         .then((response) => response.json())
                         .then((responseData) => responseData.features[0].place_name)
     }
               
     function updateScreen(address, api_key) {
          geocodeRestaurant(address, api_key).then(mapCoordinates => {
               let longitude = mapCoordinates[0]
               let latitude = mapCoordinates[1]
               
               //reverse geocoding current position to display city
               reverseGeocodeRestaurant(latitude, longitude, api_key)
                    .then(placeName => $('#current-city').html(`${placeName.split(',')[1]}`))
              
              
              //api call to weather map for longitude latitude  
               let apiCallUrl = 'https://api.openweathermap.org/data/2.5/' +
                    `forecast?lat=${latitude}&lon=${longitude}&` +
                    `appid=${WEATHERMAP_API_KEY}`
              
               
               //reinitializing the map per request
              // $('#map-container').html('')
               mapboxgl.accessToken = MAPBOX_API_KEY;
               let map = new mapboxgl.Map({
                                               container: 'map-container',
                                               style: 'mapbox://styles/mapbox/dark-v10',
                                               center: [longitude, `${parseInt(latitude) - 50}`],
                                               zoom: 10 ,
                                               pitch: 70,
                                               bearing: -17.6,
                                               antialias: true
                    
                                                  
                                          })
               
               
               
               //reseting card container
               CARD_HOLDER.html('') 
               $.get(apiCallUrl).done(response => {
                    //as the object array for the weather data in forecast is an
                    //array of 40 to get a 5 day forecast I had to filter by each 8th value
                    //and generate a card for each returned data set
                    response.list.filter((_e, index) => index % 8 === 0)
                         .forEach((weatherMapObject, index) => {
                         generateCards(
                              epochDateConversion(weatherMapObject.dt),
                              weatherMapObject.main.temp,
                              weatherMapObject.weather[0].description,
                              weatherMapObject.main.humidity,
                              weatherMapObject.wind.speed,
                              weatherMapObject.main.pressure,
                              weatherMapObject.weather[0].icon,
                         )
                    })
                    
                    map.setCenter(mapCoordinates)
                    map.setZoom(10)
                    // map.addControl(new mapboxgl.NavigationControl());
                    //setting marker
                    let marker = new mapboxgl.Marker({draggable: true, color: '#A74D1F'})
                         .setLngLat(mapCoordinates)
                         .addTo(map)
                    
                   //when marker is dragged it gets the place
                    //value of the coordinates with reverse geo code then
                    //updates the screen with that place value
                    marker.on('dragend', () => {
                         reverseGeocodeRestaurant(marker.getLngLat().lat, marker.getLngLat().lng, api_key)
                              .then(place =>{
                                   updateScreen(place, api_key)
                              })
                    })
                    map.on('click', (e) => {
                         reverseGeocodeRestaurant(e.lngLat.lat, e.lngLat.lng,api_key)
                         .then(place =>{
                              updateScreen(place, api_key)
                         })
                    })
     
     
                    map.on('load', () => {
// Insert the layer beneath any symbol layer.
                         const layers = map.getStyle().layers;
                         const labelLayerId = layers.find(
                              (layer) => layer.type === 'symbol' && layer.layout['text-field']
                         ).id;

// The 'building' layer in the Mapbox Streets
// vector tileset contains building height data
// from OpenStreetMap.
                         map.addLayer(
                              {
                                   'id': 'add-3d-buildings',
                                   'source': 'composite',
                                   'source-layer': 'building',
                                   'filter': ['==', 'extrude', 'true'],
                                   'type': 'fill-extrusion',
                                   'minzoom': 15,
                                   'paint': {
                                        'fill-extrusion-color': '#aaa',

// Use an 'interpolate' expression to
// add a smooth transition effect to
// the buildings as the user zooms in.
                                        'fill-extrusion-height': [
                                             'interpolate',
                                             ['linear'],
                                             ['zoom'],
                                             15,
                                             0,
                                             15.05,
                                             ['get', 'height']
                                        ],
                                        'fill-extrusion-base': [
                                             'interpolate',
                                             ['linear'],
                                             ['zoom'],
                                             15,
                                             0,
                                             15.05,
                                             ['get', 'min_height']
                                        ],
                                        'fill-extrusion-opacity': 0.6
                                   }
                              },
                              labelLayerId
                         );
                    });
                    
               })
          })
     }
     
     //converting the given unix time in miliseconds into
     //a human readable format
     function epochDateConversion(milliseconds){
          let date = new Date(milliseconds * 1000)
          // return (`${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`)
          return `${date}`.split(' ')[0]
     }
     //getting long/lat coordinaties for a specific address
     function geocodeRestaurant(address, accessToken){
          let apiUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places/';
          return fetch(`${apiUrl}${encodeURIComponent(address)}.json?access_token=${accessToken}`)
          .then((response) => response.json())
          .then((responseData) => responseData.features[0].center);
     }
    //on search button click updates information and map based
    // on input in #search-location input container 
     SEARCH_BUTTON.on('click',()=> {
          CARD_HOLDER.html('')
          updateScreen($('#search-location').val(), MAPBOX_API_KEY)
          //deleting input text after search just a pet peeve
          $('#search-location').val('')
     })
     $('#search-location').on('keydown', (event) =>{
          if(event.key == 'Enter'){
               updateScreen($('#search-location').val(), MAPBOX_API_KEY)
               //deleting input text after search just a pet peeve
               $('#search-location').val('') 
          }
     })
})