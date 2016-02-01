/*global document, window, mapbox, console, d3 */
window.GeoMultiple = (function(){
  "use strict";


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

  // https://cartodb-basemaps-c.global.ssl.fastly.net/dark_nolabels/6/18/23.png
  var baseLayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  });


  var map = this.map = L.map(node.getElementsByClassName("city-map")[0], {
    scrollWheelZoom: false,
    center: config.center.reverse(),
    zoom: config.zoom,
    attributionControl: false,
  });

  this.map.addLayer(baseLayer);
  this.addStationLayer(map);
};


GeoMultiple.prototype.addStationLayer = function() {
  var self = this;
  var config = this.config;
  var map = this.map;
  var stations = this.stations = {};

  if (config.stickoxide !== undefined) {
    config.stickoxide.stations.forEach(function(station){
      station.timeseries.data = station.timeseries.data.map(makeNum);

      var pos = station.feature.geometry.coordinates.reverse();
      station.visible = true;
      stations[station.id] = L.circleMarker(pos, {
        radius: 5,
        fillColor: colorScale(0),
        color: colorScale(0),
      }).addTo(map);
    });

    config.stickoxide.summary.timeseries.data = config.stickoxide.summary.timeseries.data.map(makeNum);
    self.summarySparkLine(d3.select(self.node).select(".city-sparkline"), config.stickoxide.summary.timeseries);

    self.config.dispatcher.on("datechange.stations-" + self.config.id, function(date) {
        self.updateDate(date);
    });

    self.config.dispatcher.datechange(new Date(config.stickoxide.stations[0].timeseries.start));
  }
};

GeoMultiple.prototype.updateDate = function(date) {
  var self = this;
  this.config.stickoxide.stations.forEach(function(station){
    var start = (new Date(station.timeseries.start)).getTime();
    var pivot = Math.floor((date.getTime() - start) / (1000 * station.timeseries.interval));
    var val = station.timeseries.data[pivot];

    if (!val && val !== 0.0) {
      if (station.visible) {
        self.map.removeLayer(self.stations[station.id]);
        station.visible = false;
      }
    } else {
      if (!station.visible) {
        self.map.addLayer(self.stations[station.id]);
        station.visible = true;
      }
      self.stations[station.id].setStyle({
        fillColor: colorScale(val),
        color: colorScale(val),
        opacity: 0.9
      });
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
