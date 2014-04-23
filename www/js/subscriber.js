
/* The Google Maps Object */

var fmeserverurl = "demo.fmeserver.com";

      var token = "7ef84feb2d8553c89e3f803052c340bd252b0e08";

      var map;

      /* The current overlay the user draws */
      var currentOverlay = null;

      /* The prompt message box */
      var promptOverlay;

      /* The success message box */
      var successOverlay;

      /* The buffer response stored as a polygon */
      var bufferShape = null;

      /**
       * Called when the page first loads
       */
       function initialize() {

        /* Start - JQuery Toole Form Setup */
        $('#date_range').daterangepicker();

        /* Setup Google Maps Object */
        var myOptions = {
          center : new google.maps.LatLng(34.0, -50.0),
          zoom : 3,
          mapTypeId : google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);

        google.maps.event.addListenerOnce(map, 'idle', function() {

        });
        /* Setup drawing manager */
        var drawingManager = new google.maps.drawing.DrawingManager({
          drawingMode : null,
          drawingControl : true,
          drawingControlOptions : {
            position : google.maps.ControlPosition.TOP_CENTER,
            drawingModes : [google.maps.drawing.OverlayType.POLYGON]
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
        });

        google.maps.event.addListener(drawingManager, 'markercomplete', function(point) {
          drawingListener(point, 'point');
        });

        google.maps.event.addListener(drawingManager, 'polylinecomplete', function(polyline) {
          drawingListener(polyline, 'polyline');
        });
      }

      /**
       * Called when the user clicks the submit button on the form.
       */
       function generateRequest() {

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
          if(xhReq.readyState != 4) {
            return;
          }
          // Get the response and display it
          $('#successModal').modal();
          return;
        }

        // If there is no overlay currently on the map
        if(currentOverlay === null) {

          $('#mapWarningModal').modal();

        } else {
          var url = "http://" + fmeserverurl + "/fmerest/notifier/topics/ems_subscribe/publish?token=" + token;
          /* Create the JSON object */
          var jsonObj = { };
          jsonObj["wkt"] = generateWktStr();
          jsonObj["email"] = $("#txt_email").val();
          jsonObj["twitter"] = $("#txt_twitter").val();
          jsonObj["startdate"] = $('#date_range').data('daterangepicker').startDate.utc().format();
          jsonObj["enddate"] = $('#date_range').data('daterangepicker').endDate.utc().format();
          jsonObj["area_type"] = $('#notification_area option:selected').val();
          var jsonStr = JSON.stringify(jsonObj);

          var xhReq = createXMLHttpRequest();

          xhReq.open('POST', url, true);
          xhReq.onreadystatechange = onResponse;
          xhReq.send('"' + jsonStr + '"');
        }

      }

      /**
       *
       */
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

      google.maps.event.addDomListener(window, 'load', initialize);