var fmeserverurl = "demo.fmeserver.com";
var token = "7ef84feb2d8553c89e3f803052c340bd252b0e08";

/* The Google Maps Object */
var map;

/* The current overlay the user draws */
var currentOverlay = null;

/* The buffer response stored as a polygon */
var bufferShape = null;

/* The prompt message box */
var promptOverlay;

/* The success message box */
var successOverlay;

/**
* Called when the page first loads
*/
function initialize() {
  /* Start - JQuery Toole Form Setup */

  /* Setup Google Maps Object */
  var myOptions = {
    center : new google.maps.LatLng(34.0, -50.0),
    zoom : 3,
    mapTypeId : google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);

  /* Setup drawing manager */
  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode : null,
    drawingControl : true,
    drawingControlOptions : {
      position : google.maps.ControlPosition.TOP_CENTER,
      drawingModes : [google.maps.drawing.OverlayType.POLYGON, google.maps.drawing.OverlayType.MARKER, google.maps.drawing.OverlayType.POLYLINE]
    },
    polygonOptions : {
      strokeColor : "#FF0000",
      strokeOpacity : 0.8,
      strokeWeight : 2,
      fillColor : "#FF0000",
      fillOpacity : 0.35
    }
});
drawingManager.setMap(map);

/**
* Drawing listeners.
* Called when the user draws a shape
*/
function drawingListener(inFeature, type) {

//Clear the previous overlays
if(currentOverlay) {
  currentOverlay.geom.setMap(null);
  if(bufferShape) {
    bufferShape.setMap(null);
  }
}

//Reset the drawing manager
drawingManager.setDrawingMode(null);

//Set current object to the current map geom
currentOverlay = {
  "type" : type,
  "geom" : inFeature
};

}

/* Setup drawing listeners for each drawing object */
google.maps.event.addListener(drawingManager, 'polygoncomplete', function(polygon) {
  drawingListener(polygon, 'polygon');
  streamBufferToMap(generateWktStr());
});

google.maps.event.addListener(drawingManager, 'markercomplete', function(point) {
  drawingListener(point, 'point');
  streamBufferToMap(generateWktStr());
});

google.maps.event.addListener(drawingManager, 'polylinecomplete', function(polyline) {
  drawingListener(polyline, 'polyline');
  streamBufferToMap(generateWktStr());
});
}

/**
* Called when the user clicks the submit button on the form.
*/
function generateRequest() {
// If there is no overlay currently on the map
if(currentOverlay === null) {

//Warn the user wih a prompt
$("#prompt").overlay().load();

} else {

  /* A valid geom exists so trigger the event */

  var url = 'http://' + fmeserverurl +'/fmerest/notifier/topics/ems_web_update/publish?token=' + token;




  /* Create the JSON object */
  var jsonObj = { };
  jsonObj["wkt"] = generateWktStr();
  jsonObj["email"] = $("#txt_email").val();
  jsonObj["url"] = $("#txt_url").val();         
  jsonObj["title"] = $("#eventTitle").val();
  jsonObj["description"] = $("#eventDescription").val();
  jsonObj["radius"] = $("#eventRadius").val();
  jsonObj["extremity"] = $("#eventExtremity").val();
  var jsonStr = JSON.stringify(jsonObj);

/*
Commonly available on the web, this function was taken from:
http://ajaxpatterns.org/XMLHttpRequest_Call
*/
function createXMLHttpRequest() {
  try {
    return new XMLHttpRequest();
  } catch (e) {
  }
  try {
    return new ActiveXObject("Msxml2.XMLHTTP");
  } catch (e) {
  }
  alert("XMLHttpRequest not supported");
  return null;
}

/*
Display the result when complete
*/
function onResponse() {
  // 4 indicates a result is ready
  if(xhReq.readyState != 4)
    return;

    // Prompt the user with a success dialog.

    $("#completed").overlay().load();
      return;
    }

    /* Make the request */
    var xhReq = createXMLHttpRequest();

    xhReq.open('POST', url, true);
    xhReq.onreadystatechange = onResponse;
    xhReq.send('"' + jsonStr + '"');

    streamBufferToMap(generateWktStr());
  }
}

