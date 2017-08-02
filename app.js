var width = 600, height = 100;
var testwidth = 300, testheight = 200;
var testgcolors = ["brown","cornflowerblue","darkcyan"];
var svg = d3.select("#slider")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

var widthYM = 600, heightYM = 600;
var svgYM = d3.select("#yearxmonth")
    .append("svg")
    .attr("width", widthYM)
    .attr("height", heightYM);

var svgDepthWidth = 600, svgDepthHeight = 600;


function round(number, places=1){
  return Math.round(number * Math.pow(10,places))/(Math.pow(10,places));
}

var a;

d3.csv("quakes.csv", function(err, data){
  if(err){
    console.log("Something wrong happened:", err);
  } else{

    //Some data processing to calculate mean magnitude for each year
    //This mean is fed to the colorScale function to calculate the fill value
    var nestedByYear = d3.nest()
      .key(function(d) { return +d.date_time.split(" ")[0]; })
      .rollup(function(d) { return {
          total:d3.sum(d, function(i) { return +i.magnitude; }),
          avg:d3.mean(d, function(i) { return +i.magnitude; }),
          mdn:d3.median(d, function(i) { return +i.magnitude; }),
          n: d.length,
          depth:d3.max(d, function(i){ return +i.depth; })
        }
      })
      .entries(data);
    nestedByYear.sort(function(x,y){ return d3.ascending(x.key, y.key) })


    //Calculate starting and ending years using min and max
    //TODO: Replace the below two lines with d3.extent function
    //console.log(d3.extent(nestedByYear, function(d){ return d.key; }))
    var fromYear = +d3.min(nestedByYear, function(d){ return d.key; });
    var toYear = +d3.max(nestedByYear, function(d){ return d.key; });

    //We calcuate max of total, average and number of quakes for each year
    //We will use these values to create scales
    var totalMax = +d3.max(nestedByYear, function(d){ return d.value.total; })
    var avgMax = +d3.max(nestedByYear, function(d){ return d.value.avg; })
    var mdnMax = +d3.max(nestedByYear, function(d){ return d.value.mdn; })
    var nMax = +d3.max(nestedByYear, function(d){ return d.value.n; })

    //Create scales based on above values
    var totalScale = d3.scaleLinear().domain([0,totalMax]).range([testheight,0]);
    var avgScale = d3.scaleLinear().domain([0,avgMax]).range([testheight,0]);
    var mdnScale = d3.scaleLinear().domain([0,mdnMax]).range([testheight,0]);
    var nScale = d3.scaleLinear().domain([0,nMax]).range([testheight,0]);
    //The data is stored in sequence n, avg, total
    var scalesArray = [nScale, avgScale, totalScale];

    //Store all years between fromYear and toYear in an array
    //This will be used as data for rects inside slider
    var years = []
    for(var i=fromYear; i<=toYear; i++){
      years.push(i);
    }

    //For animation
    var lastY = [testheight+30,testheight+30,testheight+30];

    //TODO: Replace the below two lines with d3.extent function
    //d3.extent(nestedByYear, function(d){ return d.value; });
    var minMagnitude = +d3.min(nestedByYear, function(d){ return d.value.total; });
    var maxMagnitude = +d3.max(nestedByYear, function(d){ return d.value.total; });

    //Create year and color scales
    //yearScale will be used to draw rects
    //colorScale will be used to determine fill color of each rect
    var yearScale = d3.scaleLinear().domain([fromYear,toYear]).range([0, 0.8*width]);
    var colorScale = d3.scaleLinear()
      .domain([minMagnitude,
        minMagnitude+(maxMagnitude-minMagnitude)/8,
        minMagnitude+(maxMagnitude-minMagnitude)/4,
        maxMagnitude])
      .range(["khaki","gold","goldenrod","red"]);

    //Insert rectangles and text in SVG
    var gSelection = svg.selectAll("g").data(years).enter().append("g");

    // var aa = d3.select("#test").append("svg").attr("width",100).attr("height",100)
      // .append("text").data([19]).text(function(d){return d;}).attr("x",50).attr("y",50);

    gSelection.append("rect")
      .attr("x", function(d) { return yearScale(d); })
      .attr("y",0)
      .attr("width",width/years.length)
      .attr("height",height)
      .attr("fill", getColorForYear)
      .on("click", onYearClicked);
    gSelection.append("text")
      .attr("text-anchor","middle")
      .attr("x", function(d) { return yearScale(d); })
      .attr("y", height/2+(width/years.length)-8)
      .attr("transform", function(d){ return "rotate(-90," + yearScale(d) + "," + height/2 + ")" })
      .attr("font-size","13px")
      .text( function(d) { return d; } )
      .on("click", onYearClicked);

    function onYearClicked(d,i){
      var svg = d3.select("#test").html("")
        .append("svg")
        .attr("width",testwidth).attr("height",testheight+30);

      svg.append("text")
        .attr("text-anchor","middle")
        .attr("x", testwidth/2)
        .attr("y", 20)
        .attr("font-size","15px")
        .text("Year: " + d);

      var g = svg.selectAll("g")
        .data([nestedByYear[i].value.n, nestedByYear[i].value.avg, nestedByYear[i].value.total])
        .enter()
        .append("g");

      g.append("rect")
        .attr("x",function(d,i){ return (testwidth/3)*i; })
        .attr("y", function(d,i){ return lastY[i]; })
        .attr("width",100)
        .attr("height",function(d,i){ return testheight+30-lastY[i]; })
        .transition()
        .attr("x",function(d,i){ return (testwidth/3)*i; })
        .attr("y", function(d,i){ lastY[i]=30+scalesArray[i](d); return 30+scalesArray[i](d); })
        .attr("width",100)
        .attr("height",function(d,i){ return testheight-scalesArray[i](d); })
        .attr("fill",function(d,i){ return testgcolors[i]; });

      g.append("text")
        .attr("text-anchor","middle")
        .attr("x", function(d,i){ return 50+100*i; })
        .attr("y", 50)
        .attr("font-size","15px")
        .text(function(d){ return round(d,2); });

      g.append("text")
        .attr("text-anchor","middle")
        .attr("x", function(d,i){ return 50+100*i; })
        .attr("y", 30+testheight-10)
        .attr("font-size","15px")
        .classed("whiteText",true)
        .text(function(d,i){ return ["Number","Mean","Sum"][i]; });


            // .text(function(d){return d.n + "," + round(d.avg) + "," + round(d.total);})
            // .attr("x",5)
            // .attr("y",50);
    }

    function getColorForYear(d,i){
      return colorScale(nestedByYear[i].value.total);
    }

    //Code for second diagram
    //We do two-level nesting to get data for each month for each year
    var nestedByYearMonth = d3.nest()
      .key(function(d) { return +d.date_time.split(" ")[0]; })
      .key(function(d) { return +d.date_time.split(" ")[1]; })
      .rollup(function(d) { return d3.sum(d, function(i) { return i.magnitude; }) })
      .entries(data);
    nestedByYearMonth.sort(function(x,y){ return d3.ascending(x.key, y.key) })
    for(var i=0; i<nestedByYearMonth.length;i++){
      nestedByYearMonth[i].values.sort(function(x,y){ return d3.ascending(+x.key, +y.key) });
    }

    var minMonthlyMagnitude = d3.min(nestedByYearMonth, function(d){
      return d3.min(d.values, function(d) { return d.value; });
    })
    var maxMonthlyMagnitude = d3.max(nestedByYearMonth, function(d){
      return d3.max(d.values, function(d) { return d.value });
    })
    var colorScaleMonth = d3.scaleLinear()
      .domain([minMonthlyMagnitude,
        minMonthlyMagnitude+(maxMonthlyMagnitude-minMonthlyMagnitude)/6,
        minMonthlyMagnitude+(maxMonthlyMagnitude-minMonthlyMagnitude)/3,
        maxMonthlyMagnitude])
      .range(["green","yellow","orange","red"]);


    var gYearMonth = svgYM.selectAll("g").data(nestedByYearMonth).enter().append("g");

    gYearMonth.selectAll(".yeartext")
      .data(years)
      .enter()
      .append("text")
      .classed("yeartext", true)
      .attr("x",0)
      .attr("y",function(d,i){ return 40 + i*(heightYM-20)/years.length})
      .attr("font-size","13px")
      .text( function(d) { return d; } );

    gYearMonth.selectAll(".monthtext")
      .data(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"])
      .enter()
      .append("text")
      .classed("monthtext", true)
      .attr("text-anchor","middle")
      .attr("x", function(d,i){ return 40 + i*((widthYM-40)/12) + (widthYM-40)/24; })
      .attr("y", 15)
      .attr("font-size","13px")
      .text( function(d) { return d; } );

    //Note that we dynamically set the data for each g selection below
    //Since we do not store the index of each data array, we need a workout to set y
    //We keep a count using t
    var t = -1;
    gYearMonth.selectAll("g")
      .data(function(d,i) { return nestedByYearMonth[i].values; })
      .enter()
      .append("g")
      .append("rect")
      .attr("x", function(d,i) { return 40+i*((widthYM-40)/12); })
      .attr("y", function() { t++; return (20+Math.floor(t/12)*((heightYM-20)/years.length));  })
      .attr("width", widthYM/12)
      .attr("height", heightYM/(years.length))
      .attr("fill", function(d){ return colorScaleMonth(d.value) });

    //Last part: We built a plot of depth vs magnitude
    //We create a nested object based on (rounded) magnitude
    var nestedByMag = d3.nest()
      .key(function(d){ return round(d.magnitude)})
      .rollup(function(d){
        var arr = [];
        for(var i=0;i<d.length;i++){
          arr.push(d[i].depth);
        }
        return arr;
      })
      .object(data);

    var gDepthMag = d3.select("#depthxmag").append("svg")
      .attr("width", svgDepthWidth)
      .attr("height", svgDepthHeight+10)
      .append("g");

    var xScale = d3.scaleLinear().domain([0,Object.keys(nestedByMag).length]).range([0,svgDepthWidth]);
    var magScale = d3.scaleLinear()
      .domain([0,d3.max(Object.keys(nestedByMag))])
      .range([svgDepthHeight/3,0]);
    var depthScale = d3.scaleLinear()
      .domain([0,d3.max(nestedByYear, function(d){ return +d.value.depth; })])
      .range([svgDepthHeight,svgDepthHeight/3]);
    var w = svgDepthWidth/Object.keys(nestedByMag).length-1;

    gDepthMag.selectAll(".magRect")
      .data(Object.keys(nestedByMag).sort())
      .enter()
      .append("rect")
      .attr("x",function(d,i){ return xScale(i); })
      .attr("y",function(d){ return magScale(d); })
      .attr("width",w)
      .attr("height",function(d){ return svgDepthHeight/3-magScale(d); })
      .classed("magRect",true);

    gDepthMag.selectAll(".magText")
      .data(Object.keys(nestedByMag).sort())
      .enter()
      .append("text")
      .classed("magText",true)
      .attr("text-anchor","middle")
      .attr("font-size","10px")
      .attr("x",function(d,i){ return xScale(i) + w/2; })
      .attr("y", svgDepthHeight/3-15)
      .attr("transform", function(d,i){
        return "rotate(-90," + (xScale(i) + w/2) + "," + (svgDepthHeight/3-18) + ")";
      })
      .text(function(d){ return d; });

    var gDepth = gDepthMag.selectAll(".depthG")
      .data(Object.keys(nestedByMag).sort())
      .enter()
      .append("g")
      .attr("transform", function(d,i){ return "translate(" + xScale(i) + "," + "0)"; })
      .classed("depthG",true);


    gDepth.selectAll("rect")
      .data(function(d){ return nestedByMag[d]; })
      .enter()
      .append("rect")
      .attr("x",0)
      .attr("y",function(d){ return depthScale(d)-3; })
      .attr("height",6)
      .attr("width",w);

    //--#--#--#--#--#--#--#--//
    //--Code for quaky axis--//
    //--#--#--#--#--#--#--#--//
    var wQuakyAxis = 800, hQuakyAxis = 800;
    var gQuakyAxis=d3.select("#quakyaxis").append("svg")
      .attr("width",wQuakyAxis).attr("height",hQuakyAxis)
      .append("g");
    var parseTime = d3.timeParse("%Y %m %d %H %M %S");
    var formatTime = d3.timeFormat("%m-%Y");

    data.forEach(function(d){
      d.date_time = parseTime(d.date_time);
      //d.date_time = formatTime(d.date_time);
      d.longitude = +d.longitude;
      d.latitude = +d.latitude;
      d.magnitude = +d.magnitude;
      d.depth = +d.depth;
      d.no = +d.no;
    });
    data.sort(function(x,y){ return d3.ascending(x.date_time, y.date_time); })

    dateExtent = d3.extent(data, function(d){ return d.date_time; });
    magnitudeMax = d3.max(data, function(d){ return d.magnitude; });
    depthMax = d3.max(data, function(d){ return d.depth; });
    depthMin = d3.min(data, function(d){ return d.depth; });


    var margin = {top: 10, right: 20, bottom: 50, left: 50},
    widthInner = wQuakyAxis - margin.left - margin.right,
    heightInner = hQuakyAxis - margin.top - margin.bottom;

    var x = d3.scaleTime().domain(dateExtent).range([0, widthInner*120]);
    var yMagnitude = d3.scaleLinear().domain([0,magnitudeMax]).range([300,0]);
    var yDepth = d3.scaleLinear().domain([0,depthMax]).range([300,heightInner]);

    gQuakyAxis.attr("transform","translate("+margin.left+","+margin.top+")");

    var colorScaleMag = d3.scaleLinear()
      .domain([4,
        4+(magnitudeMax-4)/8,
        4+(magnitudeMax-4)/4,
        magnitudeMax])
      .range(["khaki","gold","goldenrod","red"]);

    var colorScaleDepth = d3.scaleLinear()
      .domain([depthMin,
        depthMin+(depthMax-depthMin)/8,
        depthMin+(depthMax-depthMin)/4,
        depthMax])
      .range(["midnightblue","lightseagreen","lightblue","lightcyan"]);

    var gInner = gQuakyAxis.append("g")
      .attr("x",0)
      .attr("y",0);

    var gXAxis = gInner.append("g")
      .attr("class", "axis")
      .attr("transform","translate(0,"+300+")")
      .call(d3.axisBottom(x).tickFormat(formatTime).ticks(d3.timeMonth.every(1)));

    gXAxis.selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-25)");

    gInner.selectAll(".magRectMoving").remove()
      .data(data)
      // .data(data.filter(function(d){ return (x(d.date_time)>=0 && x(d.date_time)<=widthInner); }))
      .enter()
      .append("rect")
      .classed("magRectMoving",true)
      .attr("x",function(d){ return x(d.date_time)-5; })
      .attr("y",function(d){ return yMagnitude(d.magnitude); })
      .attr("width",10)
      .attr("height",function(d){ return 300-yMagnitude(d.magnitude); })
      .attr("fill",function(d){ return colorScaleMag(d.magnitude); });
    gInner.selectAll(".depthRect")
      .data(data)
      .enter()
      .append("rect")
      .classed("depthRect",true)
      .attr("x",function(d){ return x(d.date_time)-5; })
      .attr("y",300)
      .attr("width",10)
      .attr("height",function(d){ return yDepth(d.depth)-300; })
      .attr("fill", function(d){ return colorScaleDepth(d.depth); });

    gInner.transition()
      .duration(5000)
      .ease(d3.easeLinear)
      .on("start",moveLeft);



    var gYTopAxis = gQuakyAxis.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(yMagnitude));

    var gYBottomAxis = gQuakyAxis.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(yDepth));


    var translateTo = 0;
    function moveLeft(){
      translateTo -= 300;
      d3.active(this)
        .attr("transform","translate("+translateTo+",0)")
        .transition()
        .duration(15000)
        .on("start",moveLeft);
    }

    a = data;

  }
});
