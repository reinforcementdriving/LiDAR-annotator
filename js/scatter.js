var data;
var zoomBeh; 
var isZoomOff = false;
var xMax, xMin, yMax, yMin, zMin, zMax;
var svg;
var xAxis, yAxis;
var newBox;
var startDraw;
var boundingBoxes = [];
var boxId = 0;
var xScale, yScale;
init();

var margin = { top: 50, right: 300, bottom: 50, left: 50 },
    outerWidth = 1200,
    outerHeight = 600,
    width = outerWidth - margin.left - margin.right,
    height = outerHeight - margin.top - margin.bottom;

var x = d3.scale.linear()
    .range([0, width]).nice();

var y = d3.scale.linear()
    .range([height, 0]).nice();

function drawMode() {
  newBox = new Square();
  startDraw = svg.on("mousedown", function() {setAnchor(newBox);})
  .on("mousemove", function() {drawBox(newBox);})
  .on("mouseup", function() {setBox(newBox);});
}
function toggleZoom() {
  if (isZoomOff) {
    x = xScale;
    y = yScale;
    xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickSize(-height);

    yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickSize(-width);
    svg.call(zoomBeh = d3.behavior.zoom()
        .x(x)
        .y(y)
        .scaleExtent([0, 500])
        .on("zoom", zoom));
    startDraw.on("mousedown", null)
      .on("mousemove", null)
      .on("mouseup", null);
  } else {
      xScale = x.copy();
      yScale = y.copy();
      zoomBeh.on("zoom", null);
      drawMode();
  }
  isZoomOff = !isZoomOff;
  // console.log(isZoomOff);
}

function render() {
      xMax = d3.max(data, function(d) { return d["x"]; }) * 1.05,
      xMin = d3.min(data, function(d) { return d["x"]; }),
      xMin = xMin > 0 ? 0 : xMin,
      yMax = d3.max(data, function(d) { return d["y"]; }) * 1.05,
      yMin = d3.min(data, function(d) { return d["y"]; }),
      yMin = yMin > 0 ? 0 : yMin,
      zMin = d3.min(data, function(d) { return d["z"]; }),
      zMax = d3.max(data, function(d) { return d["z"]; });
    x.domain([xMin, xMax]);
    y.domain([yMin, yMax]);

    xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickSize(-height);

    yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickSize(-width);

    // var color = d3.scale.category10();

    var tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-10, 0])
        .html(function(d) {
          return "x" + ": " + d.x + "<br>" + "y" + ": " + d.y;
        });

    zoomBeh = d3.behavior.zoom()
        .x(x)
        .y(y)
        .scaleExtent([0, 500])
        .on("zoom", zoom);

    svg = d3.select("#scatter")
      .append("svg")
        .attr("width", outerWidth)
        .attr("height", outerHeight)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoomBeh);

    svg.call(tip);

    svg.append("rect")
      .attr("width", width)
      .attr("height", height);

    svg.append("g")
      .classed("x axis", true)
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .append("text")
      .classed("label", true)
      .attr("x", width)
      .attr("y", margin.bottom - 10)
      .style("text-anchor", "end")
      .text("x");

    svg.append("g")
      .classed("y axis", true)
      .call(yAxis)
      .append("text")
      .classed("label", true)
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("y");

    var objects = svg.append("svg")
      .classed("objects", true)
      .attr("width", width)
      .attr("height", height);

    objects.append("svg:line")
      .classed("axisLine hAxisLine", true)
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", width)
      .attr("y2", 0)
      .attr("transform", "translate(0," + height + ")");

    objects.append("svg:line")
      .classed("axisLine vAxisLine", true)
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", height);

 

  objects.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .classed("dot", true)
      .attr("r", function (d) { return 6 * Math.sqrt(1 / Math.PI); })
      .attr("transform", transform)
      .style("fill", function(d) { return d3.interpolateRdGy((d.z + zMin) / zMax); })
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide);

  var legend = svg.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .classed("legend", true)
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("circle")
      .attr("r", 3.5)
      .attr("cx", width + 20)
      .attr("fill", color);

  legend.append("text")
      .attr("x", width + 26)
      .attr("dy", ".35em")
      .text(function(d) { return d; });

  d3.select("input").on("click", change);
}
// });

