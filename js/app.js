(function() {

  var map = L.map('map', {
    // zoomSnap: .2,
    center: [37.6907, -85.8647],
    zoom: 23,
    minZoom: 18,
    maxZoom: 23,
    wheelPxPerZoomLevel: 20000,
    wheelDebounceTime: 1500,
  });

  // orthomosaics hosted on AWS S3

  var project_1 = L.tileLayer('http://pritchard.shockuave.com/{z}/{x}/{y}.png', {
    minZoom: 18,
    maxZoom: 23,
    // opacity: .2
  }).addTo(map);


  // empty featureGroup for storing markers
  var measureLayer = L.featureGroup().addTo(map);
  var markLayer = L.featureGroup().addTo(map);

  // request the contour & pile data geoJson
  var dataCjson = d3.json("data/features.geojson"); //set 1

  // text for display notes
  var noteC = "Fast 1ft Contours";

  // wait until all data loaded
  Promise.all([dataCjson]).then(drawData);


  // create layers and add contours to map
  function drawData(obj) {

    var  dataCdata = obj[2]; //
var
    featAcolor = ['#00BFFF', '#00BFFF', '#cc0000'],
    featBcolor = ['#00BFFF', '#00BFFF', '#cc0000'],
    featCcolor = ['#00BFFF', '#00BFFF', '#cc0000']; // feature, fill, click


      // parse dataCdata features into separate layers based on type
    // features - buildings
    var buildingLayer = L.geoJson(dataCdata, {
      filter: function(feature) {
        if (feature.properties.type == 'building') {
          return feature;
        }
      },
      style: function(feature) {
        return {
          color: featAcolor[0],
          weight: 2,
          fillColor: featAcolor[1],
          // fillOpacity: 1
        }
      },
      onEachFeature: function(feature, layer) {

        var props = feature.properties

        layer.on('mouseover', function() {
          // change layer style
          layer.setStyle({
            fillColor: featAcolor[2]
          });
          var toolTip = "<b>" + props.name +
            "<br>" + props.info +
            "</b>";

          // layer.bindTooltip(toolTip);
          layer.bindTooltip(toolTip);
        });

        layer.on('mouseout', function() {
          // reset style
          layer.setStyle({
            fillColor: featAcolor[1],
          })
        });

        layer.on('click', function() {
          // reset style of all footprints prior to next choice
          resetFeatures();

          // change clicked pile style
          layer.setStyle({
            color: featAcolor[2],
            weight: 3
          });

          // update data panel
          d3.select('.name span').html(props.name);
          d3.select('.data span').html(props.info);
        })
      }
    });


    // features - land labeled sport
    var landLayer = L.geoJson(dataCdata, {
      filter: function(feature) {
        if (feature.properties.type == 'sport') {
          return feature;
        }
      },

      style: function(feature) {
        return {
          color: featBcolor[0],
          weight: 2,
          fillColor: featBcolor[1]
        }
      },
      onEachFeature: function(feature, layer) {

        var props = feature.properties

        layer.on('mouseover', function() {
          // change layer style
          layer.setStyle({
            fillColor: featBcolor[2]
          });
          var toolTip = "<b>" + props.name +
            "<br>" + props.info +
            "</b>";

          // layer.bindTooltip(toolTip);
          layer.bindTooltip(toolTip);
        });

        layer.on('mouseout', function() {
          // reset style
          layer.setStyle({
            fillColor: featBcolor[1],
          })
        });

        layer.on('click', function() {
          // reset style of all footprints prior to next choice
          resetFeatures();

          // change clicked pile style
          layer.setStyle({
            color: featBcolor[2],
            weight: 3
          });

          // update data panel
          d3.select('.name span').html(props.name);
          d3.select('.data span').html(props.info);
        })
      }
    });

    function resetFeatures() {

      buildingLayer.setStyle({
        color: featAcolor[0],
        weight: 2
      });
      landLayer.setStyle({
        color: featBcolor[0],
        weight: 2
      });

    }

    buttonsUi(buildingLayer, landLayer);

  } // end drawData

  // toggle butttons to choose layers
  function buttonsUi(buildingLayer, landLayer) {

    // var project1 = true; // disabled with one base
    var dataSet1 = false;
    var features = false;
    var base = false;
    var measure = false;

    d3.select('.note span').html('Base photo only');

    d3.selectAll('.toggle').on('click', function() {

      // id of clicked switch
      var selected = this.id;


      // select data sets
      if (selected === 'toggle-set1') {
        dataSet1 = true;
        contourA = false;
        base = false;
        clearResults();
        updateLayers();
        d3.select('.note span').html(noteA);

      } else if (selected === 'toggle-set2') {
        dataSet1 = false;
        contourA = false;
        base = false;
        clearResults();
        updateLayers();
        d3.select('.note span').html(noteB);

      } else if (selected === 'toggle-set3') {
        dataSet1 = false;
        contourA = true;
        base = false;
        clearResults();
        updateLayers();
        d3.select('.note span').html(noteC);

      } else if (selected === 'toggle-base') {
        base = true;
        dataSet1 = false;
        contourA = false;
        clearResults();
        updateLayers();
        d3.select('.note span').html("Base photo only");
      }

      // measure on/of
      if (selected === 'toggle-on') {
        measure = true;
        enableMeasure();
      } else if (selected === 'toggle-off') {
        measure = false;
        disableMeasure();
      }

      if (selected === 'toggle-mark') {
        markFunc();
      } else if (selected === 'toggle-mrkoff') {
        markOff();
      } else if (selected === 'toggle-clear') {
        markClear();
      }
    });

    // add layer to dispay and remove all others
    function updateLayers() {
      if (dataSet1 == true && contourA == false && base == false) {

        map.addLayer(buildingLayer);
        map.addLayer(landLayer);

      } else if (dataSet1 == false && contourA == false && base == false) {

        map.removeLayer(buildingLayer);
        map.removeLayer(landLayer);

      } else if (dataSet1 == false && contourA == true && base == false) {
        map.removeLayer(buildingLayer);
        map.removeLayer(landLayer);


      } else if (base == true) {
        map.removeLayer(buildingLayer);
        map.removeLayer(landLayer);

      }
    } //end updateLayers
  } // end buttonsUi

  // function to make measurements and update data panel
  function enableMeasure() {

    var center = map.getCenter();

    var distance = 0;

    // initialize data panel distance
    d3.select('.distance span').html(distance + " ft");

    var featureMarker = L.marker(center, {
      draggable: true,
      title: 'Drag me!'
    }).addTo(measureLayer);

    // start with polyline on 0,0
    var line = L.polyline([
      [0, 0],
      [0, 0]
    ], {
      color: 'red'
    }).addTo(measureLayer);

    map.on('click', function(e) {

      // disable more markers
      map.off('click');

      var clickLocation = L.marker(e.latlng, {
        draggable: true
      }).addTo(measureLayer);

      // draw the line initially when clicking
      updateLine(featureMarker, clickLocation);

      clickLocation.on('drag', function(e) {

        // draw the line when the click marker is moved
        updateLine(featureMarker, clickLocation);

      });

      featureMarker.on('drag', function(e) {

        // draw the line when the feature marker is moved
        updateLine(featureMarker, clickLocation);

      });
    });

    function updateLine(featureMarker, clickLocation) {
      // featureMarker's position
      var featureMarkerCoords = featureMarker.getLatLng();

      // convert to simple array
      var featureMarkerCoordsArray = [featureMarkerCoords.lat, featureMarkerCoords.lng];

      // click location's coords
      var clickCoords = clickLocation.getLatLng();

      // convert to simple array
      var clickCoordsArray = [clickCoords.lat, clickCoords.lng];

      // update the coords of the line
      line.setLatLngs([clickCoordsArray, featureMarkerCoordsArray]);

      // update distance measurement in data panel
      var distance = Math.round(featureMarkerCoords.distanceTo(clickCoords) * 3.28);

      d3.select('.distance span').html(distance + " ft");

      // add toolTip to moving marker
      var popup3 = "<b>" + distance + " ft" + "</br>" +
        "Lat - " + clickCoordsArray[0] + "</br>" +
        "Long - " + clickCoordsArray[1] + "</b>";

      clickLocation.bindTooltip(popup3);

      var popup4 = "<b>" + distance + " ft" + "<br>" +
        "Lat - " + featureMarkerCoordsArray[0] + "</br>" +
        "Long - " + featureMarkerCoordsArray[1] + "</b>";

      featureMarker.bindTooltip(popup4);
    }

  } // end enableMeasure

  function disableMeasure() {

    d3.select('.distance span').html("");
    clearResults();
    measureLayer.clearLayers();

  } // end disableMeasure


  // marker function
  function markFunc() {

    map.on('click', function(e) {
      var markLocation = L.circleMarker(e.latlng, {
        draggable: false,
        color: '#88e60e',
        radius: 5
      }).addTo(markLayer);

      var markCoord = (e.latlng);
      var markCoordArray = [markCoord.lat, markCoord.lng];

      var toolTip = "<b>" +
        "Lat - " + markCoordArray[0] + "</br>" +
        "Long - " + markCoordArray[1] + "</b>";

      markLocation.bindTooltip(toolTip, {
        direction: 'bottom',
      });
    })
  };

  // turn marking off
  function markOff() {
    map.off('click');
  };

  // clear marks layer
  function markClear() {
    markLayer.clearLayers();
  };

  function clearResults() {
    d3.select('.elev span').html("");
    d3.select('.distance span').html("");
    d3.select('.name span').html("");
    d3.select('.data span').html("");
  }

})();
