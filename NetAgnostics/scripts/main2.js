/* 2022
 * Tommy Dang, Assistant professor, iDVL@TTU
 *
 * THIS SOFTWARE IS BEING PROVIDED "AS IS", WITHOUT ANY EXPRESS OR IMPLIED
 * WARRANTY.  IN PARTICULAR, THE AUTHORS MAKE NO REPRESENTATION OR WARRANTY OF ANY KIND CONCERNING THE MERCHANTABILITY
 * OF THIS SOFTWARE OR ITS FITNESS FOR ANY PARTICULAR PURPOSE.
 */


var snapshotScale = 0.265; // Snapshiot Size******************************************************

// Colors
var colorAbove = "#0a0";
var colorBelow = "#b06";
var maxAbs;
var yStart;
var yStartBoxplot;
var yTextClouds;
var boxHeight = 75;
var textCloudHeight = 75;
var transitionTime = 1000;
var countryList = [];
var countryListFiltered = [];
var profileHeight = 20;//we changed this to increase the country list distance.

var numTermsWordCloud = 6; // numTerms in each month
var boxplotHeight = 90; // numTerms in each month
var hBoxplotScale = null;
var boxplotNodes = [];


var colorPurpleGreen = d3.scaleLinear()
    .domain([0, 0, 0])
    .range([colorBelow, "#666", colorAbove]);

function computeMonthlyGraphs() {
    allSVG = []; // all SVG in clusters.js
    for (var m = 0; m < numMonth; m++) {
        // Draw network snapshot
        updateScatterplots(m);
    }
    oldLmonth = -100;  // This to make sure the histogram and text list is updated
    updateTimeLegend();
    updateTimeBox();
    drawgraph2();

}

function updategraph2() {
    updateTextClouds();
    updateBoxplots();
    updateProfiles();
}

var yScaleS = d3.scaleLinear()
    .range([0, 80])
    .domain([0, 1]);

// 2022 new function  **************************************************
var profiles =[]; // entries profiles
var lineChart = d3.line()
    .x(function (d, i) {
        return xStep + xScale(i);
    })
    .y(function (d, i) {
        if (MinMaxScaling)
            return 1 - (d.value-var1Min)*profileHeight*1.2/(var1Max-var1Min);
        else
            return 1 - d.value*profileHeight*1.2/var1Max;
    });
    //.y1(function (d, i) {
    //    if (MinMaxScaling)
    //        return d.y - (d.value-var1Min)*profileHeight/(var1Max-var1Min);
    //    else
    //        return d.y - d.value*profileHeight/var1Max;
    //});
var areaTopAbove = d3.area()
    // .interpolate(interpolation)
    .x(function (d, i) {
        return xStep + xScale(i);
    })
    .y0(function (d, i) {
        return yStartBoxplot;
    })
    .y1(function (d, i) {
        return yStartBoxplot - hBoxplotScale(d.maxAbove);
    });
var areaTopBelow = d3.area()
    // .interpolate(interpolation)
    .x(function (d, i) {
        return xStep + xScale(i);
    })
    .y0(function (d, i) {
        return yStartBoxplot;
    })
    .y1(function (d, i) {
        return yStartBoxplot - hBoxplotScale(d.maxBelow);
    });

function drawgraph2() {
    //** TEXT CLOUD **********************************************************
    yTextClouds = height + boxHeight; // 75 is the height of the text cloud section.
    drawTextClouds(yTextClouds);    // in main3.js
    //** BOX PLOT **********************************************************
    drawBoxplot();   // in main3.js
    //** COUNTRY PROFILE **********************************************************
    drawProfiles();
}


function redoProfiles() {
    drawTextClouds(yTextClouds);
    updateTextClouds();
    
    drawProfiles();
    updateProfiles();
}


