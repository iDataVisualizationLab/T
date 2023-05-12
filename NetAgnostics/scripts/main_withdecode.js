/* November 2022
 * Tommy Dang, Assistant professor, iDVL@TTU
 *
 * THIS SOFTWARE IS BEING PROVIDED "AS IS", WITHOUT ANY EXPRESS OR IMPLIED
 * WARRANTY.  IN PARTICULAR, THE AUTHORS MAKE NO REPRESENTATION OR WARRANTY OF ANY KIND CONCERNING THE MERCHANTABILITY
 * OF THIS SOFTWARE OR ITS FITNESS FOR ANY PARTICULAR PURPOSE.
 */

let margin = {top: 0, right: 0, bottom: 0, left: 0};
let width = document.body.clientWidth - margin.left - margin.right;
let height = 50 - margin.top - margin.bottom;
let heightSVG = 2500;

///*********** 2022 *******************
let dataS;
let metaData = new Object();
let computes = [];
let var1 = 8;  // 8=PowerMetrics
let var2 = 12; // 12=memoryusage
let var1Max = 1; // Max value of the selected variable
let var1Min = 1; // Min value of the selected variable
let MinMaxScaling = true;


//Append a SVG to the body of the html page. Assign this SVG as an object to svg
let svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", heightSVG);
svg.call(tip);

let minYear, maxYear;
let xStep = 210;
let searchTerm;

let isLensing;
let lensingMul = 22;
let lensingTimeStep;
let oldLmonth; // use this variable to compare if we are lensing over a different month

let XGAP_; // gap between months on xAxis
let numLens = 2;


function xScale(m) {
    if (isLensing) {
        let maxM = Math.max(0, lensingTimeStep - numLens - 1);
        let numMonthInLense = (lensingTimeStep + numLens - maxM + 1);
        //compute the new xGap
        let total = numMonth + numMonthInLense * (lensingMul - 1);
        let xGap = (XGAP_ * numMonth) / total;

        if (m < lensingTimeStep - numLens) {
            let xx = m * xGap;
            if (m == lensingTimeStep - numLens - 1)
                xx += xGap*4;
            return xx;
        } else if (m > lensingTimeStep + numLens) {
            let xx = maxM * xGap + numMonthInLense * xGap * lensingMul + (m - (lensingTimeStep + numLens + 1)) * xGap;
            if (m == lensingTimeStep + numLens + 1)
                xx -= xGap*4;
            return xx;
        } else {
            return maxM * xGap + (m - maxM) * xGap * lensingMul;
        }
    } else {
        return m * XGAP_;
    }
}

let area = d3.area()
    //.interpolate("linear")
    .x(function (d) {
        return xStep + xScale(d.monthId);
    })
    .y0(function (d) {
        return d.yNode - yScale(d.value);
    })
    .y1(function (d) {
        return d.yNode + yScale(d.value);
    });

let optArray = [];   // FOR search box

//*****************************************************************
let fileList = [
    "HPCC",
    "LifeExpectancy263",
];

// let fileName = fileList[fileList.length-1];
let fileName = fileList[0];

// START: loader spinner settings ****************************
let opts = {
    lines: 25, // The number of lines to draw
    length: 25, // The length of each line
    width: 5, // The line thickness
    radius: 20, // The radius of the inner circle
    color: '#a90', // #rgb or #rrggbb or array of colors
    speed: 2, // Rounds per second
    trail: 50, // Afterglow percentage
    className: 'spinner', // The CSS class to assign to the spinner
};
let target = document.getElementById('loadingSpinner');
let spinner = new Spinner(opts).spin(target);
// END: loader spinner settings ****************************


//addDatasetsOptions(); // Add these dataset to the select dropdown, at the end of this files
loadData();

function preadjustdata(_data){
    if (_data.jobs_info && _data.jobs_info["base64(zip(o))"]){
        Object.keys(_data).forEach(k=>{
            if (_data[k]["base64(zip(o))"]){
                _data[k] = JSON.parse(pako.inflate(base64ToBuffer(_data[k]['base64(zip(o))']), { to: 'string' }));
            }
        })
    }
    else if (_data["base64(zip(o))"]){
        _data = JSON.parse(pako.inflate(base64ToBuffer(_data['base64(zip(o))']), { to: 'string' }));
    }
    return _data;
}

function base64ToBuffer(str){
    str = window.atob(str); // creates a ASCII string
    let buffer = new ArrayBuffer(str.length),
        view = new Uint8Array(buffer);
    for(let i = 0; i < str.length; i++){
        view[i] = str.charCodeAt(i);
    }
    return buffer;
}

