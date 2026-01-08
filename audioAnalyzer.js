/**
 * Audio Analyzer - Detects notes from audio and compares with expected triads
 */

// Frequency to note mapping
const FREQUENCY_TO_NOTE = {
    16.35: 'C_0', 17.32: 'Cs_0', 18.35: 'D_0', 19.45: 'Eb_0', 20.60: 'E_0', 21.83: 'F_0', 23.12: 'Fs_0', 24.50: 'G_0', 25.96: 'Gs_0', 27.50: 'A_0', 29.14: 'Bb_0', 30.87: 'B_0',
    32.70: 'C_1', 34.65: 'Cs_1', 36.71: 'D_1', 38.89: 'Eb_1', 41.20: 'E_1', 43.65: 'F_1', 46.25: 'Fs_1', 49.00: 'G_1', 51.91: 'Gs_1', 55.00: 'A_1', 58.27: 'Bb_1', 61.74: 'B_1',
    65.41: 'C_2', 69.30: 'Cs_2', 73.42: 'D_2', 77.78: 'Eb_2', 82.41: 'E_2', 87.31: 'F_2', 92.50: 'Fs_2', 98.00: 'G_2', 103.83: 'Gs_2', 110.00: 'A_2', 116.54: 'Bb_2', 123.47: 'B_2',
    130.81: 'C_3', 138.59: 'Cs_3', 146.83: 'D_3', 155.56: 'Eb_3', 164.81: 'E_3', 174.61: 'F_3', 185.00: 'Fs_3', 196.00: 'G_3', 207.65: 'Gs_3', 220.00: 'A_3', 233.08: 'Bb_3', 246.94: 'B_3',
    261.63: 'C_4', 277.18: 'Cs_4', 293.66: 'D_4', 311.13: 'Eb_4', 329.63: 'E_4', 349.23: 'F_4', 369.99: 'Fs_4', 392.00: 'G_4', 415.30: 'Gs_4', 440.00: 'A_4', 466.16: 'Bb_4', 493.88: 'B_4',
    523.25: 'C_5', 554.37: 'Cs_5', 587.33: 'D_5', 622.25: 'Eb_5', 659.25: 'E_5', 698.46: 'F_5', 739.99: 'Fs_5', 783.99: 'G_5', 830.61: 'Gs_5', 880.00: 'A_5', 932.33: 'Bb_5', 987.77: 'B_5',
    1046.50: 'C_6', 1108.73: 'Cs_6', 1174.66: 'D_6', 1244.51: 'Eb_6', 1318.51: 'E_6', 1396.91: 'F_6', 1479.98: 'Fs_6', 1567.98: 'G_6', 1661.22: 'Gs_6', 1760.00: 'A_6', 1864.66: 'Bb_6', 1975.53: 'B_6',
    2093.00: 'C_7', 2217.46: 'Cs_7', 2349.32: 'D_7', 2489.02: 'Eb_7', 2637.02: 'E_7', 2793.83: 'F_7', 2959.96: 'Fs_7', 3135.96: 'G_7', 3322.44: 'Gs_7', 3520.00: 'A_7', 3729.31: 'Bb_7', 3951.07: 'B_7',
    4186.01: 'C_8', 4434.92: 'Cs_8', 4698.63: 'D_8', 4978.03: 'Eb_8', 5274.04: 'E_8', 5587.65: 'F_8', 5919.91: 'Fs_8', 6271.93: 'G_8', 6644.88: 'Gs_8', 7040.00: 'A_8', 7458.62: 'Bb_8', 7902.13: 'B_8'
};

// Note to frequency mapping (reverse)
const NOTE_TO_FREQUENCY = {};
Object.entries(FREQUENCY_TO_NOTE).forEach(([freq, note]) => {
    NOTE_TO_FREQUENCY[note] = parseFloat(freq);
});

