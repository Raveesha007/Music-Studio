# 🎵 Piano Learning Web Application

An interactive web-based piano learning application that uses **audio signal processing** and **AI-powered pitch detection** to help users learn piano notes, improve reading skills, and practice musical accuracy.

## 📋 Features

### Core Learning Modes
- **📖 Read Mode** - Learn to read and identify piano notes visually
- **🔍 Locate Mode** - Find and play specific notes on the piano keyboard
- **🎤 Analyze Mode** - Record audio and analyze detected notes in real-time

### Audio Analysis Features
- 🎵 **Real-time Audio Visualization** - Live frequency spectrum display while recording
- 🤖 **Autocorrelation Pitch Detection** - AI algorithm for accurate note recognition
- 📊 **Beautiful Graph Visualization** - Detected notes displayed with confidence percentages
- 🎼 **7-Note Challenge** - Random note generation with one-by-one validation
- ✓/✗ **Progress Tracking** - Visual feedback (✓ green checkmark, ✗ red X) for each note

### User Experience
- 🎹 Interactive piano keyboard with mouse and keyboard input
- 🎯 Lesson progression system (Read → Locate)
- 📱 Responsive design with Arial font throughout
- 🎨 Beautiful UI with gradient buttons and smooth animations

## 🏗️ Architecture

```
Frontend (HTML/CSS) → Application Logic (JS) → Audio Processing → Web Audio API
      ↓                      ↓                          ↓               ↓
  UI Components      Lesson Management       Autocorrelation      Microphone/Recording
  Piano Keyboard     Practice Modes          Pitch Detection       Frequency Analysis
  Visualizers        Navigation              Note Mapping          Canvas Drawing
```

## 🛠️ Technologies Used

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Responsive styling with Arial font family
- **Vanilla JavaScript** - Pure JS, no frameworks

### Audio Processing (AI/DSP)
- **Web Audio API** - Audio context, analyser nodes, frequency analysis
- **Autocorrelation Algorithm** ⭐ - Pitch detection with high accuracy
- **MediaRecorder API** - Audio recording from microphone
- **FFT (Fast Fourier Transform)** - Frequency spectrum analysis
- **Hann Window Function** - Signal processing windowing

### Data
- **CSV** - Chord definitions (triads.csv)
- **MIDI** - Piano reference files

## 📁 Project Structure

```
Project/
├── Instrument.html          # Main application page
├── analyze.html             # Audio analysis & challenge page
├── script.js               # Application logic & lesson management
├── audioAnalyzer.js        # Core audio engine (AI pitch detection)
├── style.css               # Global styling
├── audioAnalysisStyles.css # Audio analysis page styling
├── New folder/
│   ├── triads.csv         # Chord definitions
│   └── piano_triads/      # Chord audio files
├── Piano/
│   ├── combined.mid       # Full piano piece
│   ├── combined_slow.mid  # Slower version
│   └── split_midi/        # Individual note files
└── README.md              # This file
```

## 🚀 How to Run

### Option 1: Direct (Simplest)
```bash
# Just open in your browser
Double-click Instrument.html
```

### Option 2: Local Server (Recommended)
```bash
# Using Python 3
python -m http.server 8000

# Then open: http://localhost:8000/Instrument.html
```

Or with Node.js:
```bash
npx http-server
```

## 📖 How to Use

### Learning Flow
1. **Select Experience Level** - Choose Beginner, Intermediate, or Advanced
2. **Choose Lesson** - Pick a lesson (Read C,D,E or Locate C,D,E, etc.)
3. **Practice Mode** - Interact with the piano keyboard
4. **Analyze Audio** - Click "Analyze Audio" to record and detect notes
5. **Challenge Mode** - Take the 7-note challenge to validate learning

### Challenge Mode
1. Record your audio
2. Click "Start Note Challenge"
3. See the 7 target notes on the sheet
4. Click "Start Playing" for each note
5. Play/sing the note
6. Get ✓ (correct) or ✗ (wrong) feedback
7. Progress through all 7 notes

## 🎯 Key Algorithms

