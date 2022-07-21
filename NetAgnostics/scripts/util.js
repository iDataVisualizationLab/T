var diameter = 1000,
    radius = diameter / 2,
    innerRadius = radius - 120;
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Add color legend
var yTimeBox = 0;

var colorArray = ["#9dbee6", "#afcae6", "#c8dce6", "#e6e6d8", "#e6d49c", "#e6852f", "#e61e1a"];

var colorRedBlue = d3.scaleLinear()
    .domain([0,0.2, 0.4, 0.6, 0.8, 0.9, 1])
    .range(colorArray);

var categories = ["Sudden Increase", "Sudden Drop"];

function drawColorLegend() {
    var xx = 11;
    var rr = 5;

    // Scagnostics color legend ****************
    //Append a defs (for definition) element to your SVG
    var defs = svg.append("defs");
    //Append a linearGradient element to the defs and give it a unique id
    var linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");
    //Horizontal gradient
    linearGradient
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%")
    var yScagLegend = 50;
    var wScagLegend = 160;
    var measureName = metaData.listOfVariables[var1]+"_Net";
    var netMin = metaData.listOfMins_Net[var1];
    var netMax = metaData.listOfMaxs_Net[var1];

    colorRedBlue = d3.scaleLinear()
        .domain([netMin,netMin/2, netMin/4, 0, netMax/4, netMax/2, netMax])
        .range(colorArray);

    for (var i = 0; i < colorArray.length; i++) {
        var percent = i * 16;
        linearGradient.append("stop")
            .attr("offset", percent + "%")
            .attr("stop-color", colorArray[i]); //dark blue
    }

    //Draw the rectangle and fill with gradient
    svg.append("rect")
        .attr("x", 11)
        .attr("y", yScagLegend + 5)
        .attr("width", wScagLegend)
        .attr("height", 20)
        .style("fill", "url(#linear-gradient)");

    svg.append("text")
        .attr("x", wScagLegend / 2 + 8)
        .attr("y", yScagLegend)
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("fill", "#000")
        .text(measureName);
    svg.append("text")
        .attr("x", 2)
        .attr("y", yScagLegend + 19)
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .style("text-anchor", "left")
        .style("font-weight", "bold")
        .style("fill", "#000")
        .text(netMin);
    svg.append("text")
        .attr("x", wScagLegend + 12)
        .attr("y", yScagLegend + 19)
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .style("text-anchor", "left")
        .style("font-weight", "bold")
        .style("fill", "#000")
        .text(netMax);

    // Draw color legend **************************************************
    var yScagLegend2 = 400;
    svg.selectAll(".legendCircle").remove();
    svg.selectAll(".legendCircle")
        .data(categories).enter()
        .append("circle")
        .attr("class", "legendCircle")
        .attr("cx", xx - 3)
        .attr("cy", function (d, i) {
            return yScagLegend2 + i * 16;
        })
        .attr("r", rr)
        .style("fill", function (d, i) {
            if (i == 0) return colorAbove;
            else if (i == 1) return colorBelow;
            else return "#000";
        });
    svg.selectAll(".legendText").remove();
    svg.selectAll(".legendText")
        .data(categories).enter()
        .append("text")
        .attr("class", "legendText")
        .attr("x", xx + 5)
        .attr("y", function (d, i) {
            return yScagLegend2 + i * 16 + 2;
        })
        .text(function (d) {
            return d;
        })
        .attr("dy", ".21em")
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .style("text-anchor", "left")
        .style("fill", function (d, i) {
            if (i == 0) return colorAbove;
            else if (i == 1) return colorBelow;
            else return "#000";
        });
}


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var listX;
function drawTimeGrid() {
    listX = [];
    for (var i = 0; i <= numMonth; i++) {
        var xx = xStep + xScale(i);
        var obj = {};
        obj.x = xx;
        obj.year = i;
        listX.push(obj);
    }
    svg.selectAll(".timeLegendLine").data(listX)
        .enter().append("line")
        .attr("class", "timeLegendLine")
        .style("stroke", "#000")
        .style("stroke-opacity", 1)
        .style("stroke-width", 0.3)
        .attr("x1", function (d) {
            return d.x;
        })
        .attr("x2", function (d) {
            return d.x;
        })
        .attr("y1", 0)
        .attr("y2", 1500);
}

function drawTimeText() {
    svg.selectAll(".timeLegendText").data(listX)
        .enter().append("text")
        .attr("class", "timeLegendText")
        .style("fill", "#000")
        .style("text-anchor", "start")
        .style("text-shadow", "0px 1px 1px rgba(255, 255, 255, 1")
        .attr("x", function (d) {
            return d.x;
        })
        .attr("y", function (d, i) {
            return height - 15;
        })
        .attr("dy", ".21em")
        .attr("font-family", "sans-serif")
        .attr("font-size", "15px")
        .text(function (d, i) {
            return d.year;
        });
}