function loadData() {
   // d3.json("data/" + fileName + ".json", function (data_) {
   //  d3.json("data/nocona_24h.json", function (data_) {
   //  d3.json("data/nocona_2023-01-12T12-00-00.00Z-2023-01-19T12-00-00.00Z.json", function (_data) {
    // d3.json("data/nocona_2023-02-11_updated.json", function (_data) {
    // d3.json("data/nocona_2023-04-27T12Z-2023-04-28T12Z.json", function (_data) {
    d3.json("data/nocona_2023-04-13-2023-04-14.json").then(_data => {
        const data_ = preadjustdata(_data)
        spinner.spin(target);
        dataS= data_;

        // Process HPCC data ---- 2022
        // Obtain the list of variable to metaData
        metaData.listOfVariables = [];
        let count=0;
        for (let key in dataS.nodes_info){
            if (count==0){
                for (let varName in dataS.nodes_info[key]) {
                    metaData.listOfVariables.push(varName);
                }
            }
            count++;
        }

        // Obtain the list of computeNames to metaData and create the list of computes with metrics arrays
        metaData.listOfNames = [];
        for (let key in dataS.nodes_info){
            let obj = {};
            obj.name = key;
            metaData.listOfNames.push(obj.name);
            obj.metrics = dataS.nodes_info[key];
            // Copy the metrics into  computes
            for(let v=0; v<metaData.listOfVariables.length;v++){
                let vName = metaData.listOfVariables[v];
                obj[vName] = obj.metrics[vName];
            }
            // Copy the Net metrics into  computes
            for(let v=0; v<metaData.listOfVariables.length;v++){
                let vName = metaData.listOfVariables[v];
                if (obj.metrics[vName] !=undefined){
                    obj[vName+"_Net"] = new Array(obj.metrics[vName].length);
                    for (let i=0;i<obj.metrics[vName].length;i++){
                        if (i==0)
                            obj[vName+"_Net"][i] =0
                        else
                            obj[vName+"_Net"][i] = obj[vName][i] -obj[vName][i-1];
                    }
                }
            }
            computes.push(obj);
        }

        // Compute the min and max of each variable for the whole HPC cente
        metaData.listOfMins = [];
        metaData.listOfMaxs = [];
        for(let v=0; v<metaData.listOfVariables.length;v++){
            let varName = metaData.listOfVariables[v];
            let max =0;
            let min =100000000;
            for (let i=0; i<computes.length;i++){
                if (computes[i][varName]!=undefined){
                    let newMax = Math.max(...computes[i][varName]);
                    let newMin = Math.min(...computes[i][varName]);
                    if (max<newMax)
                        max = newMax;
                    if (min>newMin)
                        min = newMin;
                }
            }
            metaData.listOfMins.push(min);
            metaData.listOfMaxs.push(max);
        }

        // Compute the min and max of NET variables
        metaData.listOfMins_Net = [];
        metaData.listOfMaxs_Net = [];
        for(let v=0; v<metaData.listOfVariables.length;v++){
            let varName = metaData.listOfVariables[v]+"_Net";
            let max =0;
            let min =100000000;
            for (let i=0; i<computes.length;i++){
                if (computes[i][varName]!=undefined){
                    let newMax = Math.max(...computes[i][varName]);
                    let newMin = Math.min(...computes[i][varName]);
                    if (max<newMax)
                        max = newMax;
                    if (min>newMin)
                        min = newMin;
                }
            }
            metaData.listOfMins_Net.push(min);
            metaData.listOfMaxs_Net.push(max);
        }

        // Draw functions
        svg.append("rect")
            .attr("class", "background")
            .style("fill", "#e8e8e8")
            .attr("x", 0)
            .attr("y", yTimeBox)
            .attr("width", width)
            .attr("height", heightSVG);

        numMonth = dataS.time_stamp.length;
        XGAP_ = (width - xStep - 2) / numMonth; // gap between months on xAxis

        drawColorLegend();
        drawTimeGrid();
        drawTimeText();
        drawTimeBox(); // This box is for brushing

        // Spinner Stop ********************************************************************
        spinner.stop();
        computeMonthlyGraphs();    // this function is main2.js
        addVariable_to_dropdown();  // In util.js
    });
}

$('#btnUpload').click(function () {
    let bar = document.getElementById('progBar'),
        fallback = document.getElementById('downloadProgress'),
        loaded = 0;
    let load = function () {
        loaded += 1;
        bar.value = loaded;

        /* The below will be visible if the progress tag is not supported */
        $(fallback).empty().append("HTML5 progress tag not supported: ");
        $('#progUpdate').empty().append(loaded + "% loaded");

        if (loaded == 100) {
            clearInterval(beginLoad);
            $('#progUpdate').empty().append("Upload Complete");
            console.log('Load was performed.');
        }
    };
    let beginLoad = setInterval(function () {
        load();
    }, 50);

});

// Other fucntions *******************************************************
function searchNode() {
    searchTerm = document.getElementById('search').value;
    let countryIndex = dataS.Countries.indexOf(searchTerm);
    if (countryIndex >= 0)
        brushingStreamText(countryIndex);
}

function addDatasetsOptions() {
    //let select = document.getElementById("datasetsSelect");
    /*for (let i = 0; i < fileList.length; i++) {
        let opt = fileList[i];
        let el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        //el["data-image"]="images2/datasetThumnails/"+fileList[i]+".png";
        select.appendChild(el);
    }*/
    //document.getElementById('datasetsSelect').value = fileName;  //************************************************
   // fileName = document.getElementById("datasetsSelect").value;
}

function loadNewData(event) {
    svg.selectAll("*").remove();
    fileName = this.options[this.selectedIndex].text;
    loadData();
}