### Autocorrelation Pitch Detection
```
1. Record audio buffer (4096 samples, hop 2048)
2. Apply Hann window function for smoothing
3. Calculate autocorrelation to find fundamental frequency
4. Use parabolic interpolation for fine-tuning
5. Map frequency to nearest musical note
6. Filter by confidence threshold (0.8)
```

**Advantages over FFT:**
- More accurate fundamental frequency detection
- Better handling of harmonics
- Human voice/instrument optimized

### Note Mapping
- **12 notes per octave** (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
- **Octave range**: 0-8 (frequencies 16.35Hz to 7902Hz)
- **Frequency-to-Note mapping** with precision matching

## 🎨 UI Components

- **Canvas Visualizer** - Real-time frequency spectrum (180px, 256 FFT bins)
- **Bar Graph** - Detected notes with confidence % (280px height, gradient colors)
- **Progress Indicators** - Challenge mode with ✓/✗/○ states
- **Piano Keyboard** - Interactive note playing (mouse/keyboard)
- **Sheet Display** - 7-note visual representation

## 🔐 Features Breakdown

| Feature | Technology | Purpose |
|---------|-----------|---------|
| Audio Recording | MediaRecorder API | Capture microphone input |
| Pitch Detection | Autocorrelation Algorithm | Identify musical notes |
| Frequency Analysis | Web Audio API Analyser | Real-time spectrum |
| Visualization | HTML5 Canvas | Display graphs & animations |
| Note Mapping | Frequency Lookup Table | F → Note conversion |
| Piano Input | Event Listeners | Keyboard & mouse input |
| Progress Tracking | DOM Manipulation | UI state management |

## 📊 Performance Metrics

- **Confidence Threshold**: 0.8 (high accuracy, reduces false positives)
- **Analysis Window**: 4096 samples (93ms at 44.1kHz)
- **Hop Size**: 2048 samples (overlap processing)
- **Frequency Range**: 50Hz - 22kHz
- **Note Detection Accuracy**: ±50Hz tolerance

## 🧠 Learning Outcomes

Users can:
- ✓ Read and identify musical notes
- ✓ Locate notes on a piano keyboard
- ✓ Sing/play notes with pitch accuracy
- ✓ Receive real-time audio feedback
- ✓ Validate learning with challenges

## 🎓 Use Cases

- 🏫 Music education and practice
- 🎹 Piano lesson supplement
- 🎤 Voice training
- 🎵 Music theory learning
- 🎯 Ear training exercises

## 💡 Technical Highlights

### AI/ML Aspect
- **Autocorrelation algorithm** for robust pitch detection
- Confidence scoring system
- Harmonic filtering
- RMS-based noise detection

### Signal Processing
- Hann windowing
- Parabolic interpolation
- FFT-based frequency analysis
- Overlapping window processing

### Web Technologies
- HTML5 Canvas for real-time visualization
- Web Audio API for audio processing
- MediaRecorder for recording
- Responsive event-driven architecture

## 🔄 Data Flow

```
User Records Audio
        ↓
AudioBuffer Created
        ↓
Autocorrelation Analysis
        ↓
Frequency Detection
        ↓
Frequency → Note Mapping
        ↓
Confidence Filtering
        ↓
Display Results (Graph + List)
        ↓
Challenge Validation
        ↓
Progress Feedback (✓/✗)
```

## 📱 Browser Support

- Chrome/Chromium (Recommended)
- Firefox
- Safari
- Edge

**Requirements:**
- Microphone permission
- Web Audio API support
- HTML5 Canvas support

## 🤝 Contributing

Feel free to fork, improve, and submit pull requests!

Possible enhancements:
- Add more lessons and octave ranges
- Implement MIDI output
- Add difficulty levels
- Leaderboard system
- Mobile app version

## 📝 License

This project is open source and available for educational purposes.

## 👨‍💻 Author

Created as a comprehensive music education platform with AI-powered audio analysis.

---

**Good luck with your viva! 🎓🎵**

For questions or issues, check the code comments in:
- `audioAnalyzer.js` - Audio processing logic
- `script.js` - Application flow
- `analyze.html` - Challenge implementation