function updateTimeLegend() {
    var listX = [];

    for (var i = 0; i <= numMonth; i++) {
        var xx = xStep + xScale(i);
        var obj = {};
        obj.x = xx;
        obj.year = i;
        listX.push(obj);
    }

    svg.selectAll(".timeLegendLine").data(listX).transition().duration(transitionTime)
        .style("stroke-dasharray", function (d, i){
                return i % 12 == 0 ? "3, 1" : "1, 3"
        })
        .style("stroke-opacity",1)
        .attr("x1", function (d) {
            return d.x;
        })
        .attr("x2", function (d) {
            return d.x;
        });
    svg.selectAll(".timeLegendText").data(listX).transition().duration(transitionTime)
        .style("fill-opacity", function (d, i) {
            return getOpacity(d, i);
        })
        .attr("x", function (d, i) {
            return d.x;
        });

    // ************************************SCALE force layouts ************************************
    // snapshotScale = 0.10;
    for (var i = 0; i <= numMonth; i++) {
           var m = i;
            var view = "0 0 " + forceSize + " " + forceSize;
            if (lensingTimeStep - numLens <= m && m <= lensingTimeStep + numLens)
                view = (forceSize * (1 - snapshotScale) / 2) + " " + (forceSize * (1 - snapshotScale) / 2) + " " + (forceSize * snapshotScale) + " " + (forceSize * snapshotScale);
            else if (lensingTimeStep - numLens == m + 1) {
                var snapshotScale2 = snapshotScale * 1.8;
                view = (forceSize * (1 - snapshotScale2 * 1.03) / 2) + " " + (forceSize * (1 - snapshotScale2) / 2) + " " + (forceSize * snapshotScale2) + " " + (forceSize * snapshotScale2);
            } else if (m - 1 == lensingTimeStep + numLens) {
                var snapshotScale2 = snapshotScale * 1.8;
                view = (forceSize * (1 - snapshotScale2 / 1.04) / 2) + " " + (forceSize * (1 - snapshotScale2) / 2) + " " + (forceSize * snapshotScale2) + " " + (forceSize * snapshotScale2);
            }
            svg.selectAll(".force" + m).transition().duration(transitionTime)
                .attr("x", xStep - forceSize / 2 + xScale(m))
                .attr("viewBox", view);
    }
}

// Used in util.js and main.js *****************
function getOpacity(d, i) {
    if (i % 12 == 0)
        return 0.7;
    else {
        if (isLensing && lensingTimeStep - numLens <= i && i <= lensingTimeStep + numLens)
            return 1;
        else
            return 0;
    }
}


function drawTimeBox() {
    svg.append("rect")
        .attr("class", "timeBox")
        .style("fill", "#666")
        .style("fill-opacity", 0.5)
        .attr("x", xStep)
        .attr("y", yTimeBox - 1)
        .attr("width", width - xStep)
        .attr("height", 30)
        .on("mouseout", function () {
            //isLensing = false;
            //coordinate = d3.mouse(this);
            //lMonth = Math.floor((coordinate[0] - xStep) / XGAP_);
        })
        .on("mousemove", function () {
            isLensing = true;
            coordinate = d3.mouse(this);
            lensingTimeStep = Math.floor((coordinate[0] - xStep) / XGAP_);
            // Update layout
            updateTimeLegend();
            updateTimeBox();
        });
}

function updateTimeBox() {
    svg.selectAll(".timeLegendText")
        .attr("y", function (d, i) {
            return yTimeBox + 18;
        })
        .attr("x", function (d, i) {
            return d.x;
        })
    ;
    // Recompute the timeArcs
    if (oldLmonth != lensingTimeStep) {
        updategraph2();
        oldLmonth = lensingTimeStep;
    }
}

function clearLensing() {
    isLensing = false;
    oldLmonth = -1000;
    lensingTimeStep = -lensingMul * 2;
    // Update layout
    updateTimeLegend();
    updateTimeBox();
}

function minMaxScaling() {
    if (document.getElementById("checkboxMinMax").checked) {
        MinMaxScaling =  true;
    }
    else{
        MinMaxScaling =  false;
    }
}

function autoLensing() {
    if (document.getElementById("checkbox1").checked) {
        isLensing = true;
        //get the lensing order option
        let orderOptionIdx = document.getElementById("nodeDropdown").selectedIndex;
        if (orderOptionIdx === 0) {
            //Outliers
            lensingTimeStep = countryList.maxYearBelow;
        } else if (orderOptionIdx === 1) {
            //Inliers
            lensingTimeStep = countryList.maxYearAbove;
        } else {
            //Both
            lensingTimeStep = countryList.maxYearAbsolute;
        }
        // Update layout
        updateTimeLegend();
        updateTimeBox();
    } else {
        clearLensing();
    }
}

function showScore() {
    if (document.getElementById("checkbox2").checked) {
        svg.selectAll(".maxAboveText").transition().duration(transitionTime)
            .attr("font-size", "11px");
        svg.selectAll(".maxBelowText").transition().duration(transitionTime)
            .attr("font-size", "11px");
    } else {
        svg.selectAll(".maxAboveText").transition().duration(transitionTime)
            .attr("font-size", "0px");
        svg.selectAll(".maxBelowText").transition().duration(transitionTime)
            .attr("font-size", "0px");
    }
}


// Control panel on the left *********************
function addVariable_to_dropdown() {
    //  List Dropdown *********************
    var listOptions = [];
    for (let v = 0; v < metaData.listOfVariables.length; v++) {
        var opt = {"id": v+1, "value": metaData.listOfVariables[v]};
        listOptions.push(opt);
    }
    var selectOrder = d3.select('#varPrimary').on('change', updategraph2);
    var Orderoptions = selectOrder.selectAll('option').data(listOptions).enter().append('option').attr('value', function (d) {
        return d.id;
    }).text(function (d) {
        return d.value;
    })
    Orderoptions.property("selected",metaData.listOfVariables[9]);
    

    //  Secondary Dropdown *********************
    var select = d3.select('#varSecondary').on('change', updategraph2)
    var options = select.selectAll('option').data(listOptions).enter().append('option').attr('value', function (d) {
        return d.id;
    }).text(function (d) {
        return d.value;
    })
    select.property("selected",8);
}
