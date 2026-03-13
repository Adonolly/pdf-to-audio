/**
 * PDF to Audio Converter - Final Unified Script
 * Fixes: Timer tracking, Pause/Resume logic, and Reset functionality.
 */

// 1. Setup PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// Elements
const fileInput = document.getElementById('fileInput');
const fileButton = document.getElementById('fileButton');
const dropArea = document.getElementById('dropArea');
const uploadSection = document.getElementById('uploadSection');
const processingSection = document.getElementById('processingSection');
const audioSection = document.getElementById('audioSection');
const progressBar = document.getElementById('progressBar');
const textPreview = document.getElementById('textPreview');
const playBtn = document.getElementById('playBtn');
const downloadBtn = document.getElementById('downloadBtn');
const newFileBtn = document.getElementById('newFileBtn');
const audioPlayer = document.getElementById('audioPlayer');

let extractedText = "";
let timerInterval = null;
let isPaused = false;
let currentElapsed = 0;
let totalEstimatedDuration = 0;

// --- 2. Event Listeners ---

fileButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
newFileBtn.addEventListener('click', resetApp);

// Download Alert (Honest Peer Note: Browsers can't download speech API audio directly)
downloadBtn.addEventListener('click', () => {
    alert("MP3 Download requires a backend server. Browser Speech API only supports live playback.");
});

// --- 3. Drag & Drop Logic ---

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
});

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
});

dropArea.addEventListener('drop', (e) => {
    handleFiles(e.dataTransfer.files);
});

// --- 4. File Processing ---

function handleFiles(files) {
    const file = files[0];
    if (file && file.type === "application/pdf") {
        processPDF(file);
    } else {
        alert("Please upload a valid PDF file.");
    }
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
                const strings = content.items.map(item => item.str);
                fullText += strings.join(" ") + "\n";
                
                let percent = (i / pdf.numPages) * 100;
                progressBar.style.width = percent + '%';
            }

            extractedText = fullText.trim();
            processingSection.style.display = 'none';
            audioSection.style.display = 'block';
            textPreview.innerText = extractedText || "No readable text found.";
            
            // Calculate estimated duration (~150 words per minute)
            const words = extractedText.split(/\s+/).length;
            totalEstimatedDuration = (words / 150) * 60;
            
        } catch (error) {
            alert("Error reading PDF.");
            resetApp();
        }
    };
    reader.readAsArrayBuffer(file);
}

// --- 5. Audio Logic (Pause/Resume Fix) ---

playBtn.addEventListener('click', () => {
    const synth = window.speechSynthesis;

    if (synth.speaking && !isPaused) {
        // PAUSE ACTION
        synth.pause();
        isPaused = true;
        playBtn.innerText = "▶️ Resume";
        clearInterval(timerInterval);
    } 
    else if (isPaused) {
        // RESUME ACTION
        synth.resume();
        isPaused = false;
        playBtn.innerText = "⏸️ Pause";
        animateTimer();
    } 
    else {
        // START NEW ACTION
        startSpeech();
    }
});

function startSpeech() {
    if (!extractedText) return;
    window.speechSynthesis.cancel(); // Safety clear

    const utterance = new SpeechSynthesisUtterance(extractedText);
    utterance.rate = 1.0; 

    utterance.onstart = () => {
        playBtn.innerText = "⏸️ Pause";
        currentElapsed = 0;
        animateTimer();
    };

    utterance.onend = () => {
        if (!isPaused) {
            stopSpeech();
        }
    };

    window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
    window.speechSynthesis.cancel();
    clearInterval(timerInterval);
    playBtn.innerText = "▶️ Play";
    audioPlayer.currentTime = 0;
    isPaused = false;
    currentElapsed = 0;
}

function animateTimer() {
    timerInterval = setInterval(() => {
        currentElapsed += 1;
        if (currentElapsed <= totalEstimatedDuration) {
            audioPlayer.currentTime = currentElapsed;
        } else {
            clearInterval(timerInterval);
        }
    }, 1000);
}

// --- 6. Reset Logic ---

function resetApp() {
    window.speechSynthesis.cancel();
    clearInterval(timerInterval);
    
    extractedText = "";
    currentElapsed = 0;
    isPaused = false;
    fileInput.value = ""; 
    
    audioPlayer.currentTime = 0;
    playBtn.innerText = "▶️ Play";
    textPreview.innerText = "";
    progressBar.style.width = '0%';

    audioSection.style.display = 'none';
    processingSection.style.display = 'none';
    uploadSection.style.display = 'block';
}