let maxCore = 36;

function queryLayout() {
    return d3.json('src/data/layout.json').then(layout => {
        Layout.data = layout;
        Layout.data_flat = Object.entries(layout).map(d => (d.value = _.flatten(d.value).filter(e => e !== null), d));
        let {tree, compute_layoutLink} = data2tree(Layout.data_flat);
        Layout.tree = tree;
        Layout.compute_layout = compute_layoutLink;
        // userPie.maxValue(Object.keys(Layout.compute_layout).length*maxCore);
    });
}

function handleData(data) {
    const computers = data[COMPUTE];
    _.mapObject(computers, (d, i) => (d.user = [], d.jobName = []))
    const jobs = data[JOB]; // object
    const rack = Layout.data;
    const user_job = d3.nest()
        .key(d => d.value[USER]) //user
        .key(d => d.key.split('.')[0]) //job array
        .object(Object.entries(jobs));
    const users = _.mapObject(user_job, (u, i) => {
        const job = [];
        let totalCore = 0;
        const node = _.uniq(_.flatten(_.values(u).map(d => d.map(d => (job.push(d.key), totalCore += d.value.cpu_cores, d.value.node_list)))));
        node.forEach(c => computers[c].user.push(i))
        const jobMain = _.uniq(job.map(j => j.split('.')[0]));
        return {node, job, jobMain, totalCore}
    });
    const jobName_job = d3.nest()
        .key(d => d.value[JOBNAME].slice(0, 3)) //user
        .key(d => d.key.split('.')[0]) //job array
        .entries(Object.entries(jobs));
    return {computers, jobs, users}
}

function adjustTree(sampleS, computers) {
    let {tree, compute_layoutLink} = data2tree(Layout.data_flat, sampleS, computers);
    Layout.tree = tree;
}

// Setup the positions of outer nodes
function getData(d) {
    if (vizservice[serviceSelected].text === 'User')
        return d.user;//?userIndex[d.user[0]]:-1;
    if (vizservice[serviceSelected].text === 'Radar' && d.cluster) {
        return d.cluster.length ? d.cluster[0].name : d.cluster.name;
    }
    return d.metrics[vizservice[serviceSelected].text]
}

function getData_delta(d) {
    if (vizservice[serviceSelected].text !== 'User' && vizservice[serviceSelected].text !== 'Radar')
        return d.metrics_delta[vizservice[serviceSelected].text];
    return 0;
}

function data2tree(data, sampleS, computers) {
    let serviceName = null;
    // if (cluster_info && vizservice[serviceSelected].text === 'Radar') {
    //     cluster_info.forEach(d => d.arr = [])
    //     serviceName = vizservice[serviceSelected].text;
    // }
    const compute_layoutLink = {};
    const tree = {
        name: "__main__", children: data.map(d => {
            const el = {
                name: d.key,
                children: d.value.map(c => {
                    const item = {
                        name: c,
                        value: 1,
                        metrics: {},
                        metrics_delta: {},
                        user: computers ? computers[c].user : [],
                        jobName: computers ? computers[c].jobName : []
                    };
                    if (sampleS) {
                        serviceFullList.forEach(s => item.metrics[s.text] = _.last(sampleS[c][serviceListattr[s.idroot]])[s.id]);
                        if (computers)
                            computers[c].metric = item.metrics;
                        if (Layout.computers_old) {
                            serviceFullList.forEach(s => item.metrics_delta[s.text] = item.metrics[s.text] - Layout.computers_old[c].metric[s.text]);
                        }
                    }
                    // if (serviceName === 'Radar' && cluster_info) {
                    //     getCluster(item)
                    // }
                    compute_layoutLink[c] = d.key;
                    return item;
                })
            };
            el.summary = {};
            if (sampleS)
                serviceFullList.forEach(s => {
                    const dataarr = el.children.map(d => d.metrics[s.text]);
                    el.summary[s.text] = {
                        min: d3.min(dataarr),
                        max: d3.max(dataarr),
                        // q1:d3.min(dataarr),
                        // q3:d3.min(dataarr),
                        // median:d3.min(dataarr),
                        mean: d3.mean(dataarr),
                        // std:d3.min(dataarr),
                    };
                });
            return el;
        })
    };
    // if (cluster_info && vizservice[serviceSelected].text === 'Radar') {
    //     cluster_info.forEach(d => (d.total = d.arr.length));
    //     cluster_map(cluster_info)
    // }
    return {tree, compute_layoutLink};
}

let currentDraw = (_serviceSelected) => {
    const selectedSer = _serviceSelected??serviceSelected;
    const colorNet = (()=> {
        if (vizservice[selectedSer]) {
            const netMin = vizservice[selectedSer].suddenRange[0];
            const netMax = vizservice[selectedSer].suddenRange[1];
            return initColorFunc.copy().domain([netMin, netMin / 2, netMin / 4, 0, netMax / 4, netMax / 2, netMax]);
        } else
            return initColorFunc
    })();
    drawObject.graphicopt({colorNet})
        .data({serviceSelected:selectedSer})
        .draw()
};
let tsnedata = {};


function createdata({tree, computers, jobs, users, jobByNames, sampleS}) {
    if (!Layout.order) { // init order
        Layout.order = _.flatten(Layout.data_flat.map(d => d.value));
        Layout.order.object = {};
        Layout.order.forEach((c, i) => Layout.order.object[c] = i);
    }
    serviceName = vizservice[serviceSelected];
    let dataviz = [];
    Layout.tree.children.forEach(r => r.children.forEach(c => {
        let data = {data: c, value: getData(c), key: c.name};
        data.drawData = getDrawData(data);
        dataviz.push(data);
    }));
    Layout.snapshot = dataviz
}



function queryData(data) {
    console.time('queryData');
    const r = handleDataUrl(data);
    Layout.timespan = data.time_stamp;
    tsnedata = r.tsnedata;
    Object.keys(r).forEach(k=>{
        Layout[k] = r[k]
    })
    Layout.computers = r.computers;
    Layout.nodeFilter = {...r.computers};
    Layout.usersStatic = r.users;
    console.timeEnd('queryData');
}
