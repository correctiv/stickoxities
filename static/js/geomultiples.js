/*global document, window, mapbox, console, d3 */
window.GeoMultiple = (function(){
  "use strict";

var constants = {
  // constants["sans"]: "Open Sans Regular, Arial Unicode MS Regular",
  // constants["sans-it"]: "Open Sans Italic, Arial Unicode MS Regular",
  // constants["sans-md"]: "Open Sans Semibold, Arial Unicode MS Bold",
  // constants["sans-bd"]: "Open Sans Bold, Arial Unicode MS Bold",
  "big-label": "#cb4b49",
  "medium-label": "#f27a87",
  "small-label": "#384646",
  "label-halo": "rgba(255,255,255,0.5)",
  "label-halo-dark": "rgba(0,0,0,0.2)",
  "land": "#4a4a4a",
  "water": "#00697c",
  "park": "#2b4004",
  "building": "#afd3d3",
  "highway": "#5d6765",
  "road": "#7a7a7a",
  "railway": "#93a19a",
  "majorroad": "#7a7a7a",
  "path": "#5d6765",
  "subway": "#ef7369",
  "umweltzone": "#60e86a",
  "umweltzone-width": {
    "base": 2.0,
    "stops": [[4, 1.0], [8, 2.5], [20, 60]]
  },
  "highway-width": {
    "base": 1.55,
    "stops": [[4, 0.5], [8, 1.5], [20, 40]]
  },
  "majorroad-width": {
    "base": 1.55,
    "stops": [[4, 0.4], [8, 1.3], [20, 35]]
  },
  "railway-width": {
    "base": 1.55,
    "stops": [[4, 0.4], [8, 1.3], [20, 35]]
  },
  "road-width": {
    "base": 1.55,
    "stops": [[4, 0.25], [20, 30]]
  },
  "path-width": {
    "base": 1.8,
    "stops": [[10, 0.15], [20, 15]]
  },
  "road-misc-width": {
    "base": 1,
    "stops": [[4, 0.25], [20, 30]]
  },
  "stream-width": {
    "base": 0.5,
    "stops": [[4, 0.5], [10, 1.5], [20, 5]]
  }
};

var simple = {
  "version": 8,
  // "glyphs": "mapbox://fontstack/{fontstack}/{range}.pbf",
  "sources": {
    "osm": {
      "type": "vector",
      "tiles": ["https://vector.mapzen.com/osm/all/{z}/{x}/{y}.mvt?api_key=vector-tiles-rIpIBqg"]
    }
  },
  "layers": [{
    "id": "background",
    "type": "background",
    "paint": {
      "background-color": constants.land
    }
  }, {
    "id": "water-line",
    "source": "osm",
    "source-layer": "water",
    "type": "line",
    "filter": ["==", "$type", "LineString"],
    "paint": {
      "line-color": constants["water"],
      "line-width": {
        "base": 1.2,
        "stops": [[8, 0.5], [20, 15]]
      }
    }
  }, {
    "id": "water-polygon",
    "source": "osm",
    "source-layer": "water",
    "type": "fill",
    "filter": ["==", "$type", "Polygon"],
    "paint": {
      "fill-color": constants["water"]
    }
  }, {
    "id": "park",
    "type": "fill",
    "source": "osm",
    "source-layer": "landuse",
    "min-zoom": 6,
    "filter": ["in", "kind", "park", "forest", "garden", "grass", "farm", "meadow", "playground", "golf_course", "nature_reserve", "wetland", "wood", "cemetery"],
    "paint": {
      "fill-color": constants["park"]
    }
  }, {
    "id": "river",
    "source": "osm",
    "source-layer": "water",
    "type": "line",
    "min-zoom": 6,
    "filter": ["all", ["==", "$type", "LineString"], ["==", "kind", "river"]],
    "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
    "paint": {
      "line-color": constants["water"],
      "line-width": {
        "base": 1.2,
        "stops": [[8, 0.75], [20, 15]]
      }
    }
  }, {
    "id": "stream-etc",
    "source": "osm",
    "source-layer": "water",
    "type": "line",
    "min-zoom": 11,
    "filter": ["all", ["==", "$type", "LineString"], ["in", "kind", "stream", "canal"]],
    "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
    "paint": {
      "line-color": constants["water"],
      "line-width": {
        "base": 1.4,
        "stops": [[10, 0.5], [20, 15]]
      }
    }
  }, {
      "id": "country-boundary",
      "source": "osm",
      "source-layer": "places",
      "type": "line",
      "filter": ["==", "admin_level", "2"],
      "max-zoom": 4,
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": constants["building"],
      "line-width": {
        "base": 2,
        "stops": [[1, 0.5], [7, 3]]
        }
      }
    }, {
      "id": "state-boundary",
      "source": "osm",
      "source-layer": "places",
      "type": "fill",
      "filter": ["==", "admin_level", "4"],
      "max-zoom": 10,
      "layout": {
        // "line-cap": "round",
        // "line-join": "round"
      },
      "paint": {
        "fill-color": constants["land"],
        "fill-outline-color": "#cacecc"
      }
  }, {
    "id": "link-tunnel",
    "source": "osm",
    "source-layer": "roads",
    "type": "line",
    "filter": ["any", ["==", "is_tunnel", "yes"]],
    "layout": {
      "line-join": "round",
      "line-cap": "round"
    },
    "paint": {
      "line-color": constants["building"],
      "line-width": constants["road-width"],
      "line-dasharray": [1, 2]
    }
  }, {
    "id": "buildings",
    "type": "fill",
    "source": "osm",
    "source-layer": "buildings",
    "paint": {
    "fill-outline-color": constants["building"],
    "fill-color": constants["land"]
    }
  }, {
    "id": "road",
    "source": "osm",
    "source-layer": "roads",
    "type": "line",
    "filter": ["any", ["==", "kind", "minor_road"]],
    "layout": {
      "line-join": "round",
      "line-cap": "round"
    },
    "paint": {
      "line-color": constants["road"],
      "line-width": constants["road-width"]
    }
  }, {
    "id": "major-road",
    "source": "osm",
    "source-layer": "roads",
    "type": "line",
    "filter": ["==", "kind", "major_road"],
    "layout": {
      "line-join": "round",
      "line-cap": "round"
    },
    "paint": {
      "line-color": constants["majorroad"],
      "line-width": constants["majorroad-width"]
    }
  }, {
    "id": "railway",
    "source": "osm",
    "source-layer": "roads",
    "type": "line",
    "filter": ["==", "kind", "rail"],
    "layout": {
      "line-join": "round",
      "line-cap": "round"
    },
    "paint": {
      "line-color": constants["railway"],
      "line-width": constants["railway-width"]
    }
  }, {
    "id": "link-bridge",
    "source": "osm",
    "source-layer": "roads",
    "type": "line",
    "filter": ["any", ["==", "is_link", "yes"], ["==", "is_bridge", "yes"]],
    "layout": {
      "line-join": "round",
      "line-cap": "round"
    },
    "paint": {
      "line-color": constants["road"],
      "line-width": constants["highway-width"]
    }
  }, {
    "id": "highway",
    "source": "osm",
    "source-layer": "roads",
    "type": "line",
    "line-join": "round",
    "filter": ["==", "kind", "highway"],
    "layout": {
      "line-join": "round",
      "line-cap": "round"
    },
    "paint": {
      "line-color": constants["highway"],
      "line-width": constants["highway-width"]
    }
  }
  ]
};

var makeNum = function(d){
  return +d;
};

var colorbrewer = {
  OrRd: ['rgb(255,247,236)','rgb(254,232,200)','rgb(253,212,158)','rgb(253,187,132)','rgb(252,141,89)','rgb(239,101,72)','rgb(215,48,31)','rgb(179,0,0)','rgb(127,0,0)']
};

var getScaleDate = function(timeseries) {
  var start = (new Date(timeseries.start)).getTime();
  return function(d, i) {
    return new Date(start + timeseries.interval * 1000 * i);
  };
};

var maxValue = 100;
var limitValue = 40;

var colorScale = d3.scale.quantize().domain([0, maxValue]).range(colorbrewer.OrRd);

var GeoMultiple = function(node, config) {
  var self = this;
  this.node = node;
  this.width = this.node.offsetWidth;
  this.config = config;
  var map = this.map = new mapboxgl.Map({
    container: node.getElementsByClassName("city-map")[0],
    style: simple,
    zoom: config.zoom,
    minZoom: 2,
    center: config.center
  });

  map.on("style.load", function () {
    if (config.umweltzone !== undefined) {
      map.addSource("umweltzone", {
          "type": "geojson",
          "data": config.umweltzone
      });

      map.addLayer({
          "id": "umweltzone",
          "type": "line",
          "source": "umweltzone",
          "layout": {
              "line-join": "round",
              "line-cap": "round"
          },
          "paint": {
              "line-color": constants["umweltzone"],
              "line-width": constants["umweltzone-width"]
          }
      });
      self.config.dispatcher.on("datechange.umweltzone-" + self.config.id, function(date) {
          var since = new Date(config.umweltzone.properties.since);
          if (since <= date) {
            self.map.setLayoutProperty("umweltzone", "visibility", "visible");
          } else {
            self.map.setLayoutProperty("umweltzone", "visibility", "none");
          }
      });
    }
    if (config.stickoxide !== undefined) {
      config.stickoxide.stations.forEach(function(station){
        station.timeseries.data = station.timeseries.data.map(makeNum);
        map.addSource(station.id, {
            "type": "geojson",
            "data": station.feature
        });

        map.addLayer({
            "id": station.id,
            "type": "circle",
            "source": station.id,
            "layout": {
              "visibility": "visible"
            },
            "paint": {
                "circle-radius": 5,
                "circle-color": "#f00" // Color our circle red.
            }
        });
        station.visible = true;
      });

      config.stickoxide.summary.timeseries.data = config.stickoxide.summary.timeseries.data.map(makeNum);
      self.summarySparkLine(d3.select(self.node).select(".city-sparkline"), config.stickoxide.summary.timeseries);

      self.config.dispatcher.on("datechange.stations-" + self.config.id, function(date) {
          self.updateDate(date);
      });

      self.config.dispatcher.datechange(new Date(config.stickoxide.stations[0].timeseries.start));
    }

  });
};

GeoMultiple.prototype.updateDate = function(date) {
  var self = this;
  this.config.stickoxide.stations.forEach(function(station){
    var start = (new Date(station.timeseries.start)).getTime();
    var pivot = Math.floor((date.getTime() - start) / (1000 * station.timeseries.interval));
    var val = station.timeseries.data[pivot];

    if (!val && val !== 0.0) {
      if (station.visible) {
        self.map.setLayoutProperty(station.id, "visibility", "none");
        station.visible = false;
      }
    } else {
      if (!station.visible) {
        self.map.setLayoutProperty(station.id, "visibility", "visible");
        station.visible = true;
      }
      self.map.setPaintProperty(station.id, "circle-color", colorScale(val));
    }
  });
};

GeoMultiple.prototype.summarySparkLine = function(node, timeseries) {
  var self = this;
  var width = this.width;
  var height = 70;
  var bottomBuffer = 20;
  var x = d3.time.scale()
          .range([0, width])
          .domain([new Date(timeseries.start), new Date(timeseries.end)]);
  var y = d3.scale.linear()
        .range([height - bottomBuffer, 0])
        .domain([0, maxValue]);

  var timeseriesLine = d3.svg.line()
       .interpolate("basis")
       .x(function(d, i) { return x(getScaleDate(timeseries)(d, i)); })
       .y(function(d) {
         return y(d);
       });

   var xAxis = d3.svg.axis()
       .scale(x)
       .orient("bottom")
       .ticks(5);

   var limitLine = d3.svg.line().x(function(d){ return x(d); }).y(y(limitValue));

   var sparkLine = node
     .append("svg")
     .attr("width", width)
     .attr("height", height)
     .append("g");
   sparkLine.append("path")
      .datum(timeseries.data)
      .attr("class", "sparkline")
      .attr("d", timeseriesLine);
    sparkLine.append("path")
      .datum(x.domain())
      .attr("class", "limitline")
      .attr("d", limitLine);
    sparkLine.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height - bottomBuffer) + ")")
        .call(xAxis);

    var mouseLine = sparkLine.append("path") // this is the black vertical line to follow mouse
      .attr("class", "mouseline");

    // var bisect = d3.bisector(function(d) { return d.YEAR; }).right; // reusable bisect to find points before/after line

    sparkLine.append("svg:rect") // append a rect to catch mouse movements on canvas
      .attr("width", width) // can"t catch mouse events on a g element
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", function(){ // on mouse in show line, circles and text
            mouseLine.style("opacity", "1");
      })
      .on("mousemove", function() { // mouse moving over canvas
        var xCoor = d3.mouse(this)[0]; // mouse position in x
        var xDate = x.invert(xCoor); // date corresponding to mouse x
        self.config.dispatcher.datechangeRequest(xDate);
      });

      this.config.dispatcher.on("datechange.sparkline-" + this.config.id, function(date) {
        var yRange = y.range();
        mouseLine.style("opacity", "1")
          .attr("d", function(){
            return "M" + x(date) + "," + yRange[0] + "L" + x(date) + "," + yRange[1]; // position vertical line
        });
      });

};

return GeoMultiple;

}());
