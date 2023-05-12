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

// Modified May 12

// adding control May 2023
let runOption = {isShareSpace:isShareSpace(),renderProfile:renderProfileSeperate};

function getProfileX(d,i){
    return xStep + xScale(i);
}
function getProfileY(d){
    if (MinMaxScaling)
        return 1 - (d.value-var1Min)*profileHeight*1.2/(var1Max-var1Min);
    else
        return 1 - d.value*profileHeight*1.2/var1Max;
}
// end Modified May 12

var lineChart = d3.line()
    .x(getProfileX)
    .y(getProfileY)
    .defined(d=>!isNaN(d.value));
    //.y1(function (d, i) {
    //    if (MinMaxScaling)
    //        return d.y - (d.value-var1Min)*profileHeight/(var1Max-var1Min);
    //    else
    //        return d.y - d.value*profileHeight/var1Max;
    //});
let areaTopAbove = d3.area()
    // .interpolate(interpolation)
    .x(getProfileX)
    .y0(()=>yStartBoxplot)
    .y1(function (d, i) {
        return yStartBoxplot - hBoxplotScale(d.maxAbove);
    })
    .defined(d=>!isNaN(d.maxBelow));
let areaTopBelow = d3.area()
    // .interpolate(interpolation)
    .x(getProfileX)
    .y0(()=>yStartBoxplot)
    .y1(function (d, i) {
        return yStartBoxplot - hBoxplotScale(d.maxBelow);
    })
    .defined(d=>!isNaN(d.maxBelow));

function drawgraph2() {
    //** TEXT CLOUD **********************************************************
    yTextClouds = height + boxHeight; // 75 is the height of the text cloud section.
    drawTextClouds(yTextClouds);   
    //** BOX PLOT **********************************************************
    drawBoxplot();   
    //** COUNTRY PROFILE **********************************************************
    drawProfiles();
}


