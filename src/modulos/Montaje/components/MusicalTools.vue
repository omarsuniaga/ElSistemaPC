<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">🎼 Herramientas Musicales</h1>
      <p class="text-gray-600">Afinador, metrónomo y herramientas de práctica integradas</p>
    </div>

    <!-- Tools Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Tuner -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          🎯 Afinador Digital
          <button
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              tunerActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            ]"
            @click="toggleTuner"
          >
            {{ tunerActive ? 'Activo' : 'Inactivo' }}
          </button>
        </h2>

        <div class="space-y-4">
          <!-- Note Display -->
          <div class="text-center">
            <div class="text-6xl font-bold text-blue-600 mb-2">
              {{ currentNote || '—' }}
            </div>
            <div class="text-lg text-gray-600">
              {{ currentFrequency ? `${currentFrequency.toFixed(1)} Hz` : 'Esperando audio...' }}
            </div>
          </div>

          <!-- Tuning Indicator -->
          <div class="relative h-8 bg-gray-200 rounded-full overflow-hidden">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-1 h-6 bg-black"></div>
            </div>
            <div 
              v-if="tuningOffset !== null"
              class="absolute top-1 h-6 w-2 rounded transition-all duration-200"
              :class="getTuningColor()"
              :style="{ left: `${50 + (tuningOffset * 0.5)}%` }"
            ></div>
          </div>

          <!-- Tuning Status -->
          <div class="text-center">
            <span 
              v-if="tuningStatus"
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                tuningStatus === 'in-tune' ? 'bg-green-100 text-green-800' :
                tuningStatus === 'sharp' ? 'bg-red-100 text-red-800' :
                tuningStatus === 'flat' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              ]"
            >
              {{ getTuningStatusText() }}
            </span>
          </div>

          <!-- Reference Pitch Selector -->
          <div class="flex items-center justify-center gap-4">
            <label class="text-sm font-medium text-gray-700">A4 =</label>
            <select
              v-model="referencePitch"
              class="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="440">440 Hz</option>
              <option value="441">441 Hz</option>
              <option value="442">442 Hz</option>
              <option value="443">443 Hz</option>
            </select>
          </div>

          <!-- Calibration Display -->
          <div class="text-center text-sm text-gray-500">
            <div class="grid grid-cols-3 gap-2 mt-2">
              <div :class="tuningOffset < -10 ? 'text-red-600 font-bold' : ''">♭ Bemol</div>
              <div :class="Math.abs(tuningOffset) <= 10 ? 'text-green-600 font-bold' : ''">✓ Afinado</div>
              <div :class="tuningOffset > 10 ? 'text-red-600 font-bold' : ''">♯ Sostenido</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Metronome -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          ⏱️ Metrónomo
          <button
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              metronomeActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
            ]"
            @click="toggleMetronome"
          >
            {{ metronomeActive ? 'Activo' : 'Inactivo' }}
          </button>
        </h2>

        <div class="space-y-4">
          <!-- BPM Display -->
          <div class="text-center">
            <div class="text-4xl font-bold text-purple-600 mb-2">
              {{ bpm }}
            </div>
            <div class="text-lg text-gray-600">BPM</div>
          </div>

          <!-- BPM Controls -->
          <div class="flex items-center justify-center gap-2">
            <button
              class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              @click="adjustBpm(-10)"
            >
              -10
            </button>
            <button
              class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              @click="adjustBpm(-1)"
            >
              -1
            </button>
            <input
              v-model.number="bpm"
              type="range"
              min="40"
              max="200"
              class="flex-1 mx-4"
              @input="onBpmChange"
            >
            <button
              class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              @click="adjustBpm(1)"
            >
              +1
            </button>
            <button
              class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              @click="adjustBpm(10)"
            >
              +10
            </button>
          </div>

          <!-- Time Signature -->
          <div class="flex items-center justify-center gap-4">
            <label class="text-sm font-medium text-gray-700">Compás:</label>
            <select
              v-model="timeSignature"
              class="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              @change="onTimeSignatureChange"
            >
              <option value="4/4">4/4</option>
              <option value="3/4">3/4</option>
              <option value="2/4">2/4</option>
              <option value="6/8">6/8</option>
              <option value="9/8">9/8</option>
              <option value="12/8">12/8</option>
            </select>
          </div>

          <!-- Beat Indicator -->
          <div class="flex justify-center gap-2">
            <div
              v-for="beat in getBeatsInMeasure()"
              :key="beat"
              :class="[
                'w-4 h-4 rounded-full border-2 transition-all duration-100',
                currentBeat === beat ? 'bg-purple-500 border-purple-500 scale-125' : 'bg-gray-200 border-gray-300'
              ]"
            ></div>
          </div>

          <!-- Tempo Markings -->
          <div class="grid grid-cols-3 gap-2 text-xs">
            <button
              v-for="tempo in tempoMarkings"
              :key="tempo.name"
              class="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              @click="setBpm(tempo.bpm)"
            >
              {{ tempo.name }}<br>{{ tempo.bpm }}
            </button>
          </div>

          <!-- Volume Control -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-700">🔊</span>
            <input
              v-model.number="metronomeVolume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="flex-1"
            >
            <span class="text-sm text-gray-700">{{ Math.round(metronomeVolume * 100) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Practice Tools -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">🎵 Herramientas de Práctica</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Scale Generator -->
        <div class="border border-gray-200 rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-3">Generador de Escalas</h3>
          
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tónica</label>
              <select
                v-model="scaleSettings.root"
                class="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option v-for="note in notes" :key="note" :value="note">{{ note }}</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                v-model="scaleSettings.type"
                class="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="major">Mayor</option>
                <option value="minor">Menor Natural</option>
                <option value="harmonic">Menor Armónica</option>
                <option value="melodic">Menor Melódica</option>
                <option value="chromatic">Cromática</option>
                <option value="pentatonic">Pentatónica</option>
                <option value="blues">Blues</option>
              </select>
            </div>
            
            <button
              class="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              @click="generateScale"
            >
              Generar Escala
            </button>
            
            <div v-if="generatedScale.length > 0" class="mt-3">
              <div class="text-sm font-medium text-gray-700 mb-2">Escala:</div>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="note in generatedScale"
                  :key="note"
                  class="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                >
                  {{ note }}
                </span>
              </div>
            </div>

            <!-- Play Scale Button -->
            <button
              v-if="generatedScale.length > 0"
              :disabled="playingScale"
              class="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
              @click="playScale"
            >
              {{ playingScale ? 'Reproduciendo...' : '▶️ Reproducir Escala' }}
            </button>
          </div>
        </div>

        <!-- Interval Trainer -->
        <div class="border border-gray-200 rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-3">Entrenador de Intervalos</h3>
          
          <div class="space-y-3">
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 mb-2">
                {{ currentInterval || '?' }}
              </div>
              <div class="text-sm text-gray-600">
                {{ intervalNotes.join(' - ') }}
              </div>
            </div>
            
            <button
              class="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              @click="generateInterval"
            >
              Nuevo Intervalo
            </button>

            <button
              v-if="intervalNotes.length > 0"
              :disabled="playingInterval"
              class="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              @click="playInterval"
            >
              {{ playingInterval ? 'Reproduciendo...' : '▶️ Reproducir' }}
            </button>
            
            <div class="grid grid-cols-2 gap-2 text-xs">
              <button
                v-for="interval in intervals"
                :key="interval"
                :class="[
                  'px-2 py-1 rounded transition-colors',
                  intervalAnswer === interval ? 
                    (intervalCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') :
                    'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
                @click="checkInterval(interval)"
              >
                {{ interval }}
              </button>
            </div>

            <div v-if="intervalAnswer" class="text-center text-sm">
              <span :class="intervalCorrect ? 'text-green-600' : 'text-red-600'">
                {{ intervalCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto' }}
              </span>
              <div class="text-gray-500 mt-1">
                Respuesta: {{ currentInterval }}
              </div>
            </div>
          </div>
        </div>

        <!-- Chord Identifier -->
        <div class="border border-gray-200 rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-3">Identificador de Acordes</h3>
          
          <div class="space-y-3">
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-600 mb-2">
                {{ currentChord || '?' }}
              </div>
              <div class="text-sm text-gray-600">
                {{ chordNotes.join(' - ') }}
              </div>
            </div>
            
            <button
              class="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
              @click="generateChord"
            >
              Nuevo Acorde
            </button>

            <button
              v-if="chordNotes.length > 0"
              :disabled="playingChord"
              class="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              @click="playChord"
            >
              {{ playingChord ? 'Reproduciendo...' : '▶️ Reproducir' }}
            </button>
            
            <div class="grid grid-cols-2 gap-2 text-xs">
              <button
                v-for="chord in chordTypes"
                :key="chord"
                :class="[
                  'px-2 py-1 rounded transition-colors',
                  chordAnswer === chord ? 
                    (chordCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') :
                    'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
                @click="checkChord(chord)"
              >
                {{ chord }}
              </button>
            </div>

            <div v-if="chordAnswer" class="text-center text-sm">
              <span :class="chordCorrect ? 'text-green-600' : 'text-red-600'">
                {{ chordCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto' }}
              </span>
              <div class="text-gray-500 mt-1">
                Respuesta: {{ currentChord }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Audio Recorder -->
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">🎤 Grabadora de Audio</h2>
      
      <div class="flex flex-col items-center gap-4">
        <div class="flex items-center gap-4">
          <button
            :class="[
              'px-6 py-3 rounded-lg font-medium transition-colors',
              recording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'
            ]"
            @click="toggleRecording"
          >
            {{ recording ? '⏹️ Detener' : '🎤 Grabar' }}
          </button>
          
          <div v-if="recording" class="flex items-center gap-2">
            <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span class="text-sm text-gray-600">{{ formatTime(recordingTime) }}</span>
          </div>
        </div>

        <!-- Audio Level Indicator -->
        <div v-if="recording" class="w-full max-w-md">
          <div class="text-sm text-gray-600 mb-1">Nivel de audio:</div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-green-500 h-2 rounded-full transition-all duration-100"
              :style="{ width: `${audioLevel * 100}%` }"
            ></div>
          </div>
        </div>
        
        <div v-if="recordings.length > 0" class="w-full max-w-2xl">
          <h3 class="font-medium text-gray-900 mb-3">Grabaciones</h3>
          <div class="space-y-2">
            <div 
              v-for="(recording, index) in recordings" 
              :key="index"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium">Grabación {{ index + 1 }}</span>
                <span class="text-xs text-gray-500">{{ formatTime(recording.duration) }}</span>
                <span class="text-xs text-gray-500">{{ formatDate(recording.timestamp) }}</span>
              </div>
              <div class="flex gap-2">
                <button
                  :disabled="playingRecording === index"
                  class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                  @click="playRecording(recording)"
                >
                  {{ playingRecording === index ? '⏸️' : '▶️' }}
                </button>
                <button
                  class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                  @click="downloadRecording(recording, index)"
                >
                  📥
                </button>
                <button
                  class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  @click="deleteRecording(index)"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// Tuner state
const tunerActive = ref(false);
const currentNote = ref<string | null>(null);
const currentFrequency = ref<number | null>(null);
const tuningOffset = ref<number | null>(null);
const tuningStatus = ref<string | null>(null);
const referencePitch = ref(440);

// Metronome state
const metronomeActive = ref(false);
const bpm = ref(120);
const timeSignature = ref('4/4');
const currentBeat = ref(1);
const metronomeVolume = ref(0.5);

// Practice tools state
const scaleSettings = ref({
  root: 'C',
  type: 'major',
});
const generatedScale = ref<string[]>([]);
const playingScale = ref(false);
const currentInterval = ref<string | null>(null);
const intervalNotes = ref<string[]>([]);
const intervalAnswer = ref<string | null>(null);
const intervalCorrect = ref<boolean | null>(null);
const playingInterval = ref(false);
const currentChord = ref<string | null>(null);
const chordNotes = ref<string[]>([]);
const chordAnswer = ref<string | null>(null);
const chordCorrect = ref<boolean | null>(null);
const playingChord = ref(false);

// Audio recorder state
const recording = ref(false);
const recordingTime = ref(0);
const audioLevel = ref(0);
const recordings = ref<Array<{
  blob: Blob
  duration: number
  timestamp: string
}>>([]);
const playingRecording = ref<number | null>(null);

// Audio context and nodes
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let microphone: MediaStreamAudioSourceNode | null = null;
let mediaRecorder: MediaRecorder | null = null;
let metronomeInterval: number | null = null;
let recordingInterval: number | null = null;
let recordingStartTime: number = 0;
let currentAudio: HTMLAudioElement | null = null;

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const intervals = ['Unísono', '2ª menor', '2ª mayor', '3ª menor', '3ª mayor', '4ª justa', 'Tritono', '5ª justa', '6ª menor', '6ª mayor', '7ª menor', '7ª mayor', 'Octava'];
const chordTypes = ['Mayor', 'menor', 'dim', 'aug', 'sus2', 'sus4', '7', 'maj7'];

const tempoMarkings = [
  { name: 'Largo', bpm: 60 },
  { name: 'Adagio', bpm: 70 },
  { name: 'Andante', bpm: 90 },
  { name: 'Moderato', bpm: 110 },
  { name: 'Allegro', bpm: 140 },
  { name: 'Presto', bpm: 180 },
];

// Note frequencies (A4 = 440Hz)
const noteFrequencies: Record<string, number> = {
  'C': 261.63,
  'C#': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'B': 493.88,
};

// Tuner functions
const toggleTuner = async () => {
  if (tunerActive.value) {
    stopTuner();
  } else {
    await startTuner();
  }
};

const startTuner = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.8;
    microphone.connect(analyser);
    
    tunerActive.value = true;
    detectPitch();
  } catch (error) {
    console.error('Error accessing microphone:', error);
    alert('No se pudo acceder al micrófono. Verifica los permisos.');
  }
};

const stopTuner = () => {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  tunerActive.value = false;
  currentNote.value = null;
  currentFrequency.value = null;
  tuningOffset.value = null;
  tuningStatus.value = null;
};

const detectPitch = () => {
  if (!analyser || !tunerActive.value) return;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);
  analyser.getFloatFrequencyData(dataArray);
  
  const frequency = findFundamentalFrequency(dataArray);
  if (frequency > 0) {
    currentFrequency.value = frequency;
    const noteInfo = frequencyToNote(frequency);
    currentNote.value = noteInfo.note;
    tuningOffset.value = noteInfo.offset;
    tuningStatus.value = noteInfo.status;
  }
  
  requestAnimationFrame(detectPitch);
};

const findFundamentalFrequency = (dataArray: Float32Array): number => {
  // Autocorrelation method for better pitch detection
  const sampleRate = audioContext?.sampleRate || 44100;
  const bufferSize = dataArray.length;
  
  // Convert to time domain
  const timeData = new Float32Array(bufferSize);
  const analyserNode = analyser!;
  analyserNode.getFloatTimeDomainData(timeData);
  
  // Find the fundamental frequency using autocorrelation
  let maxCorrelation = 0;
  let bestPeriod = 0;
  
  for (let period = 8; period < bufferSize / 2; period++) {
    let correlation = 0;
    for (let i = 0; i < bufferSize - period; i++) {
      correlation += timeData[i] * timeData[i + period];
    }
    
    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestPeriod = period;
    }
  }
  
  if (maxCorrelation > 0.01) {
    return sampleRate / bestPeriod;
  }
  
  return 0;
};

const frequencyToNote = (frequency: number) => {
  const A4 = referencePitch.value;
  const C0 = A4 * Math.pow(2, -4.75);
  
  if (frequency > 0) {
    const h = Math.round(12 * Math.log2(frequency / C0));
    const octave = Math.floor(h / 12);
    const n = h % 12;
    const note = notes[n] + octave;
    
    const expectedFreq = C0 * Math.pow(2, h / 12);
    const offset = Math.log2(frequency / expectedFreq) * 1200; // cents
    
    let status = 'in-tune';
    if (offset > 10) status = 'sharp';
    else if (offset < -10) status = 'flat';
    
    return {
      note,
      offset: Math.max(-50, Math.min(50, offset)),
      status,
    };
  }
  
  return { note: '', offset: 0, status: 'silent' };
};

const getTuningColor = () => {
  if (!tuningStatus.value) return 'bg-gray-400';
  
  switch (tuningStatus.value) {
  case 'in-tune': return 'bg-green-500';
  case 'sharp': return 'bg-red-500';
  case 'flat': return 'bg-yellow-500';
  default: return 'bg-gray-400';
  }
};

const getTuningStatusText = () => {
  switch (tuningStatus.value) {
  case 'in-tune': return 'Afinado';
  case 'sharp': return 'Sostenido';
  case 'flat': return 'Bemol';
  default: return 'Silencio';
  }
};

// Metronome functions
const toggleMetronome = () => {
  if (metronomeActive.value) {
    stopMetronome();
  } else {
    startMetronome();
  }
};

const startMetronome = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  
  metronomeActive.value = true;
  currentBeat.value = 1;
  
  const interval = 60000 / bpm.value;
  
  metronomeInterval = window.setInterval(() => {
    playMetronomeClick();
    
    const beatsPerMeasure = getBeatsInMeasure();
    currentBeat.value = currentBeat.value >= beatsPerMeasure ? 1 : currentBeat.value + 1;
  }, interval);
};

const stopMetronome = () => {
  metronomeActive.value = false;
  if (metronomeInterval) {
    clearInterval(metronomeInterval);
    metronomeInterval = null;
  }
  currentBeat.value = 1;
};

const playMetronomeClick = () => {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Different pitch for downbeat
  oscillator.frequency.setValueAtTime(currentBeat.value === 1 ? 800 : 600, audioContext.currentTime);
  oscillator.type = 'square';
  
  gainNode.gain.setValueAtTime(metronomeVolume.value, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
};

const adjustBpm = (change: number) => {
  bpm.value = Math.max(40, Math.min(200, bpm.value + change));
  
  if (metronomeActive.value) {
    stopMetronome();
    startMetronome();
  }
};

const setBpm = (newBpm: number) => {
  bpm.value = newBpm;
  if (metronomeActive.value) {
    stopMetronome();
    startMetronome();
  }
};

const onBpmChange = () => {
  if (metronomeActive.value) {
    stopMetronome();
    startMetronome();
  }
};

const onTimeSignatureChange = () => {
  currentBeat.value = 1;
  if (metronomeActive.value) {
    stopMetronome();
    startMetronome();
  }
};

const getBeatsInMeasure = (): number => {
  const [numerator] = timeSignature.value.split('/').map(Number);
  return numerator;
};

// Practice tools functions
const generateScale = () => {
  const scalePatterns = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    harmonic: [0, 2, 3, 5, 7, 8, 11],
    melodic: [0, 2, 3, 5, 7, 9, 11],
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
  };
  
  const rootIndex = notes.indexOf(scaleSettings.value.root);
  const pattern = scalePatterns[scaleSettings.value.type];
  
  generatedScale.value = pattern.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return notes[noteIndex];
  });
};

const playScale = async () => {
  if (!audioContext || playingScale.value) return;
  
  playingScale.value = true;
  
  for (let i = 0; i < generatedScale.value.length; i++) {
    const note = generatedScale.value[i];
    const frequency = noteFrequencies[note];
    
    if (frequency) {
      playTone(frequency, 0.5);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }
  
  playingScale.value = false;
};

const generateInterval = () => {
  const rootIndex = Math.floor(Math.random() * 12);
  const intervalIndex = Math.floor(Math.random() * 13);
  
  const root = notes[rootIndex];
  const second = notes[(rootIndex + intervalIndex) % 12];
  
  intervalNotes.value = [root, second];
  currentInterval.value = intervals[intervalIndex];
  intervalAnswer.value = null;
  intervalCorrect.value = null;
};

const playInterval = async () => {
  if (!audioContext || playingInterval.value || intervalNotes.value.length < 2) return;
  
  playingInterval.value = true;
  
  // Play notes simultaneously for harmonic interval
  const freq1 = noteFrequencies[intervalNotes.value[0]];
  const freq2 = noteFrequencies[intervalNotes.value[1]];
  
  if (freq1 && freq2) {
    playTone(freq1, 1.5);
    playTone(freq2, 1.5);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  playingInterval.value = false;
};

const checkInterval = (answer: string) => {
  intervalAnswer.value = answer;
  intervalCorrect.value = answer === currentInterval.value;
};

const generateChord = () => {
  const chordPatterns = {
    'Mayor': [0, 4, 7],
    'menor': [0, 3, 7],
    'dim': [0, 3, 6],
    'aug': [0, 4, 8],
    'sus2': [0, 2, 7],
    'sus4': [0, 5, 7],
    '7': [0, 4, 7, 10],
    'maj7': [0, 4, 7, 11],
  };
  
  const rootIndex = Math.floor(Math.random() * 12);
  const chordType = chordTypes[Math.floor(Math.random() * chordTypes.length)];
  const pattern = chordPatterns[chordType];
  
  const root = notes[rootIndex];
  chordNotes.value = pattern.map(interval => notes[(rootIndex + interval) % 12]);
  currentChord.value = `${root} ${chordType}`;
  chordAnswer.value = null;
  chordCorrect.value = null;
};

const playChord = async () => {
  if (!audioContext || playingChord.value || chordNotes.value.length === 0) return;
  
  playingChord.value = true;
  
  // Play all notes simultaneously
  chordNotes.value.forEach(note => {
    const frequency = noteFrequencies[note];
    if (frequency) {
      playTone(frequency, 2);
    }
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  playingChord.value = false;
};

const checkChord = (answer: string) => {
  chordAnswer.value = answer;
  chordCorrect.value = currentChord.value?.includes(answer) || false;
};

const playTone = (frequency: number, duration: number) => {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

// Audio recorder functions
const toggleRecording = async () => {
  if (recording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
};

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Setup audio level monitoring
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    
    const source = audioContext.createMediaStreamSource(stream);
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 256;
    source.connect(analyserNode);
    
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    
    const updateAudioLevel = () => {
      if (!recording.value) return;
      
      analyserNode.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      audioLevel.value = average / 255;
      
      requestAnimationFrame(updateAudioLevel);
    };
    updateAudioLevel();
    
    // Setup MediaRecorder
    mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
      
      recordings.value.push({
        blob,
        duration,
        timestamp: new Date().toISOString(),
      });
    };
    
    mediaRecorder.start();
    recording.value = true;
    recordingTime.value = 0;
    recordingStartTime = Date.now();
    
    recordingInterval = window.setInterval(() => {
      recordingTime.value++;
    }, 1000);
  } catch (error) {
    console.error('Error starting recording:', error);
    alert('No se pudo iniciar la grabación. Verifica los permisos del micrófono.');
  }
};

const stopRecording = () => {
  if (mediaRecorder && recording.value) {
    mediaRecorder.stop();
    recording.value = false;
    audioLevel.value = 0;
    
    if (recordingInterval) {
      clearInterval(recordingInterval);
      recordingInterval = null;
    }
  }
};

const playRecording = (recordingData: any, index: number) => {
  if (playingRecording.value === index) {
    // Stop current playback
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    playingRecording.value = null;
    return;
  }
  
  // Stop any current playback
  if (currentAudio) {
    currentAudio.pause();
  }
  
  const audio = new Audio(URL.createObjectURL(recordingData.blob));
  currentAudio = audio;
  playingRecording.value = index;
  
  audio.onended = () => {
    playingRecording.value = null;
    currentAudio = null;
    URL.revokeObjectURL(audio.src);
  };
  
  audio.play();
};

const downloadRecording = (recordingData: any, index: number) => {
  const url = URL.createObjectURL(recordingData.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grabacion_${index + 1}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
  a.click();
  URL.revokeObjectURL(url);
};

const deleteRecording = (index: number) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta grabación?')) {
    recordings.value.splice(index, 1);
  }
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  // Initialize audio context on user interaction
  document.addEventListener('click', () => {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
  }, { once: true });
});

onUnmounted(() => {
  stopTuner();
  stopMetronome();
  stopRecording();
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
});
</script>