function generateWktStr() {
  var wktStr = '';

  /* Create the WKT string. A different string for each GEOM type. */
  switch(currentOverlay.type) {
    case 'point':
    var gLatLng = currentOverlay.geom.getPosition();
    wktStr = 'POINT (' + gLatLng.lng() + ' ' + gLatLng.lat() + ')';

    break;

    case 'polygon':
    var gglePolyArray = currentOverlay.geom.getPath();
    gglePolyArray.forEach(function(item, index) {
      if(index === (gglePolyArray.length - 1)) {
        wktStr = wktStr + item.lng() + ' ' + item.lat();
      } else {
        wktStr = wktStr + item.lng() + ' ' + item.lat() + ', ';
      }

    });
    wktStr = 'POLYGON ((' + wktStr + '))';
    break;

    case 'polyline':
    var gglePolyArray = currentOverlay.geom.getPath();
    gglePolyArray.forEach(function(item, index) {
      if(index === (gglePolyArray.length - 1)) {
        wktStr = wktStr + item.lng() + ' ' + item.lat();
      } else {
        wktStr = wktStr + item.lng() + ' ' + item.lat() + ', ';
      }

    });
    wktStr = 'LINESTRING (' + wktStr + ')';
    break;
  }

  return wktStr;
}

/**
* Calls the data streaming service which draws the buffer on the map
* @inGeomString he WKT geometry string
*/
function streamBufferToMap(inGeomString) {

/**
* Called when the POST is successful
* @inPolygonString The GeoJSON returned from the data streaming service
*/
function addBufferPolygonToMap(inPolygonString) {
  //Extract response and load into array
  var startPoint = inPolygonString.lastIndexOf("(") + 1;
    var endPoint = inPolygonString.indexOf(")")

    var trimmedStr = inPolygonString.substr(startPoint, (endPoint - startPoint));
    var arrayPoints = trimmedStr.split(",");
    var arrayLatLng = [];

    for(var i = arrayPoints.length - 1; i >= 0; i--) {

      var arrayCoords = arrayPoints[i].split(" ");
      arrayLatLng.push(new google.maps.LatLng(arrayCoords[1], arrayCoords[0]));

    }
  //Clear the previosu buffer
  try {
    bufferShape.setMap(null);
  } catch (e) {

  }

  /* Add the shape to the map */
  bufferShape = new google.maps.Polygon({
    paths : arrayLatLng,
    strokeColor : "#FF0000",
    strokeOpacity : 0.8,
    strokeWeight : 2,
    fillColor : "#FF0000",
    fillOpacity : 0.35
  });
  bufferShape.setMap(map);

};

/*
Commonly available on the web, this function was taken from:
http://ajaxpatterns.org/XMLHttpRequest_Call
*/
function createXMLHttpRequest() {
  try {
    return new XMLHttpRequest();
  } catch (e) {
  }
  try {
    return new ActiveXObject("Msxml2.XMLHTTP");
  } catch (e) {
  }
  alert("XMLHttpRequest not supported");
  return null;
}

/*
Display the result when complete
*/
function onResponse() {
  // 4 indicates a result is ready
  if(xhReq.readyState != 4)
    return;
  // Get the response and display it
  addBufferPolygonToMap(xhReq.responseText);

  return;
}

/*
Create the XMLHttpRequest object
*/
var xhReq = createXMLHttpRequest();
  // Request Variables
  pUrlBase = "http://" + fmeserverurl + "/fmedatastreaming/fmepedia_demos/D002%20-%20report_web_form_bufferer.fmw?tm_priority=50&bufferamount=" + $("#eventRadius").val()
  pHttpMethod = "POST"
  // Create REST call
  params = inGeomString;

  // Send request
  xhReq.open(pHttpMethod, pUrlBase, true);
  // xhReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
  xhReq.onreadystatechange = onResponse;
  xhReq.send(params);
}


google.maps.event.addDomListener(window, 'load', initialize);
