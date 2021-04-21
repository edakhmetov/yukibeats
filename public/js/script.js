const audios = document.querySelectorAll('audio');
const playBtns = document.querySelectorAll('.playBtn');
const songContainers = document.querySelectorAll('.songContainer');
const seekbars = document.querySelectorAll('.seekbar');
const songPlayers = document.querySelectorAll('.songPlayer');
const mainSection = document.querySelector('.main');
const times = document.querySelectorAll('.time');
const scroll = document.querySelector('.scroll');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const checkbox = document.querySelector('.checkbox');
const canvases = document.querySelectorAll('.waveformCanvases');
const mainCanvas = document.querySelector('#mainCanvas');
const mainCanvasContext = mainCanvas.getContext('2d');

function getDocHeight() {
    const D = document;
    return Math.max(
        Math.max(D.body.scrollHeight, D.documentElement.scrollHeight),
        Math.max(D.body.offsetHeight, D.documentElement.offsetHeight),
        Math.max(D.body.clientHeight, D.documentElement.clientHeight)
    );
};
function scrollScreen() {
    window.scrollTo({
        top: getDocHeight(),
        left: 0,
        behavior: 'smooth'
    });
};
scroll.addEventListener('click', () => {
    scrollScreen();
});
hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('toggle');
});
checkbox.addEventListener('click', function () {
    if (!checkbox.checked) {
        checkbox.removeAttribute('checked');
        mainCanvas.style.display = "none";
    } else {
        checkbox.setAttribute('checked', "");
        mainCanvas.style.display = "block";
        scrollScreen();
    }
});
const allSoundsById = [];
const audioContextById = [];

const renderWaveform = function (audioID) {
    let canvasElement = canvases[audioID];
    let canvasContext = canvasElement.getContext('2d');
    let globalPeaks = [];
    const width = canvasElement.width;
    const height = canvasElement.height;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let time = audios[audioID].currentTime;
    function drawAudio(url) {
        fetch(url)
            .then(function (response) {
                return response.arrayBuffer()
            })
            .then(function (arrayBuffer) {
                return decode(arrayBuffer)
            })
            .catch(function (err) {
                console.log(err)
            });
    };
    function decode(arrayBuffer) {
        audioContext.decodeAudioData(arrayBuffer, function (audioBuffer) {
            setPeaks(audioBuffer)
        }, function (err) {
            console.log(err);
        })
    };
    function setPeaks(buffer) {
        const peaks = [];
        let min = 0;
        let max = 0;
        let top = 0;
        let bottom = 0;
        const segSize = Math.ceil(buffer.length / canvasElement.width);
        duration = buffer.duration;
        for (let c = 0; c < buffer.numberOfChannels; c++) {
            const data = buffer.getChannelData(c);
            for (let s = 0; s < width; s++) {
                const start = s * segSize;
                const end = start + segSize;
                min = 0.01;
                max = 0.01;
                for (let i = start; i < end; i++) {
                    if (data[i] < min) {
                        min = data[i];
                    } else {
                        min = min / 2;
                    }
                    if (data[i] > max) {
                        max = data[i];
                    } else {
                        max = max * 2;
                    }
                }
                if (peaks[s]) {
                    peaks[s][0] = peaks[s][0] < max ? max : peaks[s][0]
                    peaks[s][1] = peaks[s][1] > min ? min : peaks[s][1]
                }
                peaks[s] = [max, min]
            }
        };
        for (let i = 0; i < peaks.length; i++) {
            max = peaks[i][0];
            min = peaks[i][1];
            top = ((height / 2) - (max * height / 2));
            bottom = ((height / 2) - (min * height / 2));
            peaks[i] = [top, bottom === top ? top + 1 : bottom];
        };
        globalPeaks = peaks;
        waveform();
    };
    function waveform() {
        const peaks = globalPeaks;
        const time = audios[audioID].currentTime;
        const playX = time / audios[audioID].duration * width;
        let x = 0;
        canvasContext.clearRect(0, 0, width, height);
        x = draw(peaks.slice(0, playX), 1, '#e3784d', x);
        draw(peaks.slice(playX), 1, 'rgb(100, 100, 100)', x);
        drawTime(time);
        requestAnimationFrame(waveform);
    };
    function draw(data, lineWidth, color, x) {
        canvasContext.lineWidth = lineWidth;
        canvasContext.strokeStyle = color;
        canvasContext.beginPath();
        data.forEach(function (v) {
            canvasContext.moveTo(x, v[0]);
            canvasContext.lineTo(x, v[1]);
            x++
        });
        canvasContext.stroke();
        return x;
    };
    function timeFormat(timeSec) {
        let frmStr = '';
        const time = parseFloat(timeSec)
        if (isNaN(time)) {
            return frmStr;
        };
        const min = ~~(time / 60);
        const sec = ~~(time % 60);
        const ms = ~~(time % 1 * 1000);
        frmStr = (min < 10) ? `0${min}:` : `${min}:`;
        frmStr += `0${sec}`.substr(-2);
        // if (this.playtimeWithMs) {
        //   frmStr += '.' + `00${ms}`.substr(-3)
        // }
        return frmStr;
    };
    function drawTime(time) {
        const timeStr = timeFormat(time);
        const offset = 3;
        const textWidth = ~~canvasContext.measureText(timeStr).width;
        const playX = time / audios[audioID].duration * width;
        const textX = playX > (width - textWidth - offset)
            ? playX - textWidth - offset
            : playX + offset;
        // const textY = this.playtimeTextBottom
        //   ? this.canvHeight - this.playtimeFontSize + offset
        //   : this.playtimeFontSize + offset
        const textY = 12 + offset;
        canvasContext.fillStyle = 'grey';
        canvasContext.font = "12px 'Aquatico'";
        canvasContext.fillText(timeStr, textX, textY);
    };
    drawAudio(audios[audioID].src);
}

