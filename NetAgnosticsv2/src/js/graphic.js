;// plugin
d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};
//general function
let vizservice = [];

function serviceControl() {
    vizservice = serviceFullList.slice();
    const customAxis ={};
    vizservice.forEach((s, si) => {
        s._id = si;
        s.thresholdFilter = Math.round((s.range[1] - s.range[0]) * 0.9 + s.range[0]);
        s.thresholdFilterNormalize = 0.9;
        customAxis[s.text]={range:[0,1],displayRange:s.range}
    });

    d3.select('#serviceSelectionSelection')
        .on('change',function(){
            serviceSelected = +$(this).val();
            currentDraw(serviceSelected);
        })
        .selectAll('option')
        .data(vizservice)
        .join('option')
        .attr('value',(d,i)=>i)
        .attr('class',d=>d.text==='User'?'innerName':null)
        .attr('data-value',(d,i)=>d)
        .attr('selected',(d,i)=>i===serviceSelected?'':null)
        .text(d=>d.text)

    drawObject.service(vizservice);

    d3.selectAll('.serviceName').text(vizservice[serviceSelected]?vizservice[serviceSelected].text:'')
    const tr = d3.select('#serviceSelection')
        .selectAll('tr')
        .data(vizservice)
        .join('tr');
    tr.selectAll('td.input').data(d => [d])
        .join('td').attr('class', 'input')
        .html(d => `<input type="checkbox" value="${d._id}">`)
        .each(function (d) {
            d3.select(this).select('input')
                .on('change', function () {
                    d._filter = this.checked;
                    d3.select(this.parentNode.parentNode).select('.silderHolder').attr('disabled',this.checked?null:'')
                })
        });
    tr.selectAll('td.title').data(d => [d])
        .join('td').attr('class', 'title')
        .text(d => d.text);
    tr.selectAll('td.rangeLow').data(d => [d])
        .join('td').attr('class', 'rangeLow')
        .style('text-align', 'right')
        .text(d => d.range[0]);
    tr.selectAll('td.range').data(d => [d])
        .join('td').attr('class', 'range')
        .html(d => `<div class="silderHolder" style="width:60px"></div>`).each(function (d) {
        const div = d3.select(this).select('.silderHolder').attr('disabled','').node();
        try {
            noUiSlider.create(div, {
                start: d.thresholdFilter,
                tooltips: {
                    to: function (value) {
                        return d3.format('.1f')(value)
                    }, from: function (value) {
                        return +value.split('1e')[1];
                    }
                },
                step: 0.5,
                orientation: 'horizontal', // 'horizontal' or 'vertical'
                range: {
                    'min': d.range[0],
                    'max': d.range[1],
                },
            });
            div.noUiSlider.on("change", function () { // control panel update method
                d.thresholdFilter = +this.get();
                d.thresholdFilterNormalize = (+this.get() - d.range[0]) / (d.range[1] - d.range[0]);
            });
        }catch(e){}
    });
    tr.selectAll('td.rangeHigh').data(d => [d])
        .join('td').attr('class', 'rangeHigh')
        .style('text-align', 'left')
        .text(d => d.range[1]);

    const dataLine = [{text:'--none--',_index:false},...vizservice];
    d3.select('#lineChartOption').selectAll('option')
        .data([{text:'--none--',_id:false},...vizservice])
        .join('option')
        .attr('value',d=>d._id)
        .text(d=>d.text)
    d3.select('#lineChartOption').on('change',function(){
           drawObject.onShowLineChart(dataLine[this.selectedIndex]._id)
        });


    d3.select('#paraDimColtrol').selectAll('option')
        .data([...serviceFullList.map(s=>s.text),'Duration','#Computes'])
        .join('option')
        .attr('value',d=>d)
        .attr('selected','selected')
        .text(d=>d);

}

function initdraw() {
    $('.informationHolder').draggable({handle: ".card-header", scroll: false});

    d3.select('#innerDisplay').on('change', function () {
        d3.selectAll('.innerName').text(getInnerNodeAttr())
        currentDraw(serviceSelected);
    });
    d3.select('#sort_apply').on('click', function () {
        sortData();
        currentDraw()
    });
    d3.select('#nodeColor').on('change', function () {
        const val = $(this).val();
        drawObject.graphicopt({colorMode: val});
        if (val === '') {
            d3.select('.MetricsLegend').classed('hide', false);
            d3.select('.RackLegend').classed('hide', true);
        } else {
            d3.select('.MetricsLegend').classed('hide', true);
            let svg = d3.select('.RackLegend').classed('hide', false)
                .select('svg');
            let g = svg.select('g.content');
            let color = getColorScale();
            let padding = 16;
            let margin = {top: 10, left: 70, right: 0, bottom: 0};
            let w = 280;
            let h = (color.domain().length + 1) * padding;
            svg.attr('width', w + margin.left + margin.right).attr('height', h + margin.top + margin.bottom);
            g.attr('transform', `translate(${margin.left},${margin.top})`)
            let rackel = g.selectAll('.rackEl').data(color.domain().map((d, i) => ({key: d, value: color.range()[i]})))
                .join('g')
                .attr('class', 'rackEl').attr('transform', (d, i) => `translate(0,${i * padding})`);
            rackel.selectAll('circle.dot').data(d => [d]).join('circle').attr('class', 'dot')
                .style('r', 3)
                .style('fill', d => d.value);
            rackel.selectAll('text.dot').data(d => [d]).join('text').attr('class', 'dot')
                .attr('x', 5).attr('dy', 5)
                .text(d => d.key)
                .style('fill', d => d.value);
        }
        currentDraw()
    });
    serviceControl();

    colorlegend.init();
    drawObject.init().getColorScale(getColorScale)
        .onFinishDraw(makelegend)
    // .onFinishDraw(updateNarration);
    // initDragItems('#ForceByMetrics','metric');

    d3.select('#minMaxScale').on('change',function(){

    })
    d3.select('#enableLensing')
        .attr('checked',drawObject.autolensing())
        .on('change',function(){
        drawObject.autolensing(this.checked)
    })
    d3.select('#showScore').on('change',function(){

    })
}


