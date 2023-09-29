/*This is for the tooltip*/
var tooltipDiv = d3.select("body").append("div")
    .attr("class", "tooltipexplorescag")
    .style("opacity", 0)
    .style("z-index", 999)
    .attr("id", "scagExploreId");
tooltipDiv.append("span").attr("onclick", "closeToolTip()").text("x");

/*End tooltip section*/

// function onMessageHandler(event) {
//     console.log(event.data)
//   }
function setExploreEvent(theSvg, dataPoints, variables, m) {
    theSvg.dataPoints = dataPoints;
    theSvg.dataPoints.Variables = variables;
    theSvg
    /*This is for the tooltip section*/
        .on("click", function(d) {
            document.dataPoints = theSvg.dataPoints;
            // console.log(theSvg.dataPoints,  document.dataPoints, d, m)
            tooltipDiv.transition()
                .duration(200)
                .style("opacity", 1.0);
            tooltipDiv
                .html('<span  id="close" onclick="closeToolTip(); return false;">x</span><iframe src="explorescag.html?d='+m+'" style="width: 1540px; height: 500px;"></iframe>')
                .style("left", (20) + "px")
                // .style("left", (d3.event.pageX -520) + "px")
                .style("top", (d3.event.pageY + 52) + "px");
            // var iframe = document.querySelector("iframe");
            // iframe.contentWindow.postMessage("Test", "*");
            // window.addEventListener("message", onMessageHandler);
        });
  
    // 
    /*End of tooltip section*/
}
$(document).keyup(function(e) {
    if (e.key === "Escape") { // escape key maps to keycode `27`

    }
});
function closeToolTip(){
    tooltipDiv.transition().duration(500).style("opacity", 0);
}