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
}

function scrollScreen() {
    window.scrollTo({
        top: getDocHeight(),
        left: 0,
        behavior: 'smooth'
    });
}

scroll.addEventListener('click', () => {
    scrollScreen();
});

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('toggle');
});

const checkbox = document.querySelector('.checkbox');

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
    let duration;
    let globalPeaks = [];
    const width = canvasElement.width;
    const height = canvasElement.height;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    function drawAudio(url) {
        fetch(url)
            .then(function(response) {
                return response.arrayBuffer()
            })
            .then(function(arrayBuffer) {
                return audioContext.decodeAudioData(arrayBuffer)
            })
            .then(function(audioBuffer) {
                return setPeaks(audioBuffer)
            })
            .catch(function(err) {
                console.log(err)
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
                        min = min/2;
                    }
                    if (data[i] > max) {
                        max = data[i];
                    } else {
                        max = max*2;
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
        requestAnimationFrame(waveform);
    };
    function draw(data, lineWidth, color, x) {
        canvasContext.lineWidth = lineWidth;
        canvasContext.strokeStyle = color;
        canvasContext.beginPath();
        data.forEach(function(v) {
            canvasContext.moveTo(x, v[0]);
            canvasContext.lineTo(x, v[1]);
            x++
        });
        canvasContext.stroke();
        return x;
    }
    drawAudio(audios[audioID].src);
}

window.onload = function () {
    mainCanvas.width = window.innerWidth;
    audios.forEach(function (_, i) {
        renderWaveform(i);
    });
    if (mainCanvas.width > 868) {
        checkbox.setAttribute('checked', "");
        mainCanvas.style.display = "block";
    } else {
        mainCanvas.style.display = "none";
        canvases.forEach(function(canvas) {
            canvas.width = 200;
        });
    }
};

const renderVisualizer = function (audioID) {
    const createAudioContextObj = function (sound) {
        // initialize new audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // create new audio context with given sound
        const src = audioContext.createMediaElementSource(sound);

        // create analyser (gets lots o data bout audio)
        const analyser = audioContext.createAnalyser();

        // connect audio source to analyser to get data for the sound
        src.connect(analyser);
        analyser.connect(audioContext.destination);
        if (window.innerWidth <= 768) {
            analyser.fftSize = 1024; // set the bin size to condense amount of data
        } else {
            analyser.fftSize = 2048; // set the bin size to condense amount of data
        }
        // array limited to unsigned int values 0-255
        const bufferLength = analyser.frequencyBinCount;
        const freqData = new Uint8Array(bufferLength);
        audioContextObj = {
            freqData, // note: at this time, this area is unpopulated!
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
        barsCount = 100;
    } else {
        barsCount = 350;
    }
    let barWidth = (WIDTH / barsCount);

    function renderFrame() {
        const freqDataMany = []; // reset array that holds the sound data for given number of audio sources
        const agg = []; // reset array that holds aggregate sound data

        mainCanvasContext.clearRect(0, 0, WIDTH, HEIGHT); // clear canvas at each frame
        mainCanvasContext.fillStyle = '#fff';
        mainCanvasContext.fillRect(0, 0, WIDTH, HEIGHT);
        audioContextArr = Object.values(audioContextById); // array with all the audio context information

        // for each element in that array, get the *current* frequency data and store it
        audioContextArr.forEach(function (audioContextObj) {
            let freqData = audioContextObj.freqData;
            audioContextObj.analyser.getByteFrequencyData(freqData); // populate with data
            freqDataMany.push(freqData);
        });

        if (audioContextArr.length > 0) {
            // aggregate that data!
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
                drawBar(mainCanvasContext, x, y, barWidth, barHeight);
                if (i < barsCount) {
                    x += barWidth + 1;
                } else {
                    barWidth += barWidth + 1;
                    x += barWidth + 1;
                }
            }
            function drawBar(canvasContext, x, y, barWidth, barHeight) {
                let currentPos = audios[audioID].currentTime / audios[audioID].duration;
                if (x / WIDTH >= currentPos) {
                    canvasContext.fillStyle = `rgb(100, 100, 100)`;
                } else {
                    canvasContext.fillStyle = `#e3784d`;
                }
                canvasContext.fillRect(x, y, barWidth, barHeight);
            }
        }
        requestAnimationFrame(renderFrame); // this defines the callback function for what to do at each frame
    }
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
    }

    // Pause Song
    let pauseSong = function () {
        songContainer.classList.remove('play');
        playBtn.querySelector('i.fas').classList.add('fa-play');
        playBtn.querySelector('i.fas').classList.remove('fa-pause');
        audio.pause();
    }

    const resizeCanvas = function () {
        mainCanvas.width = window.innerWidth;
    }
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
            // renderWaveform(i);
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
                        renderWaveform(i);
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
        // const width = canvasElement.width;
        const clickX = e.offsetX;

        if (songContainer.classList.contains('play')) {
            const duration = audio.duration;
            audio.currentTime = (clickX / width) * duration;
        } else {
            return
        }
    }

    canvasElement.addEventListener('click', setVisualizer);
    // mainCanvas.addEventListener('click', setVisualizer);
});