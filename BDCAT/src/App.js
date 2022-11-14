
import './App.css';
import React, {useState, useEffect, useRef, useMemo} from 'react';
import Globe from 'react-globe.gl'
import * as d3 from 'd3'
import indexBy from "index-array-by";
import registrants from "./data/Registrants.csv"
import geo from "./data/worldcities.csv"
import ttulogo from "./cat.jpeg"
import SpaceDust from "./Components/SpaceDust"

// [{ lat: 19.6, lng: 80, altitude: 0.6 },{ lat: 50, lng: 60, altitude: 0.4 },{ lat: 31.3037101, lng: -89.29276214, altitude: 0.4 },{ lat: 33.5842591, lng: -101.8804709, altitude: 0.6 }]
// const MAP_CENTERs = [{ lat: 87.5842591, lng: -70.8804709, altitude: 1.8 }];
const MAP_CENTERs = [{ lat: 19.6, lng: 90, altitude: 0.8 },{ lat: 51.58421865, lng: 13.1910, altitude: 0.4 },{ lat: -22.9009, lng: -47.0573, altitude: 0.4 }, {lat: 38, lng: -88.29276214, altitude: 0.6 }
,{ lat: 38, lng: -120.8804709, altitude: 0.8 },{lat: 38, lng: -120.8804709, altitude: 1.8 }];
// const MAP_CENTER = { lat: 33.5842591, lng: -101.8804709, altitude: 0.6 };
const OPACITY = 0.3;
const RING_PROPAGATION_SPEED = 1; // deg/sec

function getValue(d){
    return Math.max(d["Amount Ordered"],d["Discounts Applied"])
}

//function getCount(d){
//    return 1;//Math.max(d["Amount Ordered"],d["Discounts Applied"])
//}

