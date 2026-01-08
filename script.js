// --- APP STATE ---
let currentStep = 1;
let selectedInstrument = null;
let selectedExperienceLevel = null; 
let selectedTrack = null;
let selectedBasis = null; // Tracks if user picked 'Notes' or 'Rhythms'
let selectedRhythmCategory = null; // Tracks which rhythm category (Imitation, Reading, Ear Training)

// Audio & Recording State
let isRecording = false;
let mediaRecorder;
let audioChunks = [];
let audioContext, analyser, dataArray, animationId; 

// MP3 Player State
let audioPlayer = new Audio();
let sourceNode = null; // Connects MP3 to Visualizer

// --- DATA ---
// Change your DATA to match Musicca's first lessons
const TRACK_DATA = {
    'Some': [ 
        { id: 1, name: 'Notes', description: 'Read C, D and E.', locked: false },
        { id: 2, name: 'Notes', description: 'Locate C, D and E.', locked: false },
        { id: 3, name: 'Notes', description: 'Read E, F and G.', locked: false }
    ],
    // ... other levels
};

const RHYTHM_CATEGORIES = {
    'Imitation': { emoji: '👏🏼', lessons: [
        { id: 101, name: 'Introduction', description: 'Introduction' },
        { id: 102, name: 'Whole and Half Notes', description: 'Whole and Half Notes' },
        { id: 103, name: 'Half and Quarter Notes', description: 'Half and Quarter Notes' }
    ]},
    'Reading': { emoji: '🎶', lessons: [
        { id: 104, name: 'Introduction', description: 'Introduction' },
        { id: 105, name: 'Whole and Half Notes', description: 'Whole and Half Notes' },
        { id: 106, name: 'Half and Quarter Notes', description: 'Half and Quarter Notes' }
    ]},
    'Ear Training': { emoji: '🔊', lessons: [
        { id: 107, name: 'Introduction', description: 'Introduction' },
        { id: 108, name: 'Whole and Half Notes', description: 'Whole and Half Notes' },
        { id: 109, name: 'Half and Quarter Notes', description: 'Half and Quarter Notes' }
    ]}
};

// --- STEP LOGIC ---
function changeStep(delta) {
    const nextStep = currentStep + delta;
    if (nextStep < 1 || nextStep > 7) return;

    // Stop music and visuals if moving away from practice
    if (currentStep === 6) {
        audioPlayer.pause();
        stopAllVisuals();
    }

    document.getElementById(`step${currentStep}`).classList.remove('active');
    currentStep = nextStep;
    document.getElementById(`step${currentStep}`).classList.add('active');

    if (currentStep === 6) startPractice();
    updateUI();
}

function reactTiger() {
    const sprite = document.getElementById('characterSprite');
    if (sprite) {
        sprite.classList.add('character-pounce');
        setTimeout(() => sprite.classList.remove('character-pounce'), 200);
    }
}