// This Texts is independent from the lower text with stream graphs
var tNodes;
let lensedTextCloudRange = [10, 16];
let textCloudRange = [6, 12];
function drawTextClouds(yTextClouds) {
    tNodes = [];
    var varName = metaData.listOfVariables[var1]+"_Net";
    for (var t = 0; t < numMonth; t++) {
        var nodes = [];
        for (var c = 0; c < computes.length; c++) {
            nodes.push(computes[c]);
        }
        nodes.sort(function (a, b) {
            if (a[varName]!=undefined && b[varName]!=undefined){
                if (Math.abs(a[varName][t]) < Math.abs(b[varName][t]))
                    return 1;
                else
                    return -1;
            }
            else
                return 0;
        });

        for (var i = 0; i < numTermsWordCloud; i++) {
            tNodes.push(nodes[i]);
        }
    }
    // ************ maxAbs ************ defined in main2.js
    svg.selectAll(".textCloud3").remove();
    var yStep = 12;
    svg.selectAll(".textCloud3")
        .data(tNodes).enter()
        .append("text")
        .attr("class", "textCloud3")
        .style("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .style("font-size", function (d, i) {

            var y = Math.floor(i / numTermsWordCloud);
            if (lensingTimeStep - numLens <= y && y <= lensingTimeStep + numLens) {
                var sizeScale = d3.scale.linear()
                    .range(lensedTextCloudRange)
                    .domain([0, maxAbs]);
                return "12px";
            }
            else {
                var sizeScale = d3.scaleLinear()
                    .range(textCloudRange)
                    .domain([0, maxAbs]);
                return "2px";
            }
        })
        .style("fill", function (d, i) {
            return "#000";
            //var y = Math.floor(i / numTermsWordCloud);
            //return colorPurpleGreen(d[y + 1].OutlyingDif);
        })
        .attr("x", function (d, i) {
            return xStep + xScale(Math.floor(i / numTermsWordCloud));    // x position is at the arcs
        })
        .attr("y", function (d, i) {
            return yTextClouds + (i % numTermsWordCloud) * yStep;     // Copy node y coordinate
        })
        .text(function (d) {
            return d.name;
        });
}

