/* November 2017 
 * Tommy Dang, Assistant professor, iDVL@TTU
 *
 * THIS SOFTWARE IS BEING PROVIDED "AS IS", WITHOUT ANY EXPRESS OR IMPLIED
 * WARRANTY.  IN PARTICULAR, THE AUTHORS MAKE NO REPRESENTATION OR WARRANTY OF ANY KIND CONCERNING THE MERCHANTABILITY
 * OF THIS SOFTWARE OR ITS FITNESS FOR ANY PARTICULAR PURPOSE.
 */

var forceSize = 90; // Max size of force layouts at the bottom

var allSVG = [];
var pointOpacity = 0.9;
var selectedVar = 0;
var selectedScag = 0;

function updateSubLayout(m) {
    svg.selectAll(".force" + m).remove();

    var xPos = xStep - forceSize / 2 + m * XGAP_;

    var svg2 = svg.append("svg")
        .attr("class", "force" + m)
        .attr("width", forceSize)
        .attr("height", forceSize)
        .attr("x", xPos)
        .attr("y", 26);
    /* svg2.append("rect")
     .attr("width", "100%")
     .attr("height", "100%")
     .attr("fill", "pink")
     .attr("fill-opacity", 0.5);*/
    allSVG.push(svg2);

    var size = 20;
    var padding = 0;

    var x2 = 0;
    var y2 = 0;
    var margin = forceSize / 2 - size / 2;
    svg2.append("rect")
        .attr("class", "frame")
        .attr("x", margin)
        .attr("y", margin)
        .attr("rx", 2)
        .attr("ry", 2)
        // .attr("rx", 5)//TODO: This is for the teaser only (switch back the previous one for normal page)
        // .attr("ry", 5)//TODO: This is for the teaser only (switch back the previous one for normal page)
        .attr("width", size - padding)
        .attr("height", size - padding)
        .style("fill", function (d) {
            var measureName = metaData.listOfVariables[var1]+"_Net";
            var maxNetAtTimeStamp = 0;
            var minNetAtTimeStamp = 0;
            for (var c=0; c<computes.length;c++){
                if (computes[c][measureName]!= undefined){
                    if (maxNetAtTimeStamp<computes[c][measureName][m])
                        maxNetAtTimeStamp = computes[c][measureName][m]
                    if (minNetAtTimeStamp>computes[c][measureName][m])
                        minNetAtTimeStamp = computes[c][measureName][m]
                }

            }
            var maxNet = maxNetAtTimeStamp;
            var absMinNet = Math.abs(minNetAtTimeStamp);
            if (absMinNet>maxNet)
                maxNet = minNetAtTimeStamp;

            return colorRedBlue(maxNet);
        })
        //.style("fill-opacity",0.9)
        .style("stroke", "#000")
        .style("stroke-width", 0.1);

    var dataPoints = [];
    for (var key in dataS.nodes_info){
        var obj = {};
        obj.year = m;
        obj.metrics = dataS.nodes_info[key];
        var index =0;
        for (var key2 in obj.metrics) {
            obj["s" + index] = obj.metrics[key2][m];
            obj["v" + index] = obj.metrics[key2][m];
            index++;
        }
        /*for (var v = 0; v < dataS.Variables.length; v++) {
            obj["s" + v] = dataS.YearsData[m]["s" + v][c];
            obj["v" + v] = dataS.CountriesData[obj.country][m]["v" + v];
            if (v % 2 == 1) {
                var pair = Math.floor(v / 2);
                obj["Scagnostics" + pair] = dataS.YearsData[m]["Scagnostics" + pair]; // 0 is the index of Outlying
                obj["ScagnosticsLeave1out" + pair] = []; // 0 is the index of Outlying
                for (var s = 0; s < dataS.Scagnostics.length; s++) {
                    obj["ScagnosticsLeave1out" + pair].push(dataS.CountriesData[obj.country][m][dataS.Scagnostics[s]]);
                }
            }
        }*/

        dataPoints.push(obj);
    }

    //Filter out data points with "NaN"
   // dataPoints = dataPoints.filter(d => d["v0"] !== "NaN" && d["v1"] !== "NaN" && d["s0"] !== "NaN" && d["s1"] !== "NaN" && (!isNaN(d["ScagnosticsLeave1out0"][0] - d["Scagnostics0"][0])));

    var scaleRadius = d3.scale.linear()
        .range([size / 35, size / 10])
        .domain([0, 1]);

    svg2.selectAll("circle")
        .data(computes)
        .enter().append("circle")
        .attr("class", function (d, i) {
            return "dataPoint" + i;
        })
        .attr("cx", function (d) {
            var vName = metaData.listOfVariables[var1];
            if (d[vName]!=undefined){
                var value = d[vName][m] /metaData.listOfMaxs[var1];
                if (isNaN(value))
                    return 0;
                else{
                    return margin + 1.5 + value* (size - 3);
                }
            }
        })
        .attr("cy", function (d, i) {
            var vName = metaData.listOfVariables[var2];
            if (d[vName]!=undefined) {
                var value = d[vName][m] / metaData.listOfMaxs[var2];
                if (isNaN(value))
                    return 0;
                else {
                    return margin + size - 1.5 - value * (size - 3);
                }
            }
        })
        .attr("r", function (d) {
            var vName1 = metaData.listOfVariables[var1];
            var vName2 = metaData.listOfVariables[var2];
            if (d[vName1]==undefined || d[vName2]==undefined)
               return 0;
            else
                return 0.8;
        })
        .style("stroke", "#fff")
        .style("stroke-width", 0.02)
        .style("stroke-opacity", 0.8)
        .style("fill", function (d) {
                return "#000";
        })
        .style("fill-opacity", pointOpacity)
        .on("mouseover", function (d, i) {
            brushingDataPoints(d, i);
        })
        .on("mouseout", function (d) {
            hideTip(d);
        });
    setExploreEvent(svg2, dataPoints, dataS.Variables);
}