function updateUI() {
    const btnBack = document.getElementById('btnBack');
    const btnNext = document.getElementById('btnNext');
    const bubble = document.getElementById('speechBubble');
    const sprite = document.getElementById('characterSprite');
    const nav = document.querySelector('.navigation');

    // Navigation visibility: Hide bottom nav on Step 7 (Success) and steps 4-5-6 (have their own controls)
    if (currentStep >= 7 || currentStep === 4 || currentStep === 5 || currentStep === 6) {
        if (nav) nav.style.display = 'none';
    } else {
        if (nav) nav.style.display = 'flex';
    }

    btnBack.disabled = (currentStep === 1);
    
    // Step 1: Instrument Selection
    if (currentStep === 1) {
        bubble.innerText = selectedInstrument ? "That sounds powerful! Let's go!" : "Which instrument has the best roar?";
        sprite.innerText = "🐯";
        btnNext.disabled = !selectedInstrument;
        btnNext.innerText = "CONTINUE";
    } 
    // Step 2: Experience Level
    else if (currentStep === 2) {
        const instrumentNames = { 'piano': 'Piano', 'acoustic_guitar': 'Guitar' };
        const name = instrumentNames[selectedInstrument] || 'Music';
        const title = document.getElementById('experienceTitle');
        if (title) title.innerText = `How much ${name} do you know?`;
        bubble.innerText = selectedExperienceLevel ? "A fierce learner! I like it!" : "Show me your music stripes!";
        sprite.innerText = selectedExperienceLevel ? "🐅" : "🧐";
        btnNext.disabled = !selectedExperienceLevel;
        btnNext.innerText = "CONTINUE";
        
        // Show piano preview only if Piano is selected
        const pianoPreviewSection = document.getElementById('pianoPreviewSection');
        if (pianoPreviewSection) {
            if (selectedInstrument === 'piano') {
                pianoPreviewSection.style.display = 'block';
                generatePianoPreview();
            } else {
                pianoPreviewSection.style.display = 'none';
            }
        }
    }
    // Step 3: Course Info / Preview
    else if (currentStep === 3) {
        bubble.innerText = "Here is what we will learn together!";
        sprite.innerText = "🐾";
        btnNext.disabled = false;
        btnNext.innerText = "CONTINUE";
    }
    // STEP 4: BASIS (Notes vs Rhythms)
    else if (currentStep === 4) {
        bubble.innerText = selectedBasis ? `Ah, ${selectedBasis}! Great choice!` : "Do you want to start with Notes or Rhythms?";
        sprite.innerText = "🧐";
        btnNext.disabled = !selectedBasis;
        btnNext.innerText = "CONTINUE";
        // Show/hide the practice-controls NEXT button
        const nextBasisBtn = document.getElementById('nextBasisBtn');
        if (nextBasisBtn) {
            nextBasisBtn.style.display = selectedBasis ? 'block' : 'none';
        }
    }
    // Step 5: Lesson Selection Grid
    else if (currentStep === 5) {
        renderTracks();
        
        // Determine the appropriate message based on state
        let message = "Pick a tile to start your lesson!";
        if (selectedBasis === 'Rhythms' && !selectedRhythmCategory) {
            message = "Choose a rhythm category!";
        } else if (selectedTrack) {
            message = "Excellent choice! Ready to roar?";
        }
        
        bubble.innerText = message;
        sprite.innerText = "🐾";
        
        // Show/hide practice button based on track selection
        const practiceBtn = document.getElementById('practiceBtn');
        if (practiceBtn) {
            practiceBtn.style.display = selectedTrack ? 'block' : 'none';
        }
    }
    // Step 6: Practice Page
    else if (currentStep === 6) {
        bubble.innerText = "Time to unleash your inner artist!";
        sprite.innerText = "🐾";
    }
    // Step 7: Completion
    else if (currentStep === 7) {
        bubble.innerText = "You did it! You're amazing!";
        sprite.innerText = "🎉";
    }
}

