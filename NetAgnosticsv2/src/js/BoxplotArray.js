let BoxplotArray = function ({
                                 scaleX,
                                 height,
                                 boxW=5,
                                 data=[]
                             }) {
    const defaultScale = ()=>1;
    let master = {};
    master.el = null;
    let graphicopt = {
        scaleX,
        height,
        boxW,
        data
    };
    let sizeScale= defaultScale;
    master.init = (container)=>{
        master.el = container??d3.select('body').select('g.boxplotArrayHolder');
        if (master.el.empty()){
            master.el = container.append('g')
                .attr('class','boxplotArrayHolder');
        }
        master.grid = master.el.select('.grid');
        if (master.grid.empty()){
            master.grid = master.el.append('g')
                .attr('class','.grid');
        }
        if (master.el.select('.layerTopAbove').empty()){
            master.el.append('path')
                .attr('class','layerTopAbove');
        }
        if (master.el.select('.layerTopBelow').empty()){
            master.el.append('path')
                .attr('class','layerTopBelow');
        }
    }
    master.draw = ()=>{
        const {
            scaleX,
            height,
            boxW,
            data
        } = graphicopt;

        let boxPlotMaxAbove = d3.max(data,d=>d.maxAbove);
        let boxPlotMaxBelow = d3.min(data,d=>d.maxBelow);

        const scaleY = d3.scaleLinear().domain([0, Math.max(boxPlotMaxAbove,Math.abs(boxPlotMaxBelow))])
                .range([1, height]);

        let boxPlotGridData = [];
        boxPlotGridData.push({"value": boxPlotMaxAbove.toFixed(2),y:-scaleY(boxPlotMaxAbove)});
        boxPlotGridData.push({"value": 0,y:0});
        boxPlotGridData.push({"value": boxPlotMaxBelow.toFixed(2),y:-scaleY(boxPlotMaxBelow)});

        const areaTopAbove = d3.area()
                .x(d=>scaleX(d.timestep))
                .y0(() => 0)
                .y1(function (d, i) {
                    return -scaleY(d.maxAbove);
                })
                .defined(d => !isNaN(d.maxAbove));

        const areaTopBelow = d3.area()
                .x(d=>scaleX(d.timestep))
                .y0(() => 0)
                .y1(function (d, i) {
                    return -scaleY(d.maxBelow);
                })
                .defined(d => !isNaN(d.maxBelow));

        master.el.selectAll('g.boxplotCell')
            .data(data.filter(d=>d.nodes.length),d=>d.timestep)
            .join(
                enter => {
                    const g = enter.append("g")
                        .attr("class", "boxplotCell")
                        .attr("transform", d => `translate(${scaleX(d.timestep)},0)`);
                    g
                        .append("line")
                        .attr('class', 'boxplotLine')
                        .attr('y1', d=>-scaleY(d.maxAbove))
                        .attr('y2', d=>-scaleY(d.maxBelow));
                    g
                        .append("rect")
                        .attr('class', 'boxplotRectAbove')
                        .attr('width', boxW)
                        .attr('x', -boxW / 2)
                        .attr('height', d=>scaleY(d.averageAbove))
                        .attr('y', d=>-scaleY(d.averageAbove));
                    g
                        .append("rect")
                        .attr('class', 'boxplotRectBelow')
                        .attr('width', boxW)
                        .attr('x', -boxW / 2)
                        .attr('height', d=>scaleY(-d.averageBelow));
                    return g;
                },
                update => {
                    const g = update
                        .attr("transform", d => `translate(${scaleX(d.timestep)},0)`);
                    g
                        .select("line.boxplotLine")
                        .attr('y1', d=>-scaleY(d.maxAbove))
                        .attr('y2', d=>-scaleY(d.maxBelow));
                    g
                        .select("rect.boxplotRectAbove")
                        .attr('height', d=>scaleY(d.averageAbove))
                        .attr('y', d=>-scaleY(d.averageAbove));
                    g
                        .select("rect.boxplotRectBelow")
                        .attr('height', d=>scaleY(-d.averageBelow));
                    return g;
                }
            );
        master.el.select('path.layerTopAbove').attr('d',areaTopAbove(data));
        master.el.select('path.layerTopBelow').attr('d',areaTopBelow(data));

        const wrange = scaleX.range()
        master.grid.selectAll('line').data(boxPlotGridData)
            .join('line')
            .attr('x1',wrange[0]-15)
            .attr('x2',wrange[1])
            .attr('y1',d=>d.y)
            .attr('y2',d=>d.y)
            .style("stroke", "#000")
            .style("stroke-opacity", 1)
            .style("stroke-width", 0.3)
            .style("stroke-dasharray", "3, 1")
        master.grid.selectAll('text').data(boxPlotGridData)
            .join('text')
            .attr('x',wrange[0]-17)
            .attr('dy','0.5rem')
            .attr('y',d=>d.y)
            .attr('text-anchor','end')
            .text(d=>d.value)
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