function drawBoxplot() {
    boxplotNodes = [];
    for (var t = 0; t < numMonth; t++) {
        var nodes = [];
        var obj = {};
        obj.sumAbove = 0;
        obj.sumBelow = 0;
        obj.countAbove = 0;
        obj.countBelow = 0;
        var measureName = metaData.listOfVariables[var1]+"_Net";
        for (var c=0; c<computes.length;c++) {
            if (computes[c][measureName] != undefined) {
                if (computes[c][measureName][t] > 0) {
                    obj.sumAbove += computes[c][measureName][t];
                    obj.countAbove++;
                }
                if (computes[c][measureName][t] < 0) {
                    obj.sumBelow += computes[c][measureName][t];
                    obj.countBelow++;
                }
            }
        }
        for (var c = 0; c < computes.length; c++) {
            if (computes[c][measureName]!=undefined)
                nodes.push(computes[c]);
        }
        nodes.sort(function (a, b) {
            if (a[measureName]!=undefined && b[measureName]!=undefined){
                if (a[measureName][t] < b[measureName][t])
                    return 1;
                else
                    return -1;
            }
            else
                return 0;
        });
        if (obj.countAbove > 0)
            obj.averageAbove = obj.sumAbove / obj.countAbove;
        else
            obj.averageAbove = 0;
        if (obj.countBelow > 0)
            obj.averageBelow = obj.sumBelow / obj.countBelow;
        else
            obj.averageBelow = 0;

        obj.maxAbove = nodes[0][measureName][t];
        obj.maxBelow = nodes[nodes.length - 1][measureName][t];
        obj.maxAboveCountry = nodes[0];
        obj.maxBelowCountry = nodes[nodes.length - 1];
        boxplotNodes.push(obj);
    }

    maxAbs = 0;
    for (var i=0; i<boxplotNodes.length; i++){
        if (maxAbs<boxplotNodes[i].maxAbove)
            maxAbs =boxplotNodes[i].maxAbove;
        if (maxAbs< Math.abs(boxplotNodes[i].maxBelow))
            maxAbs =Math.abs(boxplotNodes[i].maxBelow);
    }
    //    Math.max (...boxplotNodes[1].maxAbove;


    //Vung's code to Draw boxplot ticks
    //TODO: Comment these lines if we would like to use the same scale as the profile.
    hBoxplotScale = d3.scaleLinear()
        .range([1, boxplotHeight])
        .domain([0, maxAbs]);
    //Recalculate the yBoxPlotStart basing on the maximum above value

    yStartBoxplot = yTextClouds + textCloudHeight + hBoxplotScale(d3.max(boxplotNodes.map(obj=>obj.maxAbove)));

    let boxPlotMaxAbove = d3.max(boxplotNodes.map(d=>d.maxAbove));
    let boxPlotMaxBelow = d3.min(boxplotNodes.map(d=>d.maxBelow));
    let boxPlotGridData = [];
    boxPlotGridData.push({"value": boxPlotMaxAbove.toFixed(2)});
    boxPlotGridData.push({"value": 0});
    boxPlotGridData.push({"value": boxPlotMaxBelow.toFixed(2)});

    let boxPlotGrid = svg.append("g").attr("transform", `translate(${0}, ${yStartBoxplot})`);
    let enter = boxPlotGrid.selectAll(".boxPlotGridLine").data(boxPlotGridData).enter();
    function yBoxPlotGrid(d){
        return d.value<0?hBoxplotScale(-d.value): -hBoxplotScale(d.value);
    }
    enter.append("line").attr("x1", xStep-25).attr("y1", yBoxPlotGrid).attr("x2", +svg.attr("width")).attr("y2", yBoxPlotGrid)
        .attr("class", "timeLegendLine")
        .style("stroke", "#000")
        .style("stroke-opacity", 1)
        .style("stroke-width", 0.3)
        .style("stroke-dasharray", "3, 1")
    enter.append("text").attr("x", xStep-25-5).attr("y", yBoxPlotGrid)
        .attr("alignment-baseline", "middle")
        .attr("class", "boxPlotTickLabel")
        .attr("font-family", "san-serif")
        .attr("font-size", "11px")
        .text(d=>d.value);

    // Area on the top
    svg.selectAll(".layerTopAbove").remove();
    svg.append("path")
        .attr("class", "layerTopAbove")
        .style("stroke", "#000")
        .style("stroke-width", 0)
        .style("stroke-opacity", 0.5)
        .style("fill-opacity", 0.2)
        .style("fill", colorAbove)
        .attr("d", areaTopAbove(boxplotNodes));
    svg.selectAll(".layerTopBelow").remove();
    svg.append("path")
        .attr("class", "layerTopBelow")
        .style("stroke", "#000")
        .style("stroke-width", 0)
        .style("stroke-opacity", 0.5)
        .style("fill-opacity", 0.2)
        .style("fill", colorBelow)
        .attr("d", areaTopBelow(boxplotNodes));

    svg.selectAll(".boxplotLine").remove();
    svg.selectAll(".boxplotLine")
        .data(boxplotNodes).enter()
        .append("line")
        .attr("class", "boxplotLine")
        .style("stroke", "#000")
        .style("stroke-width", 1)
        .style("stroke-opacity", 0.75)
        .attr("x1", function (d, i) {
            return xStep + xScale(i);    // x position is at the arcs
        })
        .attr("y1", function (d, i) {
            return yStartBoxplot - hBoxplotScale(d.maxBelow);
        })
        .attr("x2", function (d, i) {
            return xStep + xScale(i);    // x position is at the arcs
        })
        .attr("y2", function (d, i) {
            return yStartBoxplot - hBoxplotScale(d.maxAbove);
        });

    svg.selectAll(".boxplotLineAbove").remove();
    svg.selectAll(".boxplotLineAbove")
        .data(boxplotNodes).enter()
        .append("line")
        .attr("class", "boxplotLineAbove")
        .style("stroke", "#000")
        .style("stroke-width", 1)
        .style("stroke-opacity", 0.75)
        .attr("x1", function (d, i) {
            return xStep + (xScale(i) - (XGAP_ / 8));    // x position is at the arcs
        })
        .attr("y1", function (d, i) {
            return yStartBoxplot - hBoxplotScale(d.maxAbove);
        })
        .attr("x2", function (d, i) {
            return xStep + (xScale(i) + (XGAP_ / 8));    // x position is at the arcs
        })
        .attr("y2", function (d, i) {
            return yStartBoxplot - hBoxplotScale(d.maxAbove);
        });

    svg.selectAll(".boxplotLineBelow").remove();
    svg.selectAll(".boxplotLineBelow")
        .data(boxplotNodes).enter()
        .append("line")
        .attr("class", "boxplotLineBelow")
        .style("stroke", "#000")
        .style("stroke-width", 1)
        .style("stroke-opacity", 0.75)
        .attr("x1", function (d, i) {
            return xStep + (xScale(i) - (XGAP_ / 8));    // x position is at the arcs
        })
        .attr("y1", function (d, i) {
            return yStartBoxplot - hBoxplotScale(d.maxBelow);
        })
        .attr("x2", function (d, i) {
            return xStep + (xScale(i) + (XGAP_ / 8));    // x position is at the arcs
        })
        .attr("y2", function (d, i) {
            return yStartBoxplot - hBoxplotScale(d.maxBelow);
        });
    svg.selectAll(".boxplotRectAbove").remove();
    svg.selectAll(".boxplotRectAbove")
        .data(boxplotNodes).enter()
        .append("rect")
        .attr("class", "boxplotRectAbove")
        .style("stroke", "#000")
        .style("stroke-width", 1)
        .style("stroke-opacity", 0.5)
        .style("fill", colorAbove)
        .style("fill-opacity", 1)
        .attr("x", function (d, i) {
            return xStep + (xScale(i) - (XGAP_ / 8));    // x position is at the arcs
        })
        .attr("y", function (d, i) {
            return yStartBoxplot - hBoxplotScale(d.averageAbove);
        })
        .attr("height", function (d) {
            return hBoxplotScale(d.averageAbove);
        })
        .attr("width", XGAP_ / 4);
    svg.selectAll(".boxplotRectBelow").remove();
    svg.selectAll(".boxplotRectBelow")
        .data(boxplotNodes).enter()
        .append("rect")
        .attr("class", "boxplotRectBelow")
        .style("stroke", "#000")
        .style("stroke-width", 1)
        .style("stroke-opacity", 0.5)
        .style("fill", colorBelow)
        .style("fill-opacity", 1)
        .attr("x", function (d, i) {
            return xStep + (xScale(i) - (XGAP_ / 8));    // x position is at the arcs
        })
        .attr("y", yStartBoxplot)
        .attr("height", function (d) {
            return hBoxplotScale(Math.abs(d.averageBelow));
        })
        .attr("width", XGAP_ / 4);
}


