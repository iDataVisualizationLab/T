let Colorlegend = function () {
    let master = {};
    master.el = null;
    master.linearGradient = null;
    master.id = _.uniqueId();
    let graphicopt = {
        colorScale: d3.scaleSequential()
            .interpolator(d3.interpolateSpectral),
        range:[0,1],
        height:30,
        barHeight:10
    };
    let ticks = [];
    let cloneColor = graphicopt.colorScale.copy();
    master.init  = (container)=>{
        master.el = container??d3.select('body').select('svg.legend');
        if (master.el.empty()){
            master.el = container.append('svg')
                .attr('class','legend');
        }
        master.el
            .style('width','100%')
            .style('height',graphicopt.height)
        master.defs = master.el.select('defs')
        if (master.defs.empty()){
            master.defs = master.el.append('defs');
        }
        master.linearGradient = master.el.select('linearGradient')
        if (master.linearGradient.empty()){
            master.linearGradient = master.el.append('linearGradient');
        }
        master.linearGradient.attr('id',"linear-gradient"+master.id);
        master.rect = master.el.select('rect')
        if (master.rect.empty()){
            master.rect = master.el.append('rect');
        }
        master.rect
            .attr('width',"100%")
            .attr('height',graphicopt.barHeight)
            .style('fill',`url(#${"linear-gradient"+master.id})`);
    }
    function updateData(){
        const _range = graphicopt.colorScale.domain();
        const newRange = (_range[0]>_range[_range.length-1])?graphicopt.range.slice().reverse():graphicopt.range.slice();
        const scale = graphicopt.colorScale.copy().domain(newRange);
        const scalep = d3.scaleLinear().domain([newRange[0]??0,newRange[_range.length-1]??0].sort((a,b)=>a-b)).range([0,100])

        ticks = scalep.ticks(10).sort((a,b)=>a-b).map(v=>[v,scalep(v)]);
        cloneColor=scale;
    }
    master.draw  = function() {
        const {range} = graphicopt;
        master.linearGradient
            .selectAll('stop')
            .data(ticks,t=>t[0])
            .join('stop')
            .attr('offset',t=>`${t[1]}%`)
            .attr('stop-color',t=>cloneColor(t[0]));
        master.rect
            .attr('height',graphicopt.barHeight);
        master.el
            .selectAll('text')
            .data([[range[0],0],[range[range.length-1],100]],t=>t[0])
            .join('text')
            .attr('x',t=>`${t[1]}%`)
            .attr('dy',"1rem")
            .attr('y',graphicopt.barHeight)
            .attr('text-anchor',(t,i)=>i?"end":'start')
            .attr('fill',"currentColor")
            .text(t=>Math.abs(t[0])>999?d3.format('.2s')(t[0]):d3.format('.2f')(t[0]))
        ;
    }
    Object.keys(graphicopt).forEach(k=>{
        master[k] = function(_data) {
            if (arguments.length){
                graphicopt[k]=_data;
                if (extraAction[k])
                    extraAction[k]();
                return master;
            }else
                return graphicopt[k];
        };
    })

    let extraAction = {
        colorScale:updateData,
        range:updateData
    }

    master.graphicopt = function(_data) {
        if (arguments.length){
            Object.keys(_data).forEach(k=> {
                graphicopt[k] = _data[k];
                if (extraAction[k])
                    extraAction[k]();
            });
            return master;
        }else
            return graphicopt;
    };

    return master;
}