const arcThickScale = d3.scaleLinear().range([0.1,0.7]);
function App() {
    const globeEl = useRef();
    const [logos, setLogos] = useState([]);
    const [locs, setLocs] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [hoverArc, setHoverArc] = useState();
    const [selectPoint, setSelectPoint] = useState();
    const [currentSequnce,setCurrentSequnce] = useState(0);

    useEffect(() => {
        // load data
        Promise.all([
            d3.csv(registrants),
            d3.csv(geo)
        ]).then(([locationData,geo]) => {
            locationData.forEach(d=> {
                if (d["Work Country"] ==="USA")
                    d["Work Country"] = "United States"
                if (d["Work Country"] ==="Republic of Korea")
                    d["Work Country"] = "South Korea"
                if (d["Work City"] ==="KNOXVILLE")
                    d["Work City"] = "Knoxville"
                if (d["Work City"] ==="St Andrews")
                    d["Work City"] = "Saint Andrews"
                if (d["Work City"] ==="Aalto")
                    d["Work City"] = "Espoo"
                if (d["Work City"] ==="Wien")
                    d["Work City"] = "Vienna"
                if (d["Work City"] ==="FAYETTEVILLE")
                    d["Work City"] = "Fayetteville"
                if (d["Work City"] ==="Göteborg")
                    d["Work City"] = "Gothenburg"
                if (d["Work City"] ==="Postadam")
                    d["Work City"] = "Potsdam"
                if (d["Work City"] ==="Klagenfurt am Wörthersee")
                    d["Work City"] = "Klagenfurt"
                if (d["Work City"] ==="Cradiff")
                    d["Work City"] = "Caerdydd"
                if (d["Work City"] ==="Newcastle Upon Tyne")
                    d["Work City"] = "Newcastle"
                if (d["Work City"] ==="Bukgu-Daegu")
                    d["Work City"] = "Daegu"
            })
            const groupByLocation = d3.groups(locationData,d=>d["Work City"]+', '+d["Work Country"]);
            groupByLocation.forEach(d=>{
                const loc = d[0].split(',');
                d.city = loc[0];
                d.country = loc[1].trim();
            })
            arcThickScale.domain(d3.extent(groupByLocation,d=>d3.sum(d[1],getValue)));//d3.max(d["Amount Ordered"],d["Amount Ordered"])
            // route
            const byLocName = {};
            geo.forEach(d=>{
                byLocName[d.city_ascii+', '+d["country"]] = d;
            })
            byLocName['Urbana, IL, United States'] = geo.find(d=>(d.city_ascii==='Urbana')&&(d.admin_name==='Illinois'))
            // indexBy(geo, 'city_ascii', false);
            const host = geo.find(d=>(d.city_ascii==='Portland')&&(d.admin_name==='Oregon'))
            debugger
            const locs = groupByLocation.map(d=>{
                return {...byLocName[d[0]],"Location Name":d[0], count:d3.sum(d[1],getValue),values:d[1]}
            })
            locs.sort((a,b)=>b.count-a.count)
            locs.push({...host,"Location Name":"Oregon",count:10,color:"red"});

            setLocs(locs);
            const filteredRoutes = groupByLocation
                .map(d => ({
                    name: d[0],
                    srcIata: d[0],
                    src: byLocName[d[0]],
                    dstIata: "Portland, Oregon",
                    dst: host,
                    data: d[1],
                    count: Math.sqrt(arcThickScale(d3.sum(d[1],getValue)))
                  //  countAttendances: Math.sqrt(arcThickScale(d3.sum(d[1],getCount)))
                })); // domestic routes within country
            console.log(filteredRoutes)
            debugger
            setRoutes(filteredRoutes);
            globeEl.current.pointOfView(MAP_CENTERs[0], 4000)
            // MAP_CENTERs.forEach(d=>globeEl.current.pointOfView(d, 4000))
        });
    }, []);

    useEffect(()=>{
        if (globeEl.current) {
            if (currentSequnce < MAP_CENTERs.length) {
                const interval = setTimeout(() => {
                    globeEl.current.pointOfView(MAP_CENTERs[currentSequnce], 4000)
                    setCurrentSequnce(currentSequnce + 1);
                }, 4000);
                return () => {
                    clearInterval(interval);
                };
            }
        }
    },[currentSequnce])
    function stopPlay(){
        setCurrentSequnce(MAP_CENTERs.length)
    }
    return  <div
        className="App"
        style={{
            background: "#000010",
            position: "relative"
        }}
    >
        <div style={{
            transform: "translate(-20%, 0)",
            width: '130wh'
        }}>
            <Globe
            ref={globeEl}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"

            // onArcHover={setHoverArc}
            arcsData={routes}
            arcLabel={d => ''}
            arcStartLat={d => +d.src.lat}
            arcStartLng={d => +d.src.lng}
            arcEndLat={d => +d.dst.lat}
            arcEndLng={d => +d.dst.lng}
            arcDashLength={0.4}
            arcDashGap={0.8}
            arcDashAnimateTime={d=>5000}
            arcsTransitionDuration={1000}
            arcStroke={d=>d.count}
            arcColor={d => {
                const op = !hoverArc ? OPACITY : d === hoverArc ? 0.9 : OPACITY / 4;
                return [`rgba(0, 255, 0, ${op})`, `rgba(255, 0, 0, ${op})`];
            }}
            // pointsData={locs}
            // pointColor={d => d.color??'orange'}
            // pointLat={d => d.lat}
            // pointLng={d => d.long}
            // pointAltitude={0}
            // pointRadius={d => arcThickScale(d.count)}
            // pointsMerge={true}

            labelsData={locs}
            labelLat={d => d.lat}
            labelLng={d => d.lng}
            labelAltitude={d=>(selectPoint&&(selectPoint===d))?0.01:0}
            labelText={d => d['Location Name']}
            labelSize={d => (selectPoint&&(selectPoint===d))?0.8:arcThickScale(d.count)/3}
            labelDotRadius={d => arcThickScale(d.count)}
            labelColor={d => (selectPoint&&(selectPoint===d))?('#dd6700'):(d.color??'orange')}
            labelResolution={2}

            ringsData={[locs[locs.length-1]]}
            ringLat={d => d.lat}
            ringLng={d => d.lng}
            ringColor={() => t => `rgba(255,100,50,${1-t})`}
            ringMaxRadius={d=>arcThickScale(d.count)*5}
            ringPropagationSpeed={d=>arcThickScale(d.count)*RING_PROPAGATION_SPEED}
            // ringRepeatPeriod={d=>arcThickScale(d.count) }
            htmlElementsData={logos}
            htmlLat={d => d.lat}
            htmlLng={d => d.lng}
             htmlElement={<img src={ttulogo} width={"500px"} alt="Logo" />}
            //htmlElement={<h1>We are here</h1>}
            onGlobeClick={stopPlay}
            />
        </div>


        <div
            style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                padding: "50px",
                display: "flex",
                alignItems: "center",
                flexDirection: "column"
            }}
        >   
            <div style={{
                display: "flex",
                alignItems: "center",
                fontSize: "26px",
                color: "#fff",
                visibility:"show"
            }}
                 onClick={()=>{setCurrentSequnce(0)}}
            >
            Map of UCC/BDCAT attendees 
              <img src={ttulogo} width={"150px"} alt="Logo" />
            </div>




             <div style={{
                display: "flex",
                alignItems: "center",
                fontSize: "20px",
                color: "#fff",
                visibility:"show"
            }}
            >
                ------
            </div>

             <div style={{
                display: "flex",
                alignItems: "center",
                fontSize: "20px",
                color: "#fff",
                visibility:"show"
            }}
            >
             UCC/BDCAT attendees contributions ($) 
            </div>

            <div style={{
                display: "flex",
                alignItems: "right",
                color: "#fff",
                flexDirection: "column",
                height:'calc(100vh - 300px)',
                width:'100%',
                padding:'10px',
                position:'relative',
                overflowY:'auto',
                overflowX: 'hidden',
                background: '#ffffff0d',
                borderRadius:'5px',
                marginBottom:'10px',
                fontSize:'small',
            }} className="sc1">
                {locs.slice(0,locs.length-1).map(d=><div key={d['Location Name']} style={{width:'100%', padding: '1px', display: "flex"}}
                                                         onMouseEnter={()=>{setSelectPoint(d)}}
                                                         onMouseLeave={()=>{setSelectPoint(undefined)}}
                                                         onClick={()=>{stopPlay(); globeEl.current.pointOfView({lat:d.lat,lng:d.lng+8,altitude:0.4}, 1000)}}
                >
                    <div style={{width:'30%', textAlign:"right",padding:'2px',textOverflow: "ellipsis",whiteSpace: "nowrap",overflow: "hidden"}}>{d['Location Name']}</div>
                    <div style={{width:'70%',height:'100%',background:'black',position:'relative',borderRadius:'10px'}}>
                        <div style={{width:`${(d.count/arcThickScale.domain()[1])*100}%`,height:'100%',background:(selectPoint&&(selectPoint===d))?'#dd6700':'orange',position:'absolute',borderRadius:'4px'}}>
                            <span>{d.count}</span>
                        </div>
                    </div>
                </div>)}
            </div>
            
        </div> 
    </div>;
}

export default App;
