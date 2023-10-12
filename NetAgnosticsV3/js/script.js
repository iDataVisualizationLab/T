// Get references to elements
const controlPanel = document.getElementById('controlPanel');
const burgerMenu = document.getElementById('burgerMenu');
const content = document.getElementById('content');

// Toggle the content visibility
function toggleContent() {
    content.classList.toggle('content-hidden');
    // Toggle the width and border-radius for circle shape
    if (content.classList.contains('content-hidden')) {
        console.log("content-hidden")
        controlPanel.style.width = '30px';
        controlPanel.style.height = '30px';
        controlPanel.style.borderRadius = '50%';
    } else {
        controlPanel.style.width = '250px';
        controlPanel.style.height = 'auto';
        controlPanel.style.borderRadius = '8px';
    }
}

// Make the control panel draggable
let isDragging = false;
let offsetX, offsetY;

controlPanel.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - controlPanel.getBoundingClientRect().left;
    offsetY = e.clientY - controlPanel.getBoundingClientRect().top;
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        controlPanel.style.left = e.clientX - offsetX + 'px';
        controlPanel.style.top = e.clientY - offsetY + 'px';
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});




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
    // console.log("1")
    // d3.json("data/nocona_2023-04-13-2023-04-14.json").then(_data => {
    //     console.log(2)
    //     const data_ = preadjustdata(_data)
    //     console.log(data_)
    // })
    d3.json("./data/nocona_2023-04-13-2023-04-14.json").then(d=>preadjustdata(d)).then((data) => {
        
    console.log("2")
    console.log(data);
    })
    // d3.json("./data/nocona_2023-04-13-2023-04-14.json", function (data_) {
        
    // console.log("2")
    //     console.log(data_);
    // })
}

loadData();