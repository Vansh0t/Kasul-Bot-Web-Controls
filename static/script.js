
toHHMMSS = function (sec_num) {
    sec_num = Math.floor(sec_num)
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}




//const WS_ENDPOINT = 'ws://127.0.0.1:5000'

const playLine = $("#play-line")
const playLineTrack = $('input[type=range]::-webkit-slider-runnable-track')

let isPaused = true
let isStopped = true
let isRequestingPos = false

const pauseSVG = "static/pause-button.svg"
const resumeSVG = "static/play-button.svg"
const resumeBtn = $("#play-resume")
const forwardBtn = $("#skip-forward")
const backwardBtn = $("#skip-backward")

const audioName = $("#play-name")
const audioTime = $("#play-time")

const queueForm = $('#queue-form')
const queueContainer = $("#sortable")
const queueKeep = $('#queue-keep')
const queueClear = $('#queue-clear')

let prevDragIndex = -1

let curAudio = ''
let playtime = 0
let audioLength = 0

let isPlayLineDrag = false

let trailCss
let trailCssMoz

//time between blur/focus after which blur event will invoke ui update
//fix for setInterval not running properly when tab is not active
const MIN_BLUR_TIME = 5000 
let winBlurLast = new Date().getTime()


for(var j = 0; j < document.styleSheets[0].cssRules.length; j++) {
    var rule = document.styleSheets[0].cssRules[j];
    if(rule.selectorText === "input[type=\"range\"]::-webkit-slider-runnable-track") {
        trailCss = rule
    }
    //::-moz elements won't show up in other browsers
    else if(rule.selectorText === "input[type=\"range\"]::-moz-range-track") {
        trailCss = rule
    }
    
}
const setPlayLineTrail = (value) => {
    gradient = `linear-gradient(90deg, rgba(88,101,242,1) 0%, rgba(88,101,242,1) ${value}%, rgba(19,19,19,1) ${value}%, rgba(19,19,19,1) 100%)`
    trailCss.style.background=gradient;
}

const setPlayLine = (value) => {
    setPlayLineTrail(value)
    playLine.val(value)
}

const getAudioQueue = () => {
    var lis = $("li.ui-state-default")
    //console.log(lis)
    const result= []
    for (l of lis) {
        result.push({url:l.firstChild.value})
    }
    return result
}

const getCurrentPlaytime = () => {
    var result = playLine.value;
    return result
}

const cmdPost = (data, callback)=> {
    $.ajax({
        url:`${window.location.href}/cmd`,
        type:"POST",
        data:JSON.stringify(data),
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        success: callback
      })
}

const onRemoveClick = (e)=>{
    from = $(e.target).parent().index()
    data = {cmd:'queue_remove', args: {from:from}}
    const callback = (data, status, jqXHR)=>{
        buildQueue(data.data.queue)
    }
    cmdPost(data, callback)
}

const buildQueue = (queue) => {
    queueContainer.empty()
    for (i of queue) {
        const btn = document.createElement('button')
        btn.innerHTML = '╳'
        btn.addEventListener('click', onRemoveClick)
        const p = document.createElement('p')
        p.setAttribute('class', 'queue-audio-name f-14')
        p.innerHTML = i.title
        const li = document.createElement('li')
        li.setAttribute("class", "ui-state-default")
        li.append(p)
        li.append(btn)
        //.append(`<p class='queue-audio-name'>${i.title}</p>`, btn)
        queueContainer.append(li)
        
    }
    
}
const fetchQueue = () => {
    const req = {
        cmd:'get_queue',
        args: {
            
        }
    }
    const callback = (data, status, jqXHR)=>{
        console.log(data)
        
        buildQueue(data.data.queue)
        
    }
    cmdPost(req, callback)
}
const setAudio = (name, length, playtime_) => {
    audioLength = length
    playtime = playtime_
    if (audioLength > 0) {
        setPlayLine(playtime_/length*100)
    }
    else {
        setPlayLine(0)
    }
    audioTime.text(toHHMMSS(playtime))
    audioName.text(name);
}
const initControls = () => {
    data = {cmd:'get_playing', args: {}}
    const callback = (data, status, jqXHR)=>{
        isPlaying_ = data.data.is_playing
        isPaused_ = data.data.is_paused
        isQueuePersistent = data.data.is_queue_persistent
        curAudio = data.data.cur_audio?data.data.cur_audio[1]:''
        setAudio(curAudio, data.data.length, data.data.playtime)

        queueKeep.prop('checked', data.data.is_queue_persistent)

        if(isPlaying_ && !isPaused_) {
            isPaused = false
        }
        else {
            isPaused = true
        }
        resumeBtn.children('img').attr("src", isPaused ? resumeSVG:pauseSVG);
    }
    cmdPost(data, callback)
}

const queueMove = (fromIndex, toIndex) =>{
    data = {cmd:'queue_move', args: {from:fromIndex, to:toIndex}}
    const callback = (data, status, jqXHR)=>{
        buildQueue(data.data.queue)
    }
    cmdPost(data, callback)
} 

queueContainer.on('sortupdate', (e, ui)=>{
    curIndex = ui.item.index()
    if(prevDragIndex>-1 && prevDragIndex != curIndex) {
        queueMove(prevDragIndex, curIndex)
    }
})
queueContainer.on('sortstart', (e, ui)=>{
    prevDragIndex = ui.item.index()
})