function drawProfiles() {
    yStart = yStartBoxplot + 120;
    var yTemp2 = yStart;
    for (var c = 0; c < computes.length; c++) {
        computes[c].y = yTemp2;
        yTemp2 += profileHeight;
    }

    var varName1 = metaData.listOfVariables[var1];

    svg.selectAll(".layerProfile").remove();
    profiles = [];
    for (let c=0; c < computes.length; c++){
        var pro = [];
        if (computes[c][varName1]!=undefined){
            for (let i=0; i<computes[c][varName1].length;i++){
                var obj= new Object();
                obj.value = computes[c][varName1][i];
                obj.net = computes[c][varName1+"_Net"][i];
            //  obj.y = computes[c].y;   /// IMPROVE
                if (i==0)
                    obj.name = computes[c].name;
                pro.push(obj);
            }
            profiles.push(pro)
            svg.append("path")
                .attr("class", function (d){
                    return "layerProfile"+computes[c].name;
                })
                .style("stroke", "#000")
                .style("stroke-width", 1)
                .style("stroke-opacity", 0.5)
                .style("fill-opacity", 0.2)
                .style("fill", "#f00");
        }
    }
    svg.selectAll(".profileText").remove();
    svg.selectAll(".profileText")
        .data(computes).enter()
        .append("text")
        .attr("class", function (d){
            return "profileText" +d.name;
        })
        .style("fill", function (d) {
            return "#000";
        })
        .style("text-anchor", "end")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255, 0.99")
        .attr("x", function (d) {
            return xStep - 11;    // x position is at the arcs
        })
        .attr("y", function (d, i) {
            return d.y;     // Copy node y coordinate
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .text(function (d) {
            return d.name;
        });

    // Text of max different appearing on top of the stream graph
    svg.selectAll(".maxAboveText").remove();
    svg.selectAll(".maxAboveText")
        .data(countryListFiltered).enter()
        .append("text")
        .attr("class", "maxAboveText")
        .style("fill", function (d) {
            if (d.maxYearAbove == undefined || d.maxYearAbove == 0 || d[d.maxYearAbove] == undefined)
                return "#f00";
            else
                return colorPurpleGreen(d[d.maxYearAbove + 1].OutlyingDif);
        })
        .style("text-anchor", "middle")
        .style("text-shadow", "0 0 5px #fff")
        .attr("x", function (d, i) {
            if (d.maxYearAbove == undefined)
                return 0;
            else
                return xStep + xScale(d.maxYearAbove);    // x position is at the arcs
        })
        .attr("y", function (d, i) {
            if (d.maxYearAbove == undefined || d.maxYearAbove == 0 || d[d.maxYearAbove] == undefined)
                return d[0].y;
            else {
                return d[0].y - yScaleS(d[d.maxYearAbove + 1].Outlying);     // Copy node y coordinate
            }
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "1px")
        .text(function (d) {
            if (d.maxYearAbove == undefined || d.maxYearAbove == 0 || d[d.maxYearAbove] == undefined)
                return "";
            else
                return d[d.maxYearAbove + 1].OutlyingDif.toFixed(2);
        });
    // Text of max Below appearing on top of the stream graph
    svg.selectAll(".maxBelowText").remove();
    svg.selectAll(".maxBelowText")
        .data(countryListFiltered).enter()
        .append("text")
        .attr("class", "maxBelowText")
        .style("fill", function (d) {
            if (d.maxYearBelow == undefined || d.maxYearBelow == 0 || d[d.maxYearBelow] == undefined)
                return "#f00";
            else
                return colorPurpleGreen(d[d.maxYearBelow + 1].OutlyingDif);

        })
        .style("text-anchor", "middle")
        .style("text-shadow", "0 0 2px #fff")
        .attr("x", function (d) {
            //console.log(d.maxYearAbove);
            if (d.maxYearBelow == undefined)
                return 0;
            else
                return xStep + xScale(d.maxYearBelow);    // x position is at the arcs
        })
        .attr("y", function (d, i) {
            if (d.maxYearBelow == undefined || d.maxYearBelow == 0 || d[d.maxYearBelow] == undefined)
                return d[0].y;
            else
                return d[0].y - yScaleS(d[d.maxYearBelow + 1].Outlying);
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "1px")
        .text(function (d) {
            if (d.maxYearBelow == undefined || d.maxYearBelow == 0 || d[d.maxYearBelow] == undefined)
                return "";
            else
                return d[d.maxYearBelow + 1].OutlyingDif.toFixed(2);
        });
}




function updateBoxplots() {
    svg.selectAll(".boxplotLine").transition().duration(transitionTime)
        .attr("x1", function (d, i) {
            return xStep + xScale(i);    // x position is at the arcs
        })
        .attr("x2", function (d, i) {
            return xStep + xScale(i);    // x position is at the arcs
        });

    svg.selectAll(".boxplotLineAbove").transition().duration(transitionTime)
        .attr("x1", function (d, i) {
            return xStep + (xScale(i) - (XGAP_ / 8));    // x position is at the arcs
        })
        .attr("x2", function (d, i) {
            return xStep + (xScale(i) + (XGAP_ / 8));    // x position is at the arcs
        });
    svg.selectAll(".boxplotLineBelow").transition().duration(transitionTime)
        .attr("x1", function (d, i) {
            return xStep + (xScale(i) - (XGAP_ / 8));    // x position is at the arcs
        })
        .attr("x2", function (d, i) {
            return xStep + (xScale(i) + (XGAP_ / 8));    // x position is at the arcs
        });

    svg.selectAll(".boxplotRectAbove").transition().duration(transitionTime)
        .attr("x", function (d, i) {
            var w = XGAP_ / 4;
            if (lensingTimeStep - numLens <= i && i <= lensingTimeStep + numLens) {
                var w = XGAP_ / 2;
            }
            return xStep + xScale(i) - 0.5 * w;    // x position is at the arcs
        })
        .attr("width", function (d, i) {
            var w = XGAP_ / 4;
            if (lensingTimeStep - numLens <= i && i <= lensingTimeStep + numLens) {
                var w = XGAP_ / 2;
            }
            return w;
        });
    svg.selectAll(".boxplotRectBelow").transition().duration(transitionTime)
        .attr("x", function (d, i) {
            var w = XGAP_ / 4;
            if (lensingTimeStep - numLens <= i && i <= lensingTimeStep + numLens) {
                var w = XGAP_ / 2;
            }
            return xStep + xScale(i) - 0.5 * w;    // x position is at the arcs
        })
        .attr("width", function (d, i) {
            var w = XGAP_ / 4;
            if (lensingTimeStep - numLens <= i && i <= lensingTimeStep + numLens) {
                var w = XGAP_ / 2;
            }
            return w;
        });
    svg.selectAll(".layerTopAbove").transition().duration(transitionTime)
        .attr("d", areaTopAbove(boxplotNodes));
    svg.selectAll(".layerTopBelow").transition().duration(transitionTime)
        .attr("d", areaTopBelow(boxplotNodes));
}

function updateTextClouds() {
    svg.selectAll(".textCloud3").transition().duration(transitionTime)
        .attr("x", function (d, i) {
            return xStep + xScale(Math.floor(i / numTermsWordCloud));    // x position is at the arcs
        })
        .style("font-size", function (d, i) {
            var y = Math.floor(i / numTermsWordCloud);
            if (lensingTimeStep - numLens <= y && y <= lensingTimeStep + numLens) {
                var sizeScale = d3.scaleLinear()
                    .range(lensedTextCloudRange)
                    .domain([0, maxAbs]);
                return "12px";
            } else {
                var sizeScale = d3.scaleLinear()
                    .range(textCloudRange)
                    .domain([0, maxAbs]);
                return "2px";
            }

        })
        .text(function (d, i) {
            return d.name;
        });
}


function updateProfiles() {
    var brushingTimeStep = lensingTimeStep;
    if (brushingTimeStep>=0){
        profiles.sort(function (a, b) {
            if (Math.abs(a[brushingTimeStep].net) < Math.abs(b[brushingTimeStep].net)){
                return 1;
            }
            else
                return -1;
        });
    }

    var1Max = metaData.listOfMaxs[var1];
    var1Min = metaData.listOfMins[var1];
    if (!MinMaxScaling){
        var1Min = 0;
    }

    //********************************************
   if (profiles!= undefined){
        for (let c=0; c < computes.length; c++) {
            if (profiles[c]!= undefined) {
                svg.selectAll(".layerProfile" + computes[c].name).transition().duration(transitionTime)
                    .attr("d", lineChart(profiles[c]))
                    .attr("transform", "translate(0," + computes[c].y + ")");
                svg.selectAll(".profileText"+profiles[c][0].name).transition().duration(transitionTime)
                    .attr("y", function (d, i) {
                        return computes[c].y;     // Copy node y coordinate
                    });
            }

        }
    }
    svg.selectAll(".maxAboveText").transition().duration(transitionTime)
        .attr("x", function (d, i) {
            if (d.maxYearAbove == undefined)
                return 0;
            else
                return xStep + xScale(d.maxYearAbove);    // x position is at the arcs
        })
        .attr("y", function (d, i) {
            if (d.maxYearAbove == undefined || d.maxYearAbove == 0 || d[d.maxYearAbove] == undefined)
                return d[0].y;
            else {
                return d[0].y - yScaleS(d[d.maxYearAbove + 1].Outlying);     // Copy node y coordinate
            }
        });
    svg.selectAll(".maxBelowText").transition().duration(transitionTime)
        .attr("x", function (d) {
            if (d.maxYearBelow == undefined)
                return 0;
            else
                return xStep + xScale(d.maxYearBelow);    // x position is at the arcs
        })
        .attr("y", function (d, i) {
            if (d.maxYearBelow == undefined || d.maxYearBelow == 0 || d[d.maxYearBelow] == undefined)
                return d[0].y;
            else
                return d[0].y - yScaleS(d[d.maxYearBelow + 1].Outlying);
        });
}