// --- SELECTION FUNCTIONS ---
function selectInstrument(type, element) {
    selectedInstrument = type;
    selectedTrack = null; 
    document.body.setAttribute('data-instr-theme', type);
    document.querySelectorAll('.instrument-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    reactTiger();
    updateUI();
}

function generatePianoPreview() {
    const pianoContainer = document.getElementById('pianoPreviewKeyboard');
    if (!pianoContainer) return;
    
    pianoContainer.innerHTML = '';
    
    // Initialize audio context for preview
    if (!window.previewAudioContext) {
        window.previewAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Define white keys with frequencies and black keys
    const octaves = [3, 4, 5];
    const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const frequencies = {
        'C': [130.81, 261.63, 523.25],
        'D': [146.83, 293.66, 587.33],
        'E': [164.81, 329.63, 659.25],
        'F': [174.61, 349.23, 698.46],
        'G': [196.00, 392.00, 783.99],
        'A': [220.00, 440.00, 880.00],
        'B': [246.94, 493.88, 987.77]
    };
    
    const blackKeyFrequencies = {
        'C#': [138.59, 277.18, 554.37],
        'D#': [155.56, 311.13, 622.25],
        'F#': [184.99, 369.99, 739.99],
        'G#': [207.65, 415.30, 830.61],
        'A#': [233.08, 466.16, 932.33]
    };
    
    // Create keyboard with both white and black keys
    let keyboardHTML = '';
    
    // Start from C3 instead of A3 for proper layout
    for (let octaveIdx = 0; octaveIdx < 3; octaveIdx++) {
        for (let i = 0; i < whiteNotes.length; i++) {
            const noteName = whiteNotes[i];
            const freq = frequencies[noteName][octaveIdx];
            
            // Create white key
            const whiteKeyDiv = document.createElement('div');
            whiteKeyDiv.className = 'piano-preview-key white-key';
            whiteKeyDiv.innerText = `${noteName}`;
            whiteKeyDiv.style.cursor = 'pointer';
            whiteKeyDiv.onclick = () => playPreviewNote(freq);
            whiteKeyDiv.onmousedown = () => whiteKeyDiv.classList.add('active');
            whiteKeyDiv.onmouseup = () => whiteKeyDiv.classList.remove('active');
            whiteKeyDiv.onmouseleave = () => whiteKeyDiv.classList.remove('active');
            pianoContainer.appendChild(whiteKeyDiv);
            
            // Add black key after white key (except after B and E)
            if ((noteName !== 'B' && noteName !== 'E')) {
                const blackNoteName = noteName + '#';
                const blackFreq = blackKeyFrequencies[blackNoteName][octaveIdx];
                
                const blackKeyDiv = document.createElement('div');
                blackKeyDiv.className = 'piano-preview-key black-key';
                blackKeyDiv.innerText = `${blackNoteName}`;
                blackKeyDiv.style.cursor = 'pointer';
                blackKeyDiv.onclick = () => playPreviewNote(blackFreq);
                blackKeyDiv.onmousedown = () => blackKeyDiv.classList.add('active');
                blackKeyDiv.onmouseup = () => blackKeyDiv.classList.remove('active');
                blackKeyDiv.onmouseleave = () => blackKeyDiv.classList.remove('active');
                pianoContainer.appendChild(blackKeyDiv);
            }
        }
    }
}

function playPreviewNote(frequency) {
    const ctx = window.previewAudioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
}

function selectExperience(level, element) {
    selectedExperienceLevel = level;
    document.querySelectorAll('.exp-item').forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');
    reactTiger();
    updateUI();
}

function renderTracks() {
    const container = document.getElementById('trackGallery');
    if (!container) return;
    
    // If user selected Rhythms, show rhythm categories first
    if (selectedBasis === 'Rhythms') {
        if (!selectedRhythmCategory) {
            // Show rhythm categories: Imitation, Reading, Ear Training
            container.innerHTML = Object.entries(RHYTHM_CATEGORIES).map(([categoryName, categoryData]) => {
                return `
                    <div class="rhythm-category-card instrument-card" onclick="selectRhythmCategory('${categoryName}', this)">
                        <div class="instrument-icon">${categoryData.emoji}</div>
                        <div class="instrument-name">${categoryName}</div>
                    </div>
                `;
            }).join('');
        } else {
            // Show lessons for selected rhythm category
            const lessons = RHYTHM_CATEGORIES[selectedRhythmCategory]?.lessons || [];
            container.innerHTML = lessons.map(lesson => {
                return `
                    <div class="instrument-card ${selectedTrack?.id === lesson.id ? 'selected' : ''}" onclick="selectTrack(${lesson.id})">
                        <div class="instrument-icon">🎵</div>
                        <div class="instrument-name">${lesson.description}</div>
                    </div>
                `;
            }).join('');
        }
    } else {
        // Show Notes tracks as before
        const availableTracks = TRACK_DATA[selectedExperienceLevel] || [];
        
        container.innerHTML = availableTracks.map(track => {
            // Use musical score icon for "Read" lessons, book icon for others
            const icon = track.description.includes('Read') ? '🎼' : '🎼';
            return `
                <div class="instrument-card ${selectedTrack?.id === track.id ? 'selected' : ''}" onclick="selectTrack(${track.id})">
                    <div class="instrument-icon">${icon}</div>
                    <div class="instrument-name">${track.description}</div>
                </div>
            `;
        }).join('');
    }
}

function selectTrack(trackId) {
    // First check in TRACK_DATA
    let track = Object.values(TRACK_DATA).flat().find(t => t.id === trackId);
    
    // If not found, check in rhythm categories
    if (!track && selectedRhythmCategory) {
        const lessons = RHYTHM_CATEGORIES[selectedRhythmCategory]?.lessons || [];
        track = lessons.find(t => t.id === trackId);
    }
    
    selectedTrack = track;
    reactTiger();
    updateUI();
}

function startPracticeFromSelection() {
    // Go to practice page (step 6)
    changeStep(1);
}


// --- STEP 5: MP3 PRACTICE LOGIC ---
function startPractice() {
    const pngDisplay = document.getElementById('practiceSheet');
    const trackTitle = document.getElementById('currentTrackName');
    const playBtn = document.getElementById('playBtn');

    if (selectedTrack) {
        if (trackTitle) trackTitle.innerText = selectedTrack.name;
        if (pngDisplay) pngDisplay.src = selectedTrack.pngFile;

        // Set the MP3 source
        audioPlayer.src = selectedTrack.audioFile;
        
        // Add error handling to diagnose the "no supported sources" issue
        audioPlayer.onerror = function() {
            console.error("Error: Could not load the audio file at " + audioPlayer.src);
            if (playBtn) playBtn.innerText = "❌ LOAD ERROR";
        };

        audioPlayer.load();
        if (playBtn) playBtn.innerText = "▶ PRACTICE";
    }

    // Show piano for specific lessons
    showPianoForLesson();
}

function playAudio() {
    const playBtn = document.getElementById('playBtn');
    
    // Initialize AudioContext if it doesn't exist
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        sourceNode = audioContext.createMediaElementSource(audioPlayer);
        analyser = audioContext.createAnalyser();
        sourceNode.connect(analyser);
        analyser.connect(audioContext.destination);
    }

    if (audioPlayer.paused) {
        // Resume context to satisfy browser security policies
        audioContext.resume().then(() => {
            audioPlayer.play().catch(e => console.error("Playback failed:", e));
            playBtn.innerText = "⏸ PAUSE";
            drawWaveform();
        });
    } else {
        audioPlayer.pause();
        playBtn.innerText = "▶ PRACTICE";
        stopAllVisuals();
    }
}

// --- VISUALIZER LOGIC ---
function stopAllVisuals() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    const canvas = document.getElementById('visualizerCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawWaveform() {
    const canvas = document.getElementById('visualizerCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    animationId = requestAnimationFrame(drawWaveform);
    analyser.getByteFrequencyData(dataArray);
    
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `#58cc02`; 
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}

// --- RECORDING LOGIC ---
async function toggleRecording() {
    const btn = document.getElementById('btnRecord');
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!audioContext) audioContext = new AudioContext();
            
            const micSource = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            micSource.connect(analyser);
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = saveRecording;
            mediaRecorder.start();
            
            isRecording = true;
            btn.classList.add('recording');
            btn.innerHTML = '<span class="record-icon">⏹</span> STOP';
            drawWaveform(); 
        } catch (err) { alert("Mic required for recording."); }
    // ... inside toggleRecording() ...
    } else {
        if (mediaRecorder) mediaRecorder.stop();
        isRecording = false;
        btn.classList.remove('recording');
        btn.innerHTML = '<span class="record-icon">🎤</span> RECORD';
        
        // Explicitly stop the drawing loop and clear the bars
        stopAllVisuals(); 
    }
}