window.onload = function () {
    mainCanvas.width = window.innerWidth;
    if (mainCanvas.width > 868) {
        checkbox.setAttribute('checked', "");
        mainCanvas.style.display = "block";
        let width = mainCanvas.width * 0.25;
        resizeCanvases(width);
    } else if (mainCanvas.width > 500) {
        let width = mainCanvas.width * 0.6;
        resizeCanvases(width);
    } else {
        mainCanvas.style.display = "none";
        resizeCanvases(250);
    }
    audios.forEach(function (_, i) {
        renderWaveform(i);
    });
};
function resizeCanvases(width) {
    canvases.forEach(function (canvas) {
        canvas.width = width;
    });
};
const renderVisualizer = function (audioID) {
    const createAudioContextObj = function (sound) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const src = audioContext.createMediaElementSource(sound);
        const analyser = audioContext.createAnalyser();
        src.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 1024;
        const bufferLength = analyser.frequencyBinCount;
        const freqData = new Uint8Array(bufferLength);
        audioContextObj = {
            freqData,
            analyser
        }
        return audioContextObj;
    };
    Object.keys(allSoundsById).forEach(function (id) {
        // condition to avoid creating duplicate context. the visualizer won't break without it, but you will get a console error.
        if (!audioContextById[id]) {
            audioContextById[id] = createAudioContextObj(allSoundsById[id])
        }
    });
    const WIDTH = mainCanvas.clientWidth;
    const HEIGHT = mainCanvas.clientHeight;
    let barHeight;
    let barsCount;
    if (window.innerWidth <= 768) {
        barsCount = 50;
    } else {
        barsCount = 175;
    }
    let barWidth = ((WIDTH / barsCount) / 2) - 1;
    function renderFrame() {
        const freqDataMany = [];
        const agg = [];
        mainCanvasContext.clearRect(0, 0, WIDTH, HEIGHT);
        mainCanvasContext.fillStyle = '#fff';
        mainCanvasContext.fillRect(0, 0, WIDTH, HEIGHT);
        audioContextArr = Object.values(audioContextById);
        // for each element in that array, get the *current* frequency data and store it
        audioContextArr.forEach(function (audioContextObj) {
            let freqData = audioContextObj.freqData;
            audioContextObj.analyser.getByteFrequencyData(freqData);
            freqDataMany.push(freqData);
        });
        if (audioContextArr.length > 0) {
            for (let i = 0; i < freqDataMany[0].length; i++) {
                agg.push(0);
                freqDataMany.forEach(function (data) {
                    agg[i] += data[i];
                });
            };
            let x = 0;
            for (let i = 0; i < (barsCount); i++) {
                barHeight = (agg[i] * 0.4);
                let y = (HEIGHT - barHeight);
                let reverseBarWidth = barWidth * -1;
                let reverseX = WIDTH - x;
                drawBar(mainCanvasContext, x, y, barWidth, barHeight);
                drawBar(mainCanvasContext, reverseX, y, reverseBarWidth, barHeight);
                x += barWidth + 1.002;
            };
            function drawBar(canvasContext, x, y, barWidth, barHeight) {
                let currentPos = audios[audioID].currentTime / audios[audioID].duration;
                if (x / WIDTH >= currentPos) {
                    canvasContext.fillStyle = `rgb(100, 100, 100)`;
                } else {
                    canvasContext.fillStyle = `#e3784d`;
                };
                canvasContext.fillRect(x, y, barWidth, barHeight);
            };
        };
        requestAnimationFrame(renderFrame);
    };
    renderFrame();
};

