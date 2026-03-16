/**
 * PDF to Audio Converter - Final Unified Script
 * Features: Timer, Highlighting, Voice Selection, Volume, Speed & Skip Navigation.
 */

// 1. Setup PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// --- Elements ---
const fileInput = document.getElementById('fileInput');
const fileButton = document.getElementById('fileButton');
const dropArea = document.getElementById('dropArea');
const uploadSection = document.getElementById('uploadSection');
const processingSection = document.getElementById('processingSection');
const audioSection = document.getElementById('audioSection');
const progressBar = document.getElementById('progressBar');
const textPreview = document.getElementById('textPreview');
const playBtn = document.getElementById('playBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const downloadBtn = document.getElementById('downloadBtn');
const newFileBtn = document.getElementById('newFileBtn');
const audioPlayer = document.getElementById('audioPlayer');
const timeDisplay = document.getElementById('timeDisplay');

// Control Elements
const voiceSelect = document.getElementById('voiceSelect');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValueDisplay = document.getElementById('volumeValue');
const speedSlider = document.getElementById('speedSlider');
const speedValueDisplay = document.getElementById('speedValue');

// --- Global Variables ---
let extractedText = "";
let timerInterval = null;
let isPaused = false;
let currentElapsed = 0;
let totalEstimatedDuration = 0;
let currentCharacterIndex = 0; 
let voices = [];

// --- 2. Initialize Voice List ---
function populateVoiceList() {
    voices = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = ''; 

    voices.forEach((voice) => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        option.setAttribute('data-lang', voice.lang);
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });
}

// Load voices (some browsers load them asynchronously)
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}
populateVoiceList();

// --- 3. Event Listeners ---
fileButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
newFileBtn.addEventListener('click', resetApp);

// Slider Displays
volumeSlider.addEventListener('input', (e) => {
    volumeValueDisplay.innerText = Math.round(e.target.value * 100) + "%";
});

speedSlider.addEventListener('input', (e) => {
    speedValueDisplay.innerText = parseFloat(e.target.value).toFixed(1) + "x";
    // Restart speech to apply speed changes if currently playing
    if (window.speechSynthesis.speaking && !isPaused) {
        startSpeech(currentCharacterIndex);
    }
});

downloadBtn.addEventListener('click', () => {
    alert("MP3 Download requires a backend server. Browser Speech API only supports live playback.");
});

// --- 4. Navigation & Drag/Drop ---
backBtn.addEventListener('click', () => {
    currentCharacterIndex = Math.max(0, currentCharacterIndex - 200);
    startSpeech(currentCharacterIndex);
});

forwardBtn.addEventListener('click', () => {
    if (currentCharacterIndex + 200 < extractedText.length) {
        currentCharacterIndex += 200;
        startSpeech(currentCharacterIndex);
    }
});

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
    dropArea.addEventListener(name, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
});

dropArea.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));

// --- 5. PDF Processing ---
function handleFiles(files) {
    const file = files[0];
    if (file && file.type === "application/pdf") processPDF(file);
    else alert("Please upload a valid PDF file.");
}

async function processPDF(file) {
    uploadSection.style.display = 'none';
    processingSection.style.display = 'block';
    
    const reader = new FileReader();
    reader.onload = async function() {
        try {
            const typedarray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                fullText += content.items.map(item => item.str).join(" ") + "\n";
                progressBar.style.width = ((i / pdf.numPages) * 100) + '%';
            }

            extractedText = fullText.trim();
            processingSection.style.display = 'none';
            audioSection.style.display = 'block';

            // Prepare text for highlighting
            textPreview.innerHTML = extractedText.split(/\s+/).map(word => `<span>${word}</span>`).join(" ");
            
            const words = extractedText.split(/\s+/).length;
            totalEstimatedDuration = (words / 150) * 60; // Base estimate at 1x speed
            
        } catch (error) {
            alert("Error reading PDF.");
            resetApp();
        }
    };
    reader.readAsArrayBuffer(file);
}

// --- 6. Core Audio Logic ---
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return (h > 0 ? h + ":" : "") + (m < 10 && h > 0 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
}

playBtn.addEventListener('click', () => {
    const synth = window.speechSynthesis;
    if (synth.speaking && !isPaused) {
        synth.pause();
        isPaused = true;
        playBtn.innerText = "▶️ Resume";
        clearInterval(timerInterval);
    } else if (isPaused) {
        synth.resume();
        isPaused = false;
        playBtn.innerText = "⏸️ Pause";
        animateTimer();
    } else {
        startSpeech(0);
    }
});

function startSpeech(startIndex = 0) {
    if (!extractedText) return;
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(extractedText.slice(startIndex));
    
    // Apply User Settings
    const selectedVoiceName = voiceSelect.selectedOptions[0]?.getAttribute('data-name');
    if (selectedVoiceName) {
        utterance.voice = voices.find(v => v.name === selectedVoiceName);
    }
    utterance.volume = volumeSlider.value;
    utterance.rate = speedSlider.value; 

    const spans = textPreview.querySelectorAll('span');

    utterance.onboundary = (event) => {
        if (event.name === 'word') {
            currentCharacterIndex = startIndex + event.charIndex;
            // Sync timer: Adjust duration based on current speed
            const speedFactor = parseFloat(speedSlider.value);
            currentElapsed = (currentCharacterIndex / extractedText.length) * (totalEstimatedDuration / speedFactor);
            updateTimerUI();

            // Highlighting
            const wordIndex = extractedText.slice(0, currentCharacterIndex).trim().split(/\s+/).length - 1;
            spans.forEach(s => s.classList.remove('highlight-word'));
            if (spans[wordIndex]) {
                spans[wordIndex].classList.add('highlight-word');
                spans[wordIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    utterance.onstart = () => {
        playBtn.innerText = "⏸️ Pause";
        isPaused = false;
        animateTimer();
    };

    utterance.onend = () => {
        if (!isPaused && currentCharacterIndex >= extractedText.length - 20) stopSpeech();
    };

    synth.speak(utterance);
}

function animateTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!isPaused && window.speechSynthesis.speaking) {
            currentElapsed += 1;
            updateTimerUI();
        }
    }, 1000);
}

function updateTimerUI() {
    const speedFactor = parseFloat(speedSlider.value);
    const adjustedTotal = totalEstimatedDuration / speedFactor;
    
    if (currentElapsed <= adjustedTotal) audioPlayer.currentTime = currentElapsed;
    if (timeDisplay) timeDisplay.innerText = `${formatTime(currentElapsed)} / ${formatTime(adjustedTotal)}`;
}

function stopSpeech() {
    window.speechSynthesis.cancel();
    clearInterval(timerInterval);
    playBtn.innerText = "▶️ Play";
    isPaused = false;
    currentElapsed = 0;
    currentCharacterIndex = 0;
    updateTimerUI();
    textPreview.querySelectorAll('span').forEach(s => s.classList.remove('highlight-word'));
}

function resetApp() {
    stopSpeech();
    extractedText = "";
    fileInput.value = ""; 
    progressBar.style.width = '0%';
    audioSection.style.display = 'none';
    processingSection.style.display = 'none';
    uploadSection.style.display = 'block';
}