function selectBasis(type, element) {
    selectedBasis = type;
    selectedTrack = null; // Reset track selection if basis changes
    selectedRhythmCategory = null; // Reset rhythm category when changing basis
    
    // 1. Specifically target cards ONLY inside Step 4
    const step4Cards = document.querySelectorAll('#step4 .instrument-card');
    step4Cards.forEach(c => c.classList.remove('selected'));
    
    // 2. Add 'selected' ONLY to the clicked card
    element.classList.add('selected');
    
    reactTiger();
    updateUI();
}

function selectRhythmCategory(categoryName, element) {
    selectedRhythmCategory = categoryName;
    selectedTrack = null; // Reset track selection
    
    // Update selected styles
    const categoryCards = document.querySelectorAll('.rhythm-category-card');
    categoryCards.forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    
    reactTiger();
    renderTracks(); // Re-render to show lessons for selected category
}

function handleStep5Back() {
    // If user is viewing rhythm lessons, go back to rhythm categories
    if (selectedBasis === 'Rhythms' && selectedRhythmCategory) {
        selectedRhythmCategory = null;
        selectedTrack = null;
        renderTracks();
    } else {
        // Otherwise, go back to previous step
        changeStep(-1);
    }
}

function saveRecording() {
    const blob = new Blob(audioChunks, { type: 'audio/wav' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `practice_recording.wav`;
    link.click();
    
    // Analyze the recorded audio
    analyzeRecordedAudio(blob);
}

async function analyzeRecordedAudio(audioBlob) {
    try {
        // Create audio context and decode audio
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        // Analyze notes
        const detectedNotes = await audioAnalyzer.analyzeAudioBuffer(audioBuffer);
        
        // Compare with expected notes (triads)
        if (selectedTrack) {
            // Get expected triad for current track
            const triadInfo = getExpectedTriadForTrack(selectedTrack);
            if (triadInfo) {
                const comparison = audioAnalyzer.compareWithTriad(triadInfo.notes);
                displayAnalysisResults(comparison, triadInfo);
            } else {
                displayDetectedNotes(detectedNotes);
            }
        } else {
            displayDetectedNotes(detectedNotes);
        }
    } catch (error) {
        console.error('Error analyzing audio:', error);
        alert('Error analyzing audio. Please try again.');
    }
}

function getExpectedTriadForTrack(track) {
    // Get the expected triad based on the selected track
    // For rhythm tracks, we might not have triads
    if (track.id >= 101) { // Rhythm tracks
        return null;
    }
    
    // For now, return a default triad based on track
    // This would be expanded based on your actual lesson content
    return null;
}

function displayAnalysisResults(comparison, triadInfo) {
    const analysisDiv = document.getElementById('analysisResults') || createAnalysisResultsPanel();
    
    const html = `
        <div class="analysis-panel">
            <h3>Analysis Results</h3>
            <div class="expected-triad">
                <h4>Expected Chord: ${triadInfo.chord}</h4>
                <div class="triad-notes">${triadInfo.notes.join(' + ')}</div>
            </div>
            
            <div class="analysis-results">
                <div class="correct-notes">
                    <h5>✓ Correct Notes (${comparison.correct.length})</h5>
                    <div class="notes-list">
                        ${comparison.correct.map(n => `<span class="note correct">${n}</span>`).join('')}
                    </div>
                </div>
                
                <div class="missing-notes">
                    <h5>✗ Missing Notes (${comparison.missing.length})</h5>
                    <div class="notes-list">
                        ${comparison.missing.map(n => `<span class="note missing">${n}</span>`).join('')}
                    </div>
                </div>
                
                <div class="extra-notes">
                    <h5>⚠ Extra Notes (${comparison.extra.length})</h5>
                    <div class="notes-list">
                        ${comparison.extra.map(n => `<span class="note extra">${n}</span>`).join('')}
                    </div>
                </div>
            </div>
            
            <div class="accuracy-score">
                <h4>Accuracy: ${calculateAccuracy(comparison)}%</h4>
            </div>
        </div>
    `;
    
    analysisDiv.innerHTML = html;
    analysisDiv.style.display = 'block';
    
    // Highlight piano keys based on results
    highlightPianoKeysForAnalysis(comparison);
}

function highlightPianoKeysForAnalysis(comparison) {
    // Clear previous highlights
    const pianoKeys = document.querySelectorAll('.piano-key');
    pianoKeys.forEach(key => {
        key.classList.remove('analysis-correct', 'analysis-missing', 'analysis-extra');
    });
    
    // Highlight correct notes
    comparison.correct.forEach(note => {
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) key.classList.add('analysis-correct');
    });
    
    // Highlight missing notes
    comparison.missing.forEach(note => {
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) key.classList.add('analysis-missing');
    });
    
    // Highlight extra notes
    comparison.extra.forEach(note => {
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) key.classList.add('analysis-extra');
    });
}