function changeVarPrimary() {
    var1  = d3.select("#varPrimary").node().value-1;

    allSVG = []; // all SVG in clusters.js
    for (var m = 0; m < numMonth; m++) {
        // Draw network snapshot
        updateScatterplots(m);
    }
    oldLmonth = -100;  // 

    drawTextClouds(yTextClouds);
    updateTextClouds();

    drawBoxplot();   // in main3.js
    updateBoxplots();

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
                return "12px";
            }
            else {
                 return "2px";
            }
        })
        .style("fill", function (d, i) {
            return "#000";
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

//*adding function to reposition
let scaleProfile = d3.scaleLinear().domain([0,1]);
function updateProfileY(yStart) {
    scaleProfile.range([yStart,yStart+profileHeight]);
}
//*end

function drawProfiles() {
    yStart = yStartBoxplot + 120;
    updateProfileY(yStart)
    computes.forEach((comp,i)=>{
        comp.y = scaleProfile(i)
    })

    var varName1 = metaData.listOfVariables[var1];

    svg.selectAll(".layerProfile").remove();
    profiles = [];
    for (let c=0; c < computes.length; c++){
        var pro = [];
        pro._data = computes[c];
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
            computes[c]._profile = pro; // add link
            profiles.push(pro)
            const layerProfile = svg.append("g")
                .datum(computes[c])
                .attr("class", function (d){
                    return "layerProfile layerProfile"+computes[c].name;
                });
            layerProfile
                .append("path")
                .attr("class","layerProfileGuide")
                .style("stroke", "#0d2eb4")
                .style("stroke-width", 1)
                .style("fill", "none");
            layerProfile
                .append("path")
                .attr("class","layerProfilePath")
                .style("stroke", "#000")
                .style("stroke-width", 1)
                .style("stroke-opacity", 0.5)
                .style("fill-opacity", 0.2)
                .style("fill", "#f00");
        }else{
            computes[c]._profile = undefined// remove link
        }
    }
    // calculate summary
    let maxTime = d3.max(profiles,p=>p.length)
    profiles.summary = [];
    for (let i=0;i<maxTime;i++){
        profiles.summary[i] = {value:d3.mean(profiles,p=>(p[i]??{}).value)}
    }


    svg.selectAll(".profileText").remove();
    svg.selectAll(".profileText")
        .data(computes).enter()
        .append("text")
        .attr("class", function (d){
            return "profileText profileText" +d.name;
        })
        .attr("x",xStep - 11)
        .attr("y",function (d) {
            return d.y
        })
        .style("fill", function (d) {
            return "#000";
        })
        .style("text-anchor", "end")
        .style("text-shadow", "1px 1px 0 rgba(255, 255, 255, 0.99")
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

function renderProfileSeperate() {
    profiles.forEach((p, i) => {
        p._data.y = scaleProfile(i)
    })
    if (profiles != undefined) {
        for (let c = 0; c < computes.length; c++) {
            if (computes[c]._profile != undefined) {
                const profileInstance = computes[c]._profile;
                const layer = svg.select(".layerProfile" + computes[c].name)
                    .classed('hide', false);
                layer.transition().duration(transitionTime)
                    .attr("transform", "translate(0," + computes[c].y + ")");
                layer.select('.layerProfilePath')
                    .transition().duration(transitionTime)
                    .attr("d", lineChart(profileInstance));
                layer.select('.layerProfileGuide')
                    .transition().duration(transitionTime)
                    .attr("d", `M${xStep - 11},-5 L${getProfileX(null, 0)},${getProfileY(profileInstance[0], 0)}`);
                svg.select(".profileText" + computes[c].name)
                    .classed('hide', false)
                    .transition().duration(transitionTime)
                    .attr("y", computes[c].y);
            } else {
                svg.select(".layerProfile" + computes[c].name).classed('hide', true);
                svg.select(".profileText" + computes[c].name).classed('hide', true);
            }
        }
    }
}
function renderProfileShare() {
    if (profiles != undefined) {
        for (let c = 0; c < computes.length; c++) {
            if (computes[c]._profile != undefined) {
                const profileInstance = computes[c]._profile;
                const layer = svg.select(".layerProfile" + computes[c].name)
                    .classed('hide', false);
                layer.select('.layerProfilePath')
                    .transition().duration(transitionTime)
                    .attr("d", lineChart(profileInstance));
                layer.select('.layerProfileGuide')
                    .transition().duration(transitionTime)
                    .attr("d", `M${xStep - 11},-5 L${getProfileX(null, 0)},${getProfileY(profileInstance[0], 0)}`);

            }
        }
        d3.select(".profileSummary path")
            .attr("d", lineChart(profiles.summary))

    }
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
    runOption.renderProfile();

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

// May 2023
function isShareSpace() {
    return (d3.select('#checkboxShareSpace').node()??{checked:false}).checked;
}
function triggerShareSpace() {
    runOption.isShareSpace = isShareSpace();
    if (runOption.isShareSpace){
        profileHeight = 200;
        runOption.renderProfile = renderProfileShare;
        const layerProfile = svg.selectAll(".layerProfile")
            .classed("hideGuide hideFill",true);
        layerProfile.transition().duration(transitionTime)
            .attr("transform", `translate(0,${yStart+profileHeight})`);
        svg.selectAll(".profileText")
            .classed('hide', true)
            .transition().duration(transitionTime)
            .attr("y", yStart+profileHeight);
        // add mouseover
        layerProfile.on('mouseover',function(d){
            svg.classed('isHighlightProfile',true);
            d3.select(this).classed('highlight',true);
            svg.select(`.profileText${d.name}`)
                .attr('y',yStart+profileHeight+getProfileY(d._profile[0], 0))
                .classed('hide', false);
        })
        .on("mouseout",function(d){
            svg.classed('isHighlightProfile',false);
            d3.select(this).classed('highlight',false);
            svg.select(`.profileText${d.name}`)
                .classed('hide', true);
        })
        // add summary layer
        svg.select(".profileSummary").remove();
        const summaryLayer = svg.append("g").attr("class","profileSummary")
            .attr('transform',`translate(0,${yStart+profileHeight})`);
        summaryLayer.append("path").attr("class","mean");
    }else{
        profileHeight = 20;
        runOption.renderProfile = renderProfileSeperate;
        svg.classed('isHighlightProfile',false);
        const layerProfile = svg.selectAll(".layerProfile")
            .classed("hideGuide hideFill",false);
        // remove mouseover
        layerProfile.on('mouseover',null)
        .on("mouseout",null);
        // remove summary layer
        svg.select(".profileSummary").remove();
    }
    runOption.renderProfile();
}