function change() {
  // xCat = "Carbs";
  xMax = d3.max(data, function(d) { return d[xCat]; });
  xMin = d3.min(data, function(d) { return d[xCat]; });

  zoomBeh.x(x.domain([xMin, xMax])).y(y.domain([yMin, yMax]));

  var svg = d3.select("#scatter").transition();

  // svg.select(".x.axis").duration(750).call(xAxis).select(".label").text(xCat);

  objects.selectAll(".dot").transition().duration(1000).attr("transform", transform);
  // objects.selectAll("#newBox").transition().duration(1000).attr("transform", function () { return "translate(" + x(center.x) + "," + y(center.y) + ")"; });
}

function zoom() {
  svg.select(".x.axis").call(xAxis);
  svg.select(".y.axis").call(yAxis);

  svg.selectAll(".dot")
      .attr("transform", transform);
  
  // var titleTransform = d3.transform(d3.select("#newBox").attr("transform"));
  // console.log(titleTransform);
  // titleTransform.translate = [];
  // console.log(x(newBox.abs0.x) - newBox.topLeft.x);
  // svg.selectAll("#newBox")
  //   .attr("transform", "translate(" + x(newBox.abs0.x) + "," + y(newBox.abs0.y) + ")");
  // svg.selectAll("#newBox")
  //   .attr("transform", "translate(" + (x(newBox.abs0.x) - newBox.topLeft.x) + "," + (y(newBox.abs0.y) - newBox.topLeft.y) + ")");
  for (var i = 0; i < boundingBoxes.length; i++) {
    var boundingBox = boundingBoxes[i];
    svg.selectAll("#box-" + i)
    .attr("x", x(boundingBox.abs0.x))
    .attr("y", y(boundingBox.abs0.y))
    .attr("width", Math.abs(x(boundingBox.abs0.x) - x(boundingBox.abs1.x)))
    .attr("height", Math.abs(y(boundingBox.abs0.y) - y(boundingBox.abs1.y)));
  }
  // svg.selectAll(".boundingBox")
  //   .attr("x", x(newBox.abs0.x))
  //   .attr("y", y(newBox.abs0.y))
  //   .attr("width", Math.abs(x(newBox.abs0.x) - x(newBox.abs1.x)))
  //   .attr("height", Math.abs(y(newBox.abs0.y) - y(newBox.abs1.y)));
  // var boxX = svg.select("#newBox").attr("x");
  // var boxY = svg.select("#newBox").attr("y");
  // newBox.abs0 = x.invert(boxX);
  // newBox.abs1 = y.invert(boxY);
}

function invert(box) {
  box.abs0 = {
      x: x.invert(box.p0.x),
      y: y.invert(box.p0.y)
    };
  box.abs1 = {
      x: x.invert(box.p1.x),
      y: y.invert(box.p1.y)
    };
  // box.abs1 = {
  //       x: x.invert(box.p1.x - box.p0.x) + box.abs0.x - x.invert(0),
  //       y: y.invert(box.p1.y - box.p0.y) + box.abs0.y - y.invert(0)
  //     };
}
function transform(d) {
  return "translate(" + x(d.x) + "," + y(d.y) + ")";
}

function init() {
  document.getElementById( 'file_input' ).addEventListener( 'change', upload_file, false );
  document.getElementById( 'draw_mode' ).addEventListener( 'click', toggleZoom, false );
  document.getElementById( 'export' ).addEventListener( 'click', exportBoxes, false );
}

function upload_file() {
    var x = document.getElementById("file_input");
    if (x.files.length > 0) {
        var file = x.files[0];
        load_text_file(file);
    }
}

function load_text_file(text_file) {
  if (text_file) {
    var text_reader = new FileReader();
    text_reader.readAsArrayBuffer(text_file);
    text_reader.onload = readData;
    image_loaded = true;
  }
}

function readData(e) {
  var rawLog = this.result;
  var floatarr = new Float32Array(rawLog)
  data = [];
  var stride = 16;
  for (var i = 0; i < floatarr.length; i += 4 * stride) {
    var d = new Object();
    d.x = floatarr[i];
    d.y = floatarr[i + 1];
    d.z = floatarr[i + 2];
    data.push(d);
  }
  console.log(data[0]);
  render();
}

function exportBoxes() {
  var outputBoxes = []
  for (var i = 0; i < boundingBoxes.length; i++) {
    outputBoxes.push(new OutputSquare(boundingBoxes[i]));
  }
  var output = {"bounding boxes": outputBoxes};
  var stringifiedOutput = JSON.stringify(output);
  var file = new File([stringifiedOutput], "test.json", {type: "/json;charset=utf-8"});
  saveAs(file);
}