function displayDetectedNotes(detectedNotes) {
    const analysisDiv = document.getElementById('analysisResults') || createAnalysisResultsPanel();
    
    const uniqueNotes = audioAnalyzer.getDetectedNotesList();
    
    const html = `
        <div class="analysis-panel">
            <h3>Detected Notes</h3>
            <div class="detected-notes-list">
                ${uniqueNotes.map(item => `
                    <div class="detected-note">
                        <span class="note-name">${item.note}</span>
                        <span class="confidence">${(item.confidence * 100).toFixed(0)}%</span>
                    </div>
                `).join('')}
            </div>
            ${uniqueNotes.length === 0 ? '<p class="no-notes">No notes detected. Please try again.</p>' : ''}
        </div>
    `;
    
    analysisDiv.innerHTML = html;
    analysisDiv.style.display = 'block';
}

function calculateAccuracy(comparison) {
    const total = comparison.correct.length + comparison.missing.length;
    if (total === 0) return 0;
    return Math.round((comparison.correct.length / total) * 100);
}

function createAnalysisResultsPanel() {
    const panel = document.createElement('div');
    panel.id = 'analysisResults';
    panel.className = 'analysis-results-panel';
    
    // Find the practice area and insert after it
    const practiceArea = document.querySelector('.practice-area');
    if (practiceArea) {
        practiceArea.parentNode.insertBefore(panel, practiceArea.nextSibling);
    }
    
    return panel;
}

