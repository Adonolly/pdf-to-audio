# 📄 PDF to Audio Converter

A modern, browser-based web application that allows users to upload PDF documents and convert them into spoken audio instantly. This tool leverages the power of **PDF.js** for text extraction and the **Web Speech API** for high-quality text-to-speech synthesis.

## ✨ Features

* **Drag & Drop Interface:** Effortlessly upload files by dragging them into the designated drop zone.
* **Live Text Extraction:** Real-time extraction and preview of text content from multi-page PDFs.
* **Integrated Audio Controls:** A custom-styled audio player with Play/Pause functionality.
* **Simulated Progress Tracking:** The audio seek bar and timer stay in sync with the AI's reading progress.
* **Fully Responsive:** Optimized for both desktop and mobile viewing.
* **No Server Required:** Processes everything locally in your browser for maximum privacy.

## 🚀 How It Works

1.  **Upload:** Select a PDF file from your computer or drag it into the box.
2.  **Process:** The app uses `pdf.js` to read through each page and extract the text strings.
3.  **Listen:** Once extraction is complete, the audio section appears. Click **Play** to hear the text read aloud.
4.  **Review:** Follow along with the extracted text in the scrollable preview window.

## 🛠️ Technology Stack

* **HTML5 & CSS3:** For the structure and modern, gradient-based UI.
* **JavaScript (ES6+):** For the application logic and event handling.
* **[PDF.js](https://mozilla.github.io/pdf.js/):** A general-purpose, web standards-compliant platform for parsing and rendering PDFs.
* **Web Speech API:** To provide the text-to-speech (TTS) engine.

## 📝 Note on Audio Exports
This version uses the browser's native speech synthesis. While it provides excellent live playback, please note that "MP3 Download" is currently a UI placeholder as the native browser API does not support direct file encoding.

## 👨‍💻 Installation & Usage
1. Clone the repository or download the source files.
2. Ensure you have an active internet connection (to load the PDF.js and FontAwesome libraries via CDN).
3. Open `index.html` in any modern web browser.
