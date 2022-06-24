/* March 2017
 * Tommy Dang, Assistant professor, iDVL@TTU
 *
 * THIS SOFTWARE IS BEING PROVIDED "AS IS", WITHOUT ANY EXPRESS OR IMPLIED
 * WARRANTY.  IN PARTICULAR, THE AUTHORS MAKE NO REPRESENTATION OR WARRANTY OF ANY KIND CONCERNING THE MERCHANTABILITY
 * OF THIS SOFTWARE OR ITS FITNESS FOR ANY PARTICULAR PURPOSE.
 */
var interpolation = "cardinal";
var numTermsWordCloud = 6; // numTerms in each month
var boxplotHeight = 90; // numTerms in each month
var hBoxplotScale = null;

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

var boxplotNodes = [];

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
        for (var c=0; c<computes.length;c++){
            if (computes[c][measureName]!= undefined){
                if (computes[c][measureName][t]>0){
                    obj.sumAbove += computes[c][measureName][t];
                    obj.countAbove++;
                }
                if (computes[c][measureName][t]<0){
                    obj.sumBelow += computes[c][measureName][t];
                    obj.countBelow++;
                }
            }

        }

        /*for (var c = 0; c < countryList.length; c++) {
            nodes.push(countryList[c]);
            if (countryList[c][y].OutlyingDif > 0) {
                obj.sumAbove += countryList[c][y].OutlyingDif;
                obj.countAbove++;
            }
            else if (countryList[c][y].OutlyingDif < 0) {
                obj.sumBelow += countryList[c][y].OutlyingDif;
                obj.countBelow++;
            }
        }*/

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
      //  debugger

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
        .style("stroke-dasharray", "3, 1");


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

// This Texts is independent from the lower text with stream graphs
var tNodes;
let lensedTextCloudRange = [10, 16];
let textCloudRange = [6, 12];
function drawTextClouds(yTextClouds) {
    tNodes = [];
    var varName = metaData.listOfVariables[var1];
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
            if (lMonth - numLens <= y && y <= lMonth + numLens) {
                var sizeScale = d3.scale.linear()
                    .range(lensedTextCloudRange)
                    .domain([0, maxAbs]);
                return "12px";
                //if (Math.abs(d[y + 1].OutlyingDif) < outlyingCut)
                //    d.fontSize = 0;
                //else
                //    d.fontSize = sizeScale(Math.abs(d[y + 1].OutlyingDif));
            }
            else {
                var sizeScale = d3.scaleLinear()
                    .range(textCloudRange)
                    .domain([0, maxAbs]);
                return "4px";
                //if (Math.abs(d[y + 1].OutlyingDif) < outlyingCut * 2)
                //    d.fontSize = 0;
                //else
                //    d.fontSize = sizeScale(Math.abs(d[y + 1].OutlyingDif));
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
            //return d[0].country.substring(0, cloudTextLength);
        });

}