class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.detectedNotes = []; // Array of detected notes from audio
        this.triadsData = {}; // Loaded triads data
    }

    /**
     * Load triads from CSV file
     */
    async loadTriads(csvPath = './New folder/triads.csv') {
        try {
            const response = await fetch(csvPath);
            const csvText = await response.text();
            const lines = csvText.trim().split('\n');
            
            // Parse CSV
            lines.forEach((line, index) => {
                if (index === 0) return; // Skip header
                
                const [chord, note1, note2, note3] = line.split(',');
                this.triadsData[chord] = {
                    chord: chord,
                    notes: [note1.trim(), note2.trim(), note3.trim()]
                };
            });
            
            console.log('Triads loaded:', Object.keys(this.triadsData).length);
            return this.triadsData;
        } catch (error) {
            console.error('Error loading triads:', error);
            return null;
        }
    }

    /**
     * Detect dominant frequency using autocorrelation (more accurate than FFT)
     */
    detectFrequency(audioData, sampleRate) {
        // Simple autocorrelation method for pitch detection
        const autocorrelation = this.getAutocorrelation(audioData, sampleRate);
        if (!autocorrelation || autocorrelation.frequency === 0) return null;
        return autocorrelation;
    }

    /**
     * Autocorrelation pitch detection
     */
    getAutocorrelation(buffer, sampleRate) {
        // Find the first peak in autocorrelation (fundamental frequency)
        const SIZE = buffer.length;
        const MAX_SAMPLES = Math.floor(sampleRate / 50); // 50 Hz minimum
        let best_offset = -1;
        let best_correlation = 0;
        let rms = 0;

        // Calculate RMS (root mean square) to check if signal has enough energy
        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);

        // Not enough signal
        if (rms < 0.01) return null;

        // Find autocorrelation
        let lastCorrelation = 1;
        for (let offset = 0; offset < MAX_SAMPLES; offset++) {
            let correlation = 0;
            for (let i = 0; i < MAX_SAMPLES; i++) {
                correlation += Math.abs((buffer[i]) - (buffer[i + offset]));
            }
            correlation = 1 - (correlation / MAX_SAMPLES);
            if (correlation > 0.9 && correlation > lastCorrelation) {
                let foundGoodCorrelation = false;
                if (correlation > best_correlation) {
                    best_correlation = correlation;
                    best_offset = offset;
                    foundGoodCorrelation = true;
                }
                if (foundGoodCorrelation) {
                    const shift = this.parabolicInterpolation(buffer, best_offset, sampleRate);
                    return {
                        frequency: shift,
                        confidence: best_correlation
                    };
                }
            }
            lastCorrelation = correlation;
        }

        if (best_correlation > 0.01) {
            const shift = this.parabolicInterpolation(buffer, best_offset, sampleRate);
            return {
                frequency: shift,
                confidence: best_correlation
            };
        }
        return null;
    }

    /**
     * Parabolic interpolation for finer frequency estimation
     */
    parabolicInterpolation(buffer, tau, sampleRate) {
        const a_x = tau < 1 ? buffer.length - 2 : tau - 1;
        const a = buffer[a_x];
        const b = buffer[tau];
        const c = tau < buffer.length - 1 ? buffer[tau + 1] : 0;

        const a2 = a * a, b2 = b * b, c2 = c * c;
        return sampleRate / (2 * tau + (a2 - c2) / (2 * (2 * b - a - c)));
    }

    /**
     * Convert frequency to nearest note
     */
    frequencyToNote(frequency) {
        if (!frequency || frequency < 16) return null;

        let closestNote = null;
        let minDifference = Infinity;

        Object.entries(FREQUENCY_TO_NOTE).forEach(([freq, note]) => {
            const difference = Math.abs(parseFloat(freq) - frequency);
            if (difference < minDifference && difference < 50) { // Within 50 Hz tolerance
                minDifference = difference;
                closestNote = note;
            }
        });

        return closestNote;
    }

    /**
     * Analyze recorded audio and detect notes
     */
    async analyzeAudioBuffer(audioBuffer) {
        this.detectedNotes = [];
        const sampleRate = audioBuffer.sampleRate;
        const channelData = audioBuffer.getChannelData(0);

        // Process audio in chunks (windows)
        const windowSize = 4096;
        const hopSize = 2048;

        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            // Apply Hann window
            const window = this.hannWindow(windowSize);
            const frameData = new Float32Array(windowSize);

            for (let j = 0; j < windowSize; j++) {
                frameData[j] = channelData[i + j] * window[j];
            }

            // Detect frequency
            const result = this.detectFrequency(frameData, sampleRate);
            if (result && result.confidence > 0.8) {
                const note = this.frequencyToNote(result.frequency);
                if (note) {
                    this.detectedNotes.push({
                        note: note,
                        frequency: result.frequency,
                        confidence: result.confidence,
                        timestamp: i / sampleRate
                    });
                }
            }
        }

        return this.detectedNotes;
    }

    /**
     * Hann window function
     */
    hannWindow(length) {
        const window = new Float32Array(length);
        for (let i = 0; i < length; i++) {
            window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (length - 1)));
        }
        return window;
    }

    /**
     * Compare detected notes with expected triad notes
     */
    compareWithTriad(expectedTriadNotes, tolerance = 0.5) {
        if (!this.detectedNotes || this.detectedNotes.length === 0) {
            return { correct: [], wrong: [], missing: expectedTriadNotes };
        }

        const result = {
            correct: [],
            wrong: [],
            missing: [],
            extra: []
        };

        // Get unique detected notes
        const detectedNotesSet = new Set(this.detectedNotes.map(n => n.note));

        // Check which expected notes were found
        expectedTriadNotes.forEach(expectedNote => {
            if (detectedNotesSet.has(expectedNote)) {
                result.correct.push(expectedNote);
            } else {
                result.missing.push(expectedNote);
            }
        });

        // Find extra notes that shouldn't be there
        detectedNotesSet.forEach(detectedNote => {
            if (!expectedTriadNotes.includes(detectedNote)) {
                result.extra.push(detectedNote);
            }
        });

        return result;
    }

    /**
     * Get all detected notes unique list
     */
    getDetectedNotesList() {
        const unique = new Map();
        this.detectedNotes.forEach(item => {
            if (!unique.has(item.note) || item.confidence > unique.get(item.note).confidence) {
                unique.set(item.note, item);
            }
        });
        return Array.from(unique.values());
    }

    /**
     * Clear detected notes
     */
    clearDetectedNotes() {
        this.detectedNotes = [];
    }
}

// Global analyzer instance
const audioAnalyzer = new AudioAnalyzer();