queueForm.on('submit', (e)=>{
    try {
        url = queueForm.children(':first-child').val()
        btnName = $(document.activeElement).attr('name')
        console.log(btnName)
        data = null
        if(btnName=='play')
            data = {cmd:'play', args: {url:url}}
        else 
            data = {cmd:'enqueue', args: {url:url}}
        console.log("WADW")
        
        const callback = (data, status, jqXHR)=>{
            console.log(data)
            if(data.data.queue)
                buildQueue(data.data.queue)
            initControls()
        }
        cmdPost(data, callback)
    }
    catch (e) {
        console.log(e)
    }
    return false
})

playLine.on('change', function(e) {
    offset = Math.floor(audioLength*this.value/100)
    console.log(this.value/100)
    data = {cmd:'set_play_pos', args: {pos:offset}}
    const callback = (data, status, jqXHR)=>{
        console.log(status)
        if(status=='success') {
            playtime = data.data.playtime
            audioLength = data.data.length
            setPlayLine(playtime/audioLength*100)
            isPaused = false
            isStopped = false
            resumeBtn.children('img').attr("src", pauseSVG);
            console.log(data)
        }
        isRequestingPos = false
    }
    isRequestingPos = true
    cmdPost(data, callback)
  });

playLine.on('mousedown', function(e) {
  console.log('mousedown')
  isPlayLineDrag = true
});
playLine.on('mouseup', function(e) {
    console.log('mouseup')
    isPlayLineDrag = false
  });
playLine.on('input', (e)=>{
    setPlayLineTrail(playLine.val())
})

resumeBtn.on('click', (e) => {
    if(curAudio ==='') return
    data = {cmd:isPaused?'resume':'pause', args: {}}
    const callback = (data, status, jqXHR)=>{
        isPaused = !isPaused
        resumeBtn.children('img').attr("src", isPaused ? resumeSVG:pauseSVG);
        playtime = data.data
        console.log(data.data)
    }
    cmdPost(data, callback)
})

forwardBtn.on('click', (e) => {
    console.log("Forward clicked")
    data = {cmd:'skip', args: {}}
    const callback = (data, status, jqXHR)=>{
        console.log(data)
        curAudio = data.data.cur_audio?data.data.cur_audio[1]:''
        buildQueue(data.data.queue)
        if (curAudio !== '') {
            isPaused = false
            isStopped = false
        }
        else {
            isPaused = true
            isStopped = true
        }
        resumeBtn.children('img').attr("src", isPaused ? resumeSVG:pauseSVG);
        setAudio(curAudio, data.data.length, 0)
    }
    cmdPost(data, callback)
})

backwardBtn.on('click', (e) => {
    console.log("Backward clicked")
    data = {cmd:'back', args: {}}
    const callback = (data, status, jqXHR)=>{
        console.log(data)
        curAudio = data.data.cur_audio?data.data.cur_audio[1]:''
        buildQueue(data.data.queue)
        if (curAudio !== '') {
            isPaused = false
            isStopped = false
        }
        else {
            isPaused = true
            isStopped = true
        }
        resumeBtn.children('img').attr("src", isPaused ? resumeSVG:pauseSVG);
        setAudio(curAudio, data.data.length, 0)
    }
    cmdPost(data, callback)
})

queueKeep.on('change', (e)=>{
    value = queueKeep.prop('checked')
    data = {cmd:'queue_keep', args: {value:value}}
    const callback = (data, status, jqXHR)=>{
        queueKeep.prop('checked', data.data.is_queue_persistent)
    }
    cmdPost(data, callback)

})

queueClear.on('click', (e) => {
    console.log("Stop clicked")
    data = {cmd:'queue_clear', args: {}}
    const callback = (data, status, jqXHR)=>{
        buildQueue(data.data.queue)
    }
    cmdPost(data, callback)
})

fetchQueue()
initControls()
const afterPlayUpd = ()=> setInterval(()=> {
    if(playtime>=audioLength) {
        fetchQueue()
        initControls()
    }
    else {
        clearInterval(afterPlayUpd)
    }
}, 4000)
const playFlow = ()=> {
    setInterval(()=>{
        if (!isPaused) {
            if(audioLength>0) {
                if(!isPaused && !isRequestingPos) {
                    if(playtime>=audioLength) {
                        isPaused = true
                        afterPlayUpd()
                    }
                    else {
                        playtime++
                        audioTime.text(toHHMMSS(playtime))
                    }     
                    if(!isPlayLineDrag) {
                        setPlayLine(playtime/audioLength*100)
                    }
                
                    //console.log(playtime/audioLength*100)
                    //console.log(playtime)
                }
                //stop cases handled by cmd responses
            }
        }
        
    }, 1000)
}
playFlow()

//const wsConnect = ()=> {
//    var socket = io();
//    socket.on('connect', function() {
//        socket.emit('json', {data: 'I\'m connected!'});
//    });
//}
//  
//wsConnect();

$(window).focus(function() {
    if (new Date().getTime() - winBlurLast > MIN_BLUR_TIME) {
        console.log('Upd')
        initControls()
    }
});

$(window).blur(function() { 
    winBlurLast = new Date().getTime()
});


















