function getTopLeft(p0, p1) {
  var topLeft = {
    x: Math.min(p0.x, p1.x),
    y: Math.min(p0.y, p1.y)
  };
  return topLeft;
}

function getHeight(p0, p1) {
  return Math.abs(p0.y - p1.y);
}

function getWidth(p0, p1) {
  return Math.abs(p0.x - p1.x);
}

function getCenter(p0, p1) {
  var center = {
    "x": (p0.x + p1.x) / 2,
    "y": (p0.y + p1.y) / 2
  };
  return center;
}

function OutputSquare(box) {
  this.center = getCenter(box.abs0, box.abs1);
  this.height = getHeight(box.abs0, box.abs1);
  this.width = getWidth(box.abs0, box.abs1);
}

function Square() {
  // var corner1, corner2, corner3, corner4;
  this.p0 = {x: 0 ,y: 0};
  this.p1 = {x: 0, y: 0};
  this.abs0 = {x: 0, y: 0};
  this.abs1 = {x: 0, y: 0};
  this.topLeft = {x: 0, y: 0};
  this.isDrawing = false;
  this.isDragging = false;
  this.container = svg;
  }

  // set anchor point on mousedown
  function setAnchor(box) {
    // console.log("mousedown");
    if (box.isDrawing) return;
    box.isDrawing = true;
    var cursor = d3.mouse(svg.node());
    box.p0 = {
      x: cursor[0],
      y: cursor[1]
    };
    box.abs0 = {
      x: xScale.invert(cursor[0]),
      y: yScale.invert(cursor[1])
    };
    // console.log("x: ", xScale.invert(cursor[0]));
    // console.log("y: ", yScale.invert(cursor[1]));
    // console.log("startDraw: ", box.startDraw);
    startDraw.on("mousedown", null);
    svg.select(".objects").append('rect')
      .attr("class", "newBox")
      
  }

  // draws box on mousemove
  function drawBox(box) {
    // console.log("mousemove");
    if (box.isDrawing) {
      var cursor = d3.mouse(svg.node());
      box.p1 = {
        x: cursor[0],
        y: cursor[1]
      };
      // box.abs1 = {
      //   x: x.invert(box.p1.x - box.p0.x) + box.abs0.x - x.invert(0),
      //   y: y.invert(box.p1.y - box.p0.y) + box.abs0.y - y.invert(0)
      // };
      box.abs1 = {
        x: xScale.invert(cursor[0]),
        y: yScale.invert(cursor[1])
      };
      box.topLeft = getTopLeft(box.p0, box.p1);
      // console.log("x: ", xScale.invert(cursor[0]));
      // console.log("y: ", yScale.invert(cursor[1]));
      // console.log("p0: ", p0);
      // console.log("p1: ", p1);
      // console.log("center: ", topLeft);      
      // console.log("width: ", getWidth(p0, p1));
      // console.log("height: ", getHeight(p0, p1));
      svg.select('.objects').select(".newBox")
        .attr("x", box.topLeft.x)
        .attr("y", box.topLeft.y)
        .attr("width", getWidth(box.p0, box.p1))
        .attr("height", getHeight(box.p0, box.p1))
    }
    
  }


  // sets box corners on mouseup
  function setBox(box) {
    // console.log("abs: ", box.abs0, box.abs1);
    box.isDrawing = false;
    box.isDragging = true;
    // re-order points so that _0 is always top left and _1 always bottom right
    var temp0 = box.abs0;
    var temp1 = box.abs1;
    box.abs0 = {x: Math.min(temp0.x, temp1.x), y: Math.max(temp0.y, temp1.y)};
    box.abs1 = {x: Math.max(temp0.x, temp1.x), y: Math.min(temp0.y, temp1.y)};
    temp0 = box.p0;
    temp1 = box.p1;
    box.p0 = {x: Math.min(temp0.x, temp1.x), y: Math.max(temp0.y, temp1.y)};
    box.p1 = {x: Math.max(temp0.x, temp1.x), y: Math.min(temp0.y, temp1.y)};
    // var newBox = box.container.select('#newBox');
    startDraw.on("mousemove", null).on("mouseup", null);
    svg.select('.objects').select(".newBox")
      .attr("class", "boundingBox")
      .attr("id", "box-" + boxId);
    boxId += 1;
    boundingBoxes.push(box);
    drawMode();
  }