// --- THEME TOGGLE WITH CIRCULAR ANIMATION ---
function toggleDarkMode() {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    const icon = document.getElementById('theme-icon');
    
    if (isDark) {
        root.removeAttribute('data-theme');
        if (icon) icon.innerText = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        root.setAttribute('data-theme', 'dark');
        if (icon) icon.innerText = '☀️';
        localStorage.setItem('theme', 'dark');
    }
    updateUI();
}

// --- PIANO SYSTEM ---
let pianoAudioContext = null;
let pianoMode = 'read'; // 'read' or 'locate'
const FULL_PIANO_NOTES = {
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00,
    'A3': 220.00, 'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63,
    'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25,
    'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00
};

const CORRECT_NOTES = ['C3', 'D3', 'E3', 'C4', 'D4', 'E4', 'C5', 'D5', 'E5'];
let correctNotesFound = new Set();
let pianoStats = {
    correctPresses: 0,
    incorrectPresses: 0
};
let keyPressCount = {
    'C3': 0, 'D3': 0, 'E3': 0, 'C4': 0, 'D4': 0, 'E4': 0, 'C5': 0, 'D5': 0, 'E5': 0
};

function initPiano() {
    const container = document.getElementById('pianoKeyboard');
    if (!container) return;
    
    // Reset stats when piano is initialized
    pianoStats = {
        correctPresses: 0,
        incorrectPresses: 0
    };
    keyPressCount = {
        'C3': 0, 'D3': 0, 'E3': 0, 'C4': 0, 'D4': 0, 'E4': 0, 'C5': 0, 'D5': 0, 'E5': 0
    };
    
    container.innerHTML = '';
    correctNotesFound.clear();
    
    // Create all piano keys
    Object.keys(FULL_PIANO_NOTES).forEach(noteKey => {
        const key = document.createElement('div');
        key.className = 'piano-key';
        key.dataset.note = noteKey;
        
        // Highlight target keys (C, D, E) only in read mode
        const noteName = noteKey.charAt(0); // Get just C, D, E
        if (pianoMode === 'read' && ['C', 'D', 'E'].includes(noteName)) {
            key.classList.add('target');
        }
        
        const keyLabel = noteName;
        const keyOctave = noteKey.charAt(1);
        
        // In 'locate' mode, hide all note names for all keys
        let keyHTML;
        if (pianoMode === 'locate') {
            keyHTML = `
                <div class="piano-key-note" style="opacity: 0;"></div>
                <div class="piano-key-label" style="opacity: 0;"></div>
            `;
        } else {
            keyHTML = `
                <div class="piano-key-note">${keyLabel}</div>
                <div class="piano-key-label">${keyOctave}</div>
            `;
        }
        
        key.innerHTML = keyHTML;
        
        key.addEventListener('mousedown', (e) => { e.preventDefault(); playPianoNote(noteKey, key); });
        key.addEventListener('mouseup', (e) => { e.preventDefault(); stopPianoNote(key); });
        key.addEventListener('mouseleave', () => stopPianoNote(key));
        key.addEventListener('touchstart', (e) => { e.preventDefault(); playPianoNote(noteKey, key); });
        key.addEventListener('touchend', (e) => { e.preventDefault(); stopPianoNote(key); });
        
        container.appendChild(key);
    });

    // Keyboard shortcuts - map C, D, E keys to multiple octaves
    document.addEventListener('keydown', (e) => {
        const key = e.key.toUpperCase();
        if (['C', 'D', 'E'].includes(key)) {
            // Find the first matching key in current octave (C4, D4, E4)
            const noteKey = key + '4';
            const keyElement = document.querySelector(`[data-note="${noteKey}"]`);
            if (keyElement && !keyElement.classList.contains('active')) {
                playPianoNote(noteKey, keyElement);
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        const key = e.key.toUpperCase();
        if (['C', 'D', 'E'].includes(key)) {
            const noteKey = key + '4';
            const keyElement = document.querySelector(`[data-note="${noteKey}"]`);
            if (keyElement) {
                stopPianoNote(keyElement);
            }
        }
    });
    
    // Update the display to show reset stats
    updatePianoStats();
}

let currentOscillator = null;
let currentGain = null;

function playPianoNote(noteKey, keyElement) {
    // Stop any currently playing note
    if (currentOscillator) {
        currentOscillator.stop();
        currentGain.gain.setValueAtTime(0, pianoAudioContext.currentTime);
    }

    // Initialize AudioContext if needed
    if (!pianoAudioContext) {
        pianoAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Resume audio context if suspended
    if (pianoAudioContext.state === 'suspended') {
        pianoAudioContext.resume();
    }

    const frequency = FULL_PIANO_NOTES[noteKey];
    const now = pianoAudioContext.currentTime;

    // Create oscillator
    currentOscillator = pianoAudioContext.createOscillator();
    currentOscillator.type = 'sine';
    currentOscillator.frequency.setValueAtTime(frequency, now);

    // Create gain node for smooth fade in/out
    currentGain = pianoAudioContext.createGain();
    currentGain.gain.setValueAtTime(0, now);
    currentGain.gain.linearRampToValueAtTime(0.3, now + 0.05);

    // Connect and start
    currentOscillator.connect(currentGain);
    currentGain.connect(pianoAudioContext.destination);
    currentOscillator.start(now);

    // Visual feedback
    keyElement.classList.add('active');

    // Check if correct or incorrect
    const noteName = noteKey.charAt(0);
    const isCorrect = ['C', 'D', 'E'].includes(noteName);
    
    showPianoFeedback(keyElement, noteKey, isCorrect);
}

function stopPianoNote(keyElement) {
    if (currentOscillator && currentGain) {
        const now = pianoAudioContext.currentTime;
        currentGain.gain.linearRampToValueAtTime(0, now + 0.1);
        currentOscillator.stop(now + 0.1);
        currentOscillator = null;
        currentGain = null;
    }

    keyElement.classList.remove('active');
}

function showPianoFeedback(keyElement, noteKey, isCorrect) {
    const feedbackElement = document.getElementById('pianoFeedback');
    const noteName = noteKey.charAt(0);
    const octave = noteKey.charAt(1);
    
    if (isCorrect) {
        // Both read and locate modes work the same - count immediately
        feedbackElement.textContent = `✓ Correct! You found ${noteName} in octave ${octave}!`;
        feedbackElement.className = 'piano-feedback correct';
        keyElement.classList.remove('incorrect');
        keyElement.classList.add('correct');
        
        // Track correct notes found
        correctNotesFound.add(noteKey);
        pianoStats.correctPresses++;
        updatePianoStats();
        
        // Remove feedback after 2 seconds
        setTimeout(() => {
            feedbackElement.className = 'piano-feedback empty';
            feedbackElement.textContent = '';
        }, 2000);
    } else {
        feedbackElement.textContent = `✗ Wrong! Try C, D, or E`;
        feedbackElement.className = 'piano-feedback incorrect';
        keyElement.classList.remove('correct');
        keyElement.classList.add('incorrect');
        
        // Track incorrect presses
        pianoStats.incorrectPresses++;
        updatePianoStats();
        
        // Remove feedback after 1.5 seconds
        setTimeout(() => {
            feedbackElement.className = 'piano-feedback empty';
            feedbackElement.textContent = '';
            keyElement.classList.remove('incorrect');
        }, 1500);
    }
}

function showPianoForLesson() {
    const pianoContainer = document.getElementById('pianoContainer');
    const sheetContainer = document.getElementById('sheetContainer');
    const playBtn = document.getElementById('playBtn');
    const backBtn = document.getElementById('backBtn');
    const continueBtn = document.getElementById('continueBtn');
    const pianoInstructions = document.getElementById('pianoInstructions');

    // Check if this lesson requires piano (C, D, E lessons)
    if (selectedTrack && (selectedTrack.description.includes('C, D') || selectedTrack.description.includes('C, D and E') || 
                          selectedTrack.description.includes('Locate C, D') || selectedTrack.description.includes('Locate C, D and E') ||
                          selectedTrack.description.includes('Read E, F') || selectedTrack.description.includes('Read E, F and G'))) {
        pianoContainer.style.display = 'block';
        sheetContainer.style.display = 'none';
        playBtn.style.display = 'none';
        backBtn.style.display = 'block';
        
        // Reset all stats before initializing piano
        pianoStats = {
            correctPresses: 0,
            incorrectPresses: 0
        };
        keyPressCount = {
            'C3': 0, 'D3': 0, 'E3': 0, 'C4': 0, 'D4': 0, 'E4': 0, 'C5': 0, 'D5': 0, 'E5': 0
        };
        correctNotesFound.clear();
        
        // Determine if this is a read, locate, or practice lesson
        if (selectedTrack.description.includes('Locate')) {
            pianoMode = 'locate';
            pianoInstructions.textContent = 'Click the keys below or use your keyboard to find C, D, and E';
            continueBtn.style.display = 'none';
        } else if (selectedTrack.description.includes('Read')) {
            pianoMode = 'read';
            pianoInstructions.textContent = 'Click the keys below or use your keyboard to read and play the notes';
            continueBtn.style.display = 'block';
            continueBtn.textContent = 'CONTINUE';
        } else {
            pianoMode = 'read';
            pianoInstructions.textContent = 'Click the keys below or use your keyboard to find C, D, and E';
            continueBtn.style.display = 'none';
        }
        
        initPiano();
    }
}

function continueToPractice() {
    // If coming from Read C, D and E, go to Locate C, D and E
    if (selectedTrack && selectedTrack.description.includes('Read C, D')) {
        const availableTracks = TRACK_DATA[selectedExperienceLevel] || [];
        const locateTrack = availableTracks.find(t => t.description.includes('Locate C, D'));
        
        if (locateTrack) {
            selectedTrack = locateTrack;
            startPractice();
        }
    }
}
        if (continueBtn) continueBtn.style.display = 'none';
    

function updatePianoStats() {
    const totalPresses = pianoStats.correctPresses + pianoStats.incorrectPresses;
    
    // Calculate score out of 50 based on unique keys found
    const uniqueKeysFound = correctNotesFound.size;
    const score = Math.round((uniqueKeysFound / 9) * 50);
    const maxScore = 50;
    
    // Calculate accuracy percentage
    const accuracy = totalPresses > 0 ? Math.round((pianoStats.correctPresses / totalPresses) * 100) : 0;
    
    // Update display
    const scoreValue = document.getElementById('scoreValue');
    const accuracyValue = document.getElementById('accuracyValue');
    
    if (scoreValue) scoreValue.textContent = `${score}`;
    if (accuracyValue) accuracyValue.textContent = `${accuracy} %`;
}

function goToNextLesson() {
    // Move to next track
    const availableTracks = TRACK_DATA[selectedExperienceLevel] || [];
    const currentTrackIndex = availableTracks.findIndex(t => t.id === selectedTrack.id);
    
    if (currentTrackIndex < availableTracks.length - 1) {
        selectTrack(availableTracks[currentTrackIndex + 1].id);
        changeStep(0); // Stay on same step but reinitialize
        startPractice();
    } else {
        // If last lesson, go to completion page
        changeStep(1);
    }
}



function openAnalyzerModal() {
    window.location.href = './analyze.html';
}



// Initialize audio analyzer on page load
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load triads data
        await audioAnalyzer.loadTriads('./New folder/triads.csv');
        console.log('Audio analyzer initialized successfully');
    } catch (error) {
        console.log('Audio analyzer setup: ', error);
    }
});