audios.forEach(function (audio, i) {
    let canvasElement = canvases[i];
    let playBtn = playBtns[i];
    let songContainer = songContainers[i];
    // let seekbar = seekbars[i];
    let time = times[i];

    // Play song
    let playSong = function () {
        songContainer.classList.add('play');
        playBtn.querySelector('i.fas').classList.remove('fa-play');
        playBtn.querySelector('i.fas').classList.add('fa-pause');
        audio.play();
    };
    // Pause Song
    let pauseSong = function () {
        songContainer.classList.remove('play');
        playBtn.querySelector('i.fas').classList.add('fa-play');
        playBtn.querySelector('i.fas').classList.remove('fa-pause');
        audio.pause();
    };
    const resizeCanvas = function () {
        mainCanvas.width = window.innerWidth;
    };
    window.addEventListener('resize', resizeCanvas);

    // update progress with music
    let setProgress = function () {
        const cur = audio.currentTime;
        // seekbar.value = cur;
        // seekbar.style.background = 'linear-gradient(to right, #e3784d, #e3784d ' + (seekbar.value / audio.duration) * 100 + '%, rgb(100, 100, 100) ' + (seekbar.value / audio.duration) * 100 + '%, rgb(100, 100, 100))';
        time.style.left = `${0 + (100 * (cur / audio.duration * 100)) / 100}%`;
        const currentMin = Math.floor(cur / 60);
        const currentSec = Math.floor(cur % 60);
        if (currentSec < 10) {
            time.innerHTML = `${currentMin}:0${currentSec}`;
        } else {
            time.innerHTML = `${currentMin}:${currentSec}`;
        }
    };

    // update the seekbar when user touches
    // seekbar.oninput = function () {
    //     audio.currentTime = this.value;
    // };

    playBtn.addEventListener('click', function () {
        audio.id = i;
        audio.dataset.action = "off"
        allSoundsById[audio.id] = audio;
        // seekbar.max = Math.floor(audio.duration);
        const isPlaying = songContainer.classList.contains('play');
        if (isPlaying) {
            pauseSong();
        } else {
            playSong();
        }
        for (let k = 0; k < audios.length; k++) {
            const pauseOtherSongs = function () {
                songContainers[k].classList.remove('play');
                playBtns[k].querySelector('i.fas').classList.add('fa-play');
                playBtns[k].querySelector('i.fas').classList.remove('fa-pause');
                audios[k].pause();
            }
            if (k === i) {
                if (!songContainers[k].classList.contains('play')) {
                    pauseOtherSongs();
                } else {
                    playSong(i);
                    if (checkbox.checked) {
                        renderVisualizer(i);
                    }
                }
            } else {
                pauseOtherSongs();
            }
        }
    });
    audio.addEventListener('ended', pauseSong);

    // update the seekbar
    audio.addEventListener('timeupdate', setProgress);

    // update the song when user touches the visualizer
    function setVisualizer(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;

        if (songContainer.classList.contains('play')) {
            const duration = audio.duration;
            audio.currentTime = (clickX / width) * duration;
        } else {
            return
        }
    }

    canvasElement.addEventListener('click', setVisualizer);
    mainCanvas.addEventListener('click', setVisualizer);
});