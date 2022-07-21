/* 2017
 * Tommy Dang, Assistant professor, iDVL@TTU
 *
 * THIS SOFTWARE IS BEING PROVIDED "AS IS", WITHOUT ANY EXPRESS OR IMPLIED
 * WARRANTY.  IN PARTICULAR, THE AUTHORS MAKE NO REPRESENTATION OR WARRANTY OF ANY KIND CONCERNING THE MERCHANTABILITY
 * OF THIS SOFTWARE OR ITS FITNESS FOR ANY PARTICULAR PURPOSE.
 */
var top100termsArray = []; // for user selection
var graphByMonths = [];
var numCut = 5;
var cutOffvalue = [];


var snapshotScale = 0.265; // Snapshiot Size******************************************************
var maxRel = 15;   // for scaling, if count > 6 the link will looks similar to 6

// Colors
var colorAbove = "#0a0";
var colorBelow = "#b06";
var outlyingCut = 0.008; // Threshold to decide to show Outlier/Inliers in the World Clound
var maxAbs;
var yStart;
var yStartBoxplot;
var yTextClouds;
var boxHeight = 75;
var textCloudHeight = 75;
var transitionTime = 2000;
var countryList = [];
var countryListFiltered = [];
var profileHeight = 20;//we changed this to increase the country list distance.

var colorPurpleGreen = d3.scaleLinear()
    .domain([0, 0, 0])
    .range([colorBelow, "#666", colorAbove]);

function computeMonthlyGraphs() {
    allSVG = []; // all SVG in clusters.js
    for (var m = 0; m < numMonth; m++) {
        // Draw network snapshot
        updateSubLayout(m);
    }
    updateTimeLegend();
    oldLmonth = -100;  // This to make sure the histogram and text list is updated
    updateTimeBox();
    drawgraph2();

}

var yScaleS = d3.scaleLinear()
    .range([0, 80])
    .domain([0, 1]);

var areaAbove = d3.area()
   // .interpolate(interpolation)
    .x(function (d, i) {
        if (i == 0)
            return xStep - 10;
        else
            return xStep + xScale(i - 1);
    })
    .y0(function (d, i) {
        if (i == 0 || i == dataS.YearsData.length + 1) {
            return d.y;
        } else {
            return d.y - yScaleS(dataS.YearsData[i - 1].Scagnostics0[selectedScag]);
        }

    })
    .y1(function (d, i) {
        if (i == 0 || i == dataS.YearsData.length + 1)
            return d.y;
        else {
            var scagLeaveOriginal = dataS.YearsData[i - 1].Scagnostics0[selectedScag];
            if (d.OutlyingDif > 0)
                return d.y - yScaleS(scagLeaveOriginal) - yScaleS(d.OutlyingDif);
            else
                return d.y - yScaleS(scagLeaveOriginal);
        }
    });

var areaBelow = d3.area()
    //.interpolate(interpolation)
    .x(function (d, i) {
        if (i == 0)
            return xStep - 10;
        else
            return xStep + xScale(i - 1);
    })
    .y0(function (d, i) {
        if (i == 0 || i == dataS.YearsData.length + 1)
            return d.y;
        else {
            return d.y - yScaleS(dataS.YearsData[i - 1].Scagnostics0[selectedScag]);
        }
    })
    .y1(function (d, i) {
        if (i == 0 || i == dataS.YearsData.length + 1)
            return d.y;
        else {
            var scagLeaveOriginal = dataS.YearsData[i - 1].Scagnostics0[selectedScag];
            if (d.OutlyingDif < 0)
                return d.y - yScaleS(scagLeaveOriginal) + yScaleS(-d.OutlyingDif);
            else
                return d.y - yScaleS(scagLeaveOriginal);
        }
    });


// 2022 new function  **************************************************
var profiles =[]; // entries profiles
var areaAbove2 = d3.area()
    .x(function (d, i) {
        return xStep + xScale(i);
    })
    .y0(function (d, i) {
        if (MinMaxScaling)
            return d.y+1 - (d.value-var1Min)*profileHeight*1.2/(var1Max-var1Min);
        else
            return d.y+1 - d.value*profileHeight*1.2/var1Max;
    })
    .y1(function (d, i) {
        if (MinMaxScaling)
            return d.y - (d.value-var1Min)*profileHeight*1.2/(var1Max-var1Min);
        else
            return d.y - d.value*profileHeight*1.2/var1Max;
    });



