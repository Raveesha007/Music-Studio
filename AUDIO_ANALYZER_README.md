# Audio Analyzer - Note Detection & Comparison System

## Overview
The Audio Analyzer is an AI-powered system that:
1. **Records user audio input** from the microphone
2. **Detects musical notes** using autocorrelation pitch detection
3. **Compares detected notes** with expected triads from the CSV database
4. **Displays analysis results** with visual feedback on correct, missing, and extra notes

## Architecture

### 1. **audioAnalyzer.js** - Core Audio Processing
Main features:
- **Frequency-to-Note Mapping**: Maps frequencies (Hz) to musical notes (C_0 to B_8)
- **Pitch Detection**: Uses autocorrelation algorithm for accurate note detection
- **Triad Loading**: Loads chord definitions from triads.csv
- **Audio Analysis**: Processes recorded audio in time windows
- **Comparison Logic**: Compares detected notes with expected notes

#### Key Classes & Methods:

**AudioAnalyzer Class**
```javascript
new AudioAnalyzer()
```

Methods:
- `loadTriads(csvPath)` - Loads chord definitions from CSV file
- `analyzeAudioBuffer(audioBuffer)` - Analyzes a recorded audio buffer
- `detectFrequency(audioData, sampleRate)` - Detects dominant frequency
- `frequencyToNote(frequency)` - Converts frequency to note name
- `compareWithTriad(expectedNotes)` - Compares detected vs expected notes
- `getDetectedNotesList()` - Returns unique detected notes
- `clearDetectedNotes()` - Resets detected notes array

### 2. **script.js** - Integration & UI
Functions added:
- `analyzeRecordedAudio(audioBlob)` - Main entry point after recording
- `displayAnalysisResults(comparison, triadInfo)` - Shows comparison results
- `displayDetectedNotes(detectedNotes)` - Shows detected notes
- `highlightPianoKeysForAnalysis(comparison)` - Highlights piano keys
- `calculateAccuracy(comparison)` - Calculates accuracy percentage
- `createAnalysisResultsPanel()` - Creates results display panel

### 3. **audioAnalysisStyles.css** - Visual Styling
Styles for:
- Analysis results panel
- Note badges (correct, missing, extra)
- Piano key highlights
- Accuracy score display

## How It Works

### Step 1: Audio Recording
User clicks the RECORD button which:
1. Requests microphone access
2. Records audio data
3. On stop, saves audio and triggers analysis

### Step 2: Note Detection
The analyzer:
1. Converts recorded audio blob to AudioBuffer
2. Processes audio in 4096-sample windows (hop size 2048)
3. Applies Hann windowing function
4. Uses autocorrelation to detect pitch in each window
5. Converts frequencies to note names
6. Filters results by confidence score (>0.5)

### Step 3: Comparison
For triad-based lessons:
1. Loads expected chord notes from CSV
2. Compares detected notes with expected
3. Categorizes as:
   - **Correct**: Found and expected
   - **Missing**: Expected but not found
   - **Extra**: Detected but not expected

### Step 4: Visual Feedback
Results displayed as:
- **Analysis Panel**: Shows correct, missing, and extra notes
- **Piano Highlights**: 
  - Green for correct notes
  - Red for missing notes
  - Yellow for extra notes
- **Accuracy Score**: Percentage of correct notes found

## Data Structure

### triads.csv Format
```csv
Chord,Note1,Note2,Note3
C_maj_4_0,C_4,E_4,G_4
D_maj_4_0,D_4,Fs_4,A_4
```

### Detected Notes Array
```javascript
[
  { note: "C_4", frequency: 261.63, confidence: 0.95, timestamp: 0.5 },
  { note: "E_4", frequency: 329.63, confidence: 0.92, timestamp: 1.0 }
]
```

### Comparison Result
```javascript
{
  correct: ["C_4", "E_4"],
  missing: ["G_4"],
  extra: [],
  accuracy: 66%
}
```

## Pitch Detection Algorithm

### Autocorrelation Method
1. **RMS Check**: Ensures sufficient signal energy
2. **Autocorrelation**: Finds correlation peaks at different lags
3. **Parabolic Interpolation**: Refines frequency estimate
4. **Confidence Scoring**: Rates reliability of detection

### Advantages
- More robust than simple FFT
- Handles harmonics better
- Works well with monophonic sources (single note at a time)
- Reduces octave errors

## Configuration

### Frequency Tolerance
Currently set to **50 Hz** (in `frequencyToNote` method)
- Can be adjusted for stricter/looser matching

### Confidence Threshold
Currently set to **0.5** (in `analyzeAudioBuffer` method)
- Only notes with 50%+ confidence are included
- Can be adjusted for quality vs sensitivity

### Window Settings
- **Window Size**: 4096 samples
- **Hop Size**: 2048 samples
- **Window Function**: Hann

## Usage in Practice

### For Note Reading Lessons (C, D, E)
1. User listens to correct notes
2. Clicks RECORD
3. Plays the notes on piano or instrument
4. Clicks STOP
5. System analyzes and shows:
   - Which notes were played correctly
   - Which expected notes were missed
   - Any extra notes played
   - Overall accuracy score

### For Rhythm/Triad Lessons
1. User hears example of chord
2. Records their playing
3. System compares detected notes with expected chord
4. Provides visual feedback on piano keyboard

## Error Handling

- **No Signal Detected**: Message "No notes detected"
- **Invalid Frequency**: Filtered out if confidence < 0.5
- **Audio Decoding Error**: Alert shown to user
- **Missing Triads Data**: Gracefully falls back to note detection only

## Browser Requirements
- Web Audio API support
- getUserMedia for microphone access
- Modern browser (Chrome, Firefox, Safari, Edge)

## Future Enhancements
1. **Polyphonic Detection**: Support multiple simultaneous notes
2. **Vibrato Handling**: Better detection of vibrato
3. **Real-time Feedback**: Live analysis while recording
4. **Note Duration**: Track length of each note
5. **Harmony Detection**: Identify chord quality
6. **Machine Learning**: Train on user recordings for personalized feedback

## Troubleshooting

### No notes detected
- Check microphone works
- Increase confidence threshold
- Play notes more clearly
- Ensure sufficient volume

### Wrong notes detected
- Reduce frequency tolerance
- Check audio quality
- Avoid background noise
- Play one note at a time

### CSV not loading
- Check file path is correct
- Ensure CORS headers allow loading
- Check file format is valid CSV