function getColorScale() {
    if (drawObject.graphicopt().colorMode !== 'rack') {
        serviceName = vizservice[serviceSelected].text;
        let _colorItem = d3.scaleSequential()
            .interpolator(d3.interpolateSpectral);
        if (serviceName === 'User') {
            vizservice[serviceSelected].range = Object.keys(innerObj);
            _colorItem = userColor;
        } else if (serviceName === 'Radar') {
            _colorItem = colorCluster;
        }
        const range_cal = (vizservice[serviceSelected].filter || vizservice[serviceSelected].range).slice();
        if (serviceName !== 'User') {
            if (serviceName !== 'Radar')
                _colorItem.domain(range_cal.slice().reverse());
        } else if (serviceName === 'Radar')
            _colorItem.domain(range_cal.slice());
        return _colorItem;
    } else {
        let colorbyRack = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.keys(Layout.data));
        let _colorItem = (value, d) => d ? colorbyRack(Layout.compute_layout[d.key]) : null;
        _colorItem.domain = () => colorbyRack.domain();
        _colorItem.range = () => colorbyRack.range();
        return _colorItem;
    }
}

function closeToolTip() {
    d3.select('.informationHolder').classed('hide', true);
}

function makelegend() {

    const color = drawObject.colorNet();
    colorlegend
        .graphicopt({colorScale: color,range: color.domain()})
        .draw();

}


function getDrawData(e) {
    let serviceName = vizservice[serviceSelected]?vizservice[serviceSelected].text:'';
    if (serviceName === 'Radar') {
        if (!e.children) {
            let radarvalue = [serviceFullList.map(d => ({
                axis: d.text,
                value: Math.max(d3.scaleLinear().domain(d.range)(e.data.metrics[d.text]) ?? 0, 0)
            }))];
            radarvalue[0].name = e.data.metrics['Radar']
            radarvalue.isRadar = true;
            radarvalue.r = e.r * 2;
            radarvalue.type = 'radar';
            return radarvalue
        }
        const radarvalue = [{startAngle: 0, endAngle: 360, r: e.r}];
        radarvalue.type = 'radar';
        return radarvalue
    } else if (serviceName === 'User') {
        if (e.data.relatedNodes.length > 1) {
            const data = d3.pie().value(1)(e.data.relatedNodes);
            data.forEach(d => {
                d.r = e.r;
                d.color = d.data.data.color;
            });

            return data;
        }
        return [{
            data: {},
            endAngle: 360,
            index: 0,
            padAngle: 0,
            startAngle: 0,
            value: 1,
            r: e.r,
            color: e.data.relatedNodes[0] ? e.data.relatedNodes[0].data.color : 'unset'
        }]
    } else {
        const dataout = [{startAngle: 0, endAngle: 360, r: e.r ?? 3, invalid: e.invalid}];
        return dataout;
    }
}

function drawGantt() {
    drawObject.data({
        timeRange:Layout.timerange,
        node:Layout.nodeFilter,
        serviceSelected:0,
        metrics:Layout.tsnedata,
        dimensions:serviceFullList,
        time:Layout.time_stamp
    });

    let _byUser=undefined;
    $('#search').on('input', searchHandler); // register for oninput
    $('#search').on('propertychange', searchHandler); // for IE8
    function searchHandler(e) {
        if (e.target.value !== "") {
            const byUser = Layout.users[e.target.value]?e.target.value:undefined;
            // let results = datain.filter(h => h.name.includes(e.target.value)).map(h => ({index: path[h.name][0].index}));
            const dimensions = serviceFullList;
            if(dimensions) {
                if (!byUser) {
                    if (_byUser!==byUser) {
                        Layout.nodeFilter = {...Layout.computers};
                        drawObject.data({node: Layout.nodeFilter}).draw();
                    }
                } else {
                    const nodes = {};
                    [byUser].forEach(u=>{
                        debugger
                        Layout.users[u].node.forEach(n=>{
                            nodes[n] = {};
                            dimensions.forEach(d=>{
                                if (Layout.computers[n][d.text]){
                                    nodes[n][d.text] = Layout.computers[n][d.text].map(()=>null);
                                    nodes[n][d.text].sudden = Layout.computers[n][d.text].sudden;
                                }
                            })
                            Layout.computers[n].users.forEach((t,i)=>{
                                if (t.indexOf(u)){
                                    dimensions.forEach(d=>{
                                        if (Layout.computers[n][d.text]){
                                            nodes[n][d.text][i] = Layout.computers[n][d.text][i];
                                        }
                                    })
                                }
                            })
                        })
                    })
                    drawObject.data({node:nodes}).draw();
                }
            }
            _byUser = byUser
        }
    }
}

// setting
let tooltip = d3.tip().attr('class', 'd3-tip').html(function (d) {
    return `<span>${d}</span>`
})
let drawObject = new NetAgnostics();
let colorlegend = new Colorlegend();