function drawgraph2() {
    //** TEXT CLOUD **********************************************************
    yTextClouds = height + boxHeight; // 75 is the height of the text cloud section.
    drawTextClouds(yTextClouds);    // in main3.js
    //** BOX PLOT **********************************************************
    drawBoxplot();   // in main3.js
    //** COUNTRY PROFILE **********************************************************
    drawCountryProfiles();
}

function drawCountryProfiles() {
    yStart = yStartBoxplot + 120;
    var yTemp2 = yStart;
    for (var c = 0; c < computes.length; c++) {
        computes[c].y = yTemp2;
        yTemp2 += profileHeight;
    }

    //<editor-fold desc="TODO: This is enabled for the grid of the item profile only.">
    //Vung's code to Draw profile ticks
    // countryListFiltered.forEach(c=>{
    //         drawProfileGrid(c[0].y);
    // });
    // function drawProfileGrid(yPosition) {
    //     let boxPlotGridData = [];
    //     boxPlotGridData.push({"value": 0});
    //     boxPlotGridData.push({"value": 0.2});
    //     boxPlotGridData.push({"value": 0.4});
    //     boxPlotGridData.push({"value": 0.6});
    //
    //
    //     let profileGrid = svg.append("g").attr("transform", `translate(${0}, ${yPosition})`);
    //     let enter = profileGrid.selectAll(".boxPlotGridLine").data(boxPlotGridData).enter();
    //
    //     function yBoxPlotGrid(d) {
    //         return -yScaleS(d.value);
    //     }
    //
    //     enter.append("line").attr("x1", xStep - 10).attr("y1", yBoxPlotGrid).attr("x2", +svg.attr("width")).attr("y2", yBoxPlotGrid)
    //         .attr("class", "profileGrid")
    //         .style("stroke", "#000")
    //         .style("stroke-opacity", 1)
    //         .style("stroke-width", 0.3)
    //         .style("stroke-dasharray", "3, 1");
    //
    //
    //     enter.append("text").attr("x", xStep - 10 - 5).attr("y", yBoxPlotGrid)
    //         .attr("alignment-baseline", "middle")
    //         .attr("class", "boxPlotTickLabel")
    //         .attr("font-family", "san-serif")
    //         .attr("font-size", "11px")
    //         .text(d => d.value);
    // }

    // </editor-fold>

    /*
    svg.selectAll(".layerAbove").remove();
    svg.selectAll(".layerAbove")
        .datum(computes)
        .append("path")
            .attr("stroke", "#000")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 5)
        .style("fill", "#f00")
        .attr("d", d3.line().x(function(d,i) { return i*2; }).y(function(d,i) { return yStart*20; }));
*/


  //  var varName1 = metaData.listOfVariables[var1];
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
                obj.y = computes[c].y;   /// IMPROVE
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
                .style("fill", colorAbove);
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
        })
        ;

/*
    svg.selectAll(".layerBelow").remove();
    svg.selectAll(".layerBelow")
        .data(computes).enter()
        .append("path")
        .attr("class", "layerBelow")
        .style("stroke", "#000")
        .style("stroke-width", 0.2)
        .style("stroke-opacity", 0.5)
        .style("fill-opacity", 1)
        .style("fill", colorBelow)
        .attr("d", d3.line().x(function(d,i) { return i*20; }).y(function(d,i) { return i*20; }));*/
    //<editor-fold desc="TODO: These baselines are enabled to explain the profile only">
    // svg.selectAll(".outlyingBaseLine").remove();
    // svg.selectAll(".outlyingBaseLine")
    //     .data(countryListFiltered).enter()
    //     .append("path")
    //     .style("stroke", "black")
    //     .style("stroke-width", 1)
    //     .style("stroke-opacity", 1)
    //     .style("fill", "none")
    //     .attr("stroke-dasharray", "2, 2")
    //     .attr("d", outlyingBaseLine);
    // svg.selectAll(".countryBaseLine").remove()
    // svg.selectAll(".countryBaseLine")
    //     .data(countryListFiltered).enter()
    //     .append("path")
    //     .style("stroke", "#000")
    //     .style("stroke-width", 1)
    //     .style("stroke-opacity", 1)
    //     .style("fill", "none")
    //     // .attr("stroke-dasharray", "3, 3")
    //     .attr("d", countryBaseLine);
    //</editor-fold>

    /*svg.selectAll(".countryText").remove();
    svg.selectAll(".countryText")
        .data(computes).enter()
        .append("text")
        .attr("class", "countryText")
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
        })
        .on("mouseover", function (d) {
            var countryIndex = dataS.Countries.indexOf(d[0].country);
            brushingStreamText(countryIndex);
            // if autolensing is enable
            if (document.getElementById("checkbox1").checked && d.maxYearBelow != undefined) {
                isLensing = true;
                lMonth = d.maxYearBelow;

                // Update layout
                updateTimeLegend();
                updateTimeBox();
            }
        })
        .on("mouseout", function (d) {
            hideTip(d);
        });*/

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

function updategraph2() {
    updateBoxplots();
    updateTimeSeries();
    updateTextClouds();
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
            if (lMonth - numLens <= i && i <= lMonth + numLens) {
                var w = XGAP_ / 2;
            }
            return xStep + xScale(i) - 0.5 * w;    // x position is at the arcs
        })
        .attr("width", function (d, i) {
            var w = XGAP_ / 4;
            if (lMonth - numLens <= i && i <= lMonth + numLens) {
                var w = XGAP_ / 2;
            }
            return w;
        });
    svg.selectAll(".boxplotRectBelow").transition().duration(transitionTime)
        .attr("x", function (d, i) {
            var w = XGAP_ / 4;
            if (lMonth - numLens <= i && i <= lMonth + numLens) {
                var w = XGAP_ / 2;
            }
            return xStep + xScale(i) - 0.5 * w;    // x position is at the arcs
        })
        .attr("width", function (d, i) {
            var w = XGAP_ / 4;
            if (lMonth - numLens <= i && i <= lMonth + numLens) {
                var w = XGAP_ / 2;
            }
            return w;
        });
}

function updateTextClouds() {
    svg.selectAll(".textCloud3").transition().duration(transitionTime)
        .attr("x", function (d, i) {
            return xStep + xScale(Math.floor(i / numTermsWordCloud));    // x position is at the arcs
        })
        .style("font-size", function (d, i) {
            var y = Math.floor(i / numTermsWordCloud);
            if (lMonth - numLens <= y && y <= lMonth + numLens) {
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


function updateTimeSeries() {
    var brushingYear = lMonth;
    var orderby = d3.select('#nodeDropdown').property('value');
    var interval = d3.select('#edgeWeightDropdown').property('value');



    svg.selectAll(".layerBelow").transition().duration(transitionTime)
        .attr("d", areaBelow);
    svg.selectAll(".layerAbove").transition().duration(transitionTime)
        .attr("d", areaAbove);


   // debugger;
    if (brushingYear>=0){
        profiles.sort(function (a, b) {
            if (Math.abs(a[brushingYear].net) < Math.abs(b[brushingYear].net)){
                return 1;
            }
            else
                return -1;
        });
    }

    var yTemp2 = yStart;
    for (var c = 0; c < profiles.length; c++) {
        for (var j = 0; j < profiles[c].length; j++) {
            profiles[c][j].y = yTemp2;
        }
        yTemp2 += profileHeight;
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
                var pName = ".layerProfile" + profiles[c][0].name;
                svg.selectAll(pName).transition().duration(transitionTime)
                    .attr("d", areaAbove2(profiles[c]));
                svg.selectAll(".profileText"+profiles[c][0].name).transition().duration(transitionTime)
                    .attr("y", function (d, i) {
                        return profiles[c][0].y;     // Copy node y coordinate
                    })
            }

        }
    }


    svg.selectAll(".layerTopAbove").transition().duration(transitionTime)
        .attr("d", areaTopAbove(boxplotNodes));
    svg.selectAll(".layerTopBelow").transition().duration(transitionTime)
        .attr("d", areaTopBelow(boxplotNodes));


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
