<template>
  <div class="audio-recorder">
    <!-- 録音ボタン中央揃え -->
    <div style="display: flex; justify-content: center; width: 100%;">
      <div 
        class="record-button" 
        :class="{ 'recording': isRecording }"
        @click="toggleRecording"
      >
        <div class="record-button-inner">
          <div v-if="isRecording" class="stop-icon"></div>
          <div v-else class="mic-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 16c2.206 0 4-1.794 4-4V6c0-2.217-1.785-4.021-3.979-4.021a.933.933 0 0 0-.209.025A4.006 4.006 0 0 0 8 6v6c0 2.206 1.794 4 4 4zm-1.5 2v2h3v-2h-3z"></path>
              <path d="M19 12v-2a1 1 0 0 0-2 0v2c0 2.757-2.243 5-5 5s-5-2.243-5-5v-2a1 1 0 0 0-2 0v2c0 3.52 2.613 6.432 6 6.92V20H8.5a1 1 0 0 0 0 2h7a1 1 0 0 0 0-2H13v-1.08c3.387-.488 6-3.4 6-6.92z"></path>
            </svg>
          </div>
          <div v-if="isRecording" class="recording-time">{{ formattedRecordingTime }}</div>
        </div>
      </div>
    </div>

    <!-- Audio Player (shown after recording) --->
    <div v-if="audioUrl && !isRecording" class="audio-player-wrapper">
      <div class="audio-player-grid">
        <button class="play-pause-btn" @click="togglePlayback">
          <div v-if="isPlaying" class="pause-icon">
            <div class="pause-bar"></div>
            <div class="pause-bar"></div>
          </div>
          <div v-else class="play-icon"></div>
        </button>
        <div class="time-display">
          {{ formattedCurrentTime }} / {{ formattedDurationDisplay }}
        </div>
        <div
          class="seek-bar-container"
          @pointerdown="onSeekStart"
        >
          <div class="seek-bar-background"></div>
          <div class="seek-bar-progress" :style="{ width: `${progressPercentage}%` }"></div>
          <div class="seek-bar-handle" :style="{ left: `${progressPercentage}%` }"></div>
        </div>
        <div class="volume-icon" @click="toggleVolumeSlider">
          <svg v-if="volume > 0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 5.07V19c-1 0-1.27-.11-1.64-.23-.74-.25-1.42-.7-2.73-1.79l-4.36-3.63A1.49 1.49 0 0 1 3.5 12a1.49 1.49 0 0 1 .77-1.31l4.36-3.65c1.31-1.1 2-1.55 2.73-1.8C11.73 5.14 12 5 13 5.07m4.07 4.8a1 1 0 0 1 1.42 0 6 6 0 0 1 0 8.4 1 1 0 0 1-1.42-1.4 4 4 0 0 0 0-5.6 1 1 0 0 1 0-1.4m2.8-2.8a1 1 0 0 1 1.4 0 10 10 0 0 1 0 14.14 1 1 0 0 1-1.4-1.42 8 8 0 0 0 0-11.3 1 1 0 0 1 0-1.42Z"></path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.27 5 2 6.27l4.22 4.22A1.49 1.49 0 0 0 5.5 12a1.49 1.49 0 0 0 .77 1.31l4.36 3.63c1.31 1.09 1.99 1.54 2.73 1.79.37.12.64.23 1.64.23v-6l4 4v-1.73L7.73 5H3.27M19 12.8V7a1 1 0 0 1 2 0v7.8a1 1 0 0 1-2 0m-4-1.4V5.07c-1-.07-1.27.07-1.64.17-.74.25-1.42.7-2.73 1.8l-3.17 2.67 7.54 7.54z"></path>
          </svg>
        </div>
        <input 
          v-if="showVolumeSlider"
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          :value="volume"
          class="volume-slider"
          @input="updateVolume"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';

export default {
  props: {
    content: { 
      type: Object, 
      required: true 
    },
    uid: { 
      type: String, 
      required: true 
    },
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {
    // Editor state
    const isEditing = computed(() => {
      // eslint-disable-next-line no-unreachable
      return false;
    });

    // Recording state
    const isRecording = ref(false);
    const recordingTime = ref(0);
    const recordingInterval = ref(null);
    const mediaRecorder = ref(null);
    const audioChunks = ref([]);
    const MAX_RECORD_SECONDS = 60;

    // Audio player state
    const audioUrl = ref(null);
    const audioElement = ref(null);
    const isPlaying = ref(false);
    const currentTime = ref(0);
    const duration = ref(0);
    const volume = ref(props.content?.initialVolume ?? 1);
    const progressPercentage = computed(() => {
      if (duration.value === 0) return 0;
      return (currentTime.value / duration.value) * 100;
    });
    // Seek bar drag state
    const isSeeking = ref(false);

    // Internal variables for WeWeb
    const { value: audioBlob, setValue: setAudioBlob } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'audioBlob',
      defaultValue: null
    });

    const { value: audioDataUrl, setValue: setAudioDataUrl } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'audioDataUrl',
      defaultValue: null
    });

    // 録音中フラグをWeWeb変数として返す
    const { value: isRecordingFlag, setValue: setIsRecordingFlag } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'isRecording',
      defaultValue: false
    });
    watch(isRecording, (val) => {
      setIsRecordingFlag(val);
    });

    // Format time display (mm:ss)
    const formatTime = (timeInSeconds) => {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = Math.floor(timeInSeconds % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formattedRecordingTime = computed(() => formatTime(recordingTime.value));
    const formattedCurrentTime = computed(() => formatTime(currentTime.value));
    const formattedDuration = computed(() => formatTime(duration.value));

    // durationが正常な値でない場合は--:--を表示
    const formattedDurationDisplay = computed(() => {
      return (duration.value && isFinite(duration.value) && !isNaN(duration.value) && duration.value > 0)
        ? formatTime(duration.value)
        : '--:--';
    });

const startRecording = async () => {
// エディタ上では録音しない
if (isEditing.value) return;

try {
  // 1. マイク取得（ここで失敗したら即エラー出す）
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // 2. 送信用のチャンクと時間を初期化
  audioChunks.value = [];
  recordingTime.value = 0;

  // 4. MediaRecorder を作成（mp3前提・Safari優先）
  let mimeType = "audio/mpeg";
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = ""; // fallback（ブラウザに任せる）
  }

  mediaRecorder.value = mimeType
    ? new MediaRecorder(stream, { mimeType })
    : new MediaRecorder(stream);

  // 5. 録音スタート
  mediaRecorder.value.start(1000);
  isRecording.value = true;

  // 6. 経過時間カウント
  recordingInterval.value = setInterval(() => {
    recordingTime.value += 1;

    if (recordingTime.value >= MAX_RECORD_SECONDS) {
      setTimeout(() => {
        stopRecording();
      }, 200);

      emit("trigger-event", {
        name: "recordingLimitReached",
        event: {
          maxSeconds: MAX_RECORD_SECONDS
        }
      });
    }
  }, 1000);

  // 7. データが来たらためておく
  mediaRecorder.value.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      audioChunks.value.push(event.data);
    }
  };

  // 8. 停止時の処理（元のコードをできるだけ残す）
  mediaRecorder.value.onstop = () => {
    // マイク解放
    stream.getTracks().forEach((track) => track.stop());
    clearInterval(recordingInterval.value);

    // MP3 Blob で生成
    const blob = new Blob(audioChunks.value, { type: "audio/mpeg" });

    // サイズ制限（5MB）
    const MAX_SIZE = 5 * 1024 * 1024;
    if (blob.size > MAX_SIZE) {
      alert("音声が長すぎるため保存できませんでした（最大60秒）。");
      return;
    }

    // WeWebの変数に保存
    setAudioBlob(blob);

    // 再生用URL
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value);
    }
    audioUrl.value = URL.createObjectURL(blob);

    // dataURLも作っておく（保存したいとき用）
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      setAudioDataUrl(reader.result);
    };

    // 再生用のAudio要素を作る
    audioElement.value = new Audio(audioUrl.value);

    // ▼ 元の「duration取りに行くリトライ」もそのまま残す
    let retryCount = 0;
    const maxRetry = 20;
    function tryGetDuration() {
      if (
        audioElement.value &&
        !isNaN(audioElement.value.duration) &&
        isFinite(audioElement.value.duration) &&
        audioElement.value.duration > 0
      ) {
        duration.value = audioElement.value.duration;
      } else if (retryCount < maxRetry) {
        retryCount++;
        setTimeout(tryGetDuration, 100);
      }
    }
    audioElement.value.addEventListener("loadedmetadata", tryGetDuration);
    tryGetDuration(); // すぐ取れるならすぐ反映

    // 完了イベント（元のまま）
    emit("trigger-event", {
      name: "recordingComplete",
      event: {
        duration: duration.value,
        size: blob.size,
      },
    });

    // 録音フラグOFF（watchでWeWeb変数にも飛ぶ）
    isRecording.value = false;
  };
} catch (error) {
  console.error("Error accessing microphone:", error);
  emit("trigger-event", {
    name: "error",
    event: {
      message: "Error accessing microphone",
      details: error.message,
    },
  });
}
};

    const stopRecording = () => {
      if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
        mediaRecorder.value.stop();
        isRecording.value = false;
      }
    };

    const toggleRecording = () => {
      if (isEditing.value) return;
      
      if (isRecording.value) {
        stopRecording();
      } else {
        startRecording();
      }
    };

    // Audio player functions
    const createAudioElement = () => {
      if (audioElement.value) {
        audioElement.value.pause();
        audioElement.value.removeEventListener('timeupdate', updateTime);
        audioElement.value.removeEventListener('loadedmetadata', updateDuration);
        audioElement.value.removeEventListener('ended', handleEnded);
      }
      
      audioElement.value = new Audio(audioUrl.value);
      audioElement.value.volume = volume.value;
      
      audioElement.value.addEventListener('timeupdate', updateTime);
      audioElement.value.addEventListener('loadedmetadata', updateDuration);
      audioElement.value.addEventListener('ended', handleEnded);
      
      // Initialize duration once loaded
      if (audioElement.value.readyState >= 2) {
        updateDuration();
      }
    };

    const updateTime = () => {
      currentTime.value = audioElement.value?.currentTime || 0;
    };

    // duration取得リトライロジック
    let durationRetryCount = 0;
    const MAX_DURATION_RETRY = 10;
    const DURATION_RETRY_INTERVAL = 100;

    const updateDuration = () => {
      if (!audioElement.value) return;
      let d = audioElement.value.duration;
      console.log('duration取得:', d);
      if (!isNaN(d) && isFinite(d) && d > 0) {
        duration.value = d;
        durationRetryCount = 0;
      } else if (durationRetryCount < MAX_DURATION_RETRY) {
        durationRetryCount++;
        setTimeout(updateDuration, DURATION_RETRY_INTERVAL);
      } else {
        durationRetryCount = 0;
      }
    };

    const handleEnded = () => {
      isPlaying.value = false;
      currentTime.value = 0;
      emit('trigger-event', {
        name: 'playbackEnded',
        event: {}
      });
    };

    const togglePlayback = () => {
      if (isEditing.value) return;
      
      if (!audioElement.value) return;
      
      if (isPlaying.value) {
        audioElement.value.pause();
        isPlaying.value = false;
        emit('trigger-event', {
          name: 'pause',
          event: { currentTime: currentTime.value }
        });
      } else {
        audioElement.value.play().catch(error => {
          console.error('Error playing audio:', error);
          emit('trigger-event', {
            name: 'error',
            event: { 
              message: 'Error playing audio',
              details: error.message
            }
          });
        });
        isPlaying.value = true;
        emit('trigger-event', {
          name: 'play',
          event: { currentTime: currentTime.value }
        });
      }
    };

    // Helper for seeking by pointer
    const seekByClientX = (clientX, container) => {
      if (!audioElement.value || !duration.value) return;

      const rect = container.getBoundingClientRect();
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const newTime = ratio * duration.value;

      audioElement.value.currentTime = newTime;
      currentTime.value = newTime;
    };

    // Pointer drag seeking handlers
    const onSeekStart = (event) => {
      if (isEditing.value) return;

      isSeeking.value = true;
      const container = event.currentTarget;

      seekByClientX(event.clientX, container);

      window.addEventListener('pointermove', onSeekMove);
      window.addEventListener('pointerup', onSeekEnd);
    };

    const onSeekMove = (event) => {
      if (!isSeeking.value) return;
      const container = document.querySelector('.seek-bar-container');
      if (!container) return;

      seekByClientX(event.clientX, container);
    };

    const onSeekEnd = () => {
      isSeeking.value = false;
      window.removeEventListener('pointermove', onSeekMove);
      window.removeEventListener('pointerup', onSeekEnd);
    };

    const updateVolume = (event) => {
      if (isEditing.value) return;
      
      const newVolume = parseFloat(event.target.value);
      volume.value = newVolume;
      
      if (audioElement.value) {
        audioElement.value.volume = newVolume;
      }
      
      emit('trigger-event', {
        name: 'volumeChange',
        event: { volume: newVolume }
      });
    };

    const toggleMute = () => {
      if (isEditing.value) return;
      
      if (volume.value > 0) {
        // Store current volume before muting
        volume.value = 0;
      } else {
        // Restore to default or previous volume
        volume.value = props.content?.initialVolume ?? 1;
      }
      
      if (audioElement.value) {
        audioElement.value.volume = volume.value;
      }
      
      emit('trigger-event', {
        name: 'volumeChange',
        event: { volume: volume.value }
      });
    };

    // Action methods
    const startNewRecording = () => {
      if (isRecording.value) {
        stopRecording();
      }
      
      // Clear previous recording
      if (audioUrl.value) {
        URL.revokeObjectURL(audioUrl.value);
        audioUrl.value = null;
      }
      
      setAudioBlob(null);
      setAudioDataUrl(null);
      
      // Start new recording
      startRecording();
    };

    const playAudio = () => {
      if (!isPlaying.value && audioElement.value) {
        togglePlayback();
      }
    };

    const pauseAudio = () => {
      if (isPlaying.value && audioElement.value) {
        togglePlayback();
      }
    };

    const seekToPosition = (percentage) => {
      if (!audioElement.value) return;
      
      const newTime = (percentage / 100) * duration.value;
      audioElement.value.currentTime = newTime;
      currentTime.value = newTime;
    };

    const setVolumeLevel = (newVolume) => {
      if (newVolume < 0) newVolume = 0;
      if (newVolume > 1) newVolume = 1;
      
      volume.value = newVolume;
      
      if (audioElement.value) {
        audioElement.value.volume = newVolume;
      }
    };

    // 音量バーの塗り潰しを反映
    const updateVolumeSliderFill = () => {
      const slider = document.querySelector('.volume-slider');
      if (slider) {
        const percent = volume.value * 100;
        slider.style.background = `linear-gradient(to right, #4169E1 0%, #4169E1 ${percent}%, #ddd ${percent}%, #ddd 100%)`;
      }
    };

    const showVolumeSlider = ref(false);
    const toggleVolumeSlider = () => {
      showVolumeSlider.value = !showVolumeSlider.value;
      if (showVolumeSlider.value) {
        setTimeout(updateVolumeSliderFill, 0);
      }
    };

    // Cleanup on component unmount
    onBeforeUnmount(() => {
      if (recordingInterval.value) {
        clearInterval(recordingInterval.value);
      }
      
      if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
        mediaRecorder.value.stop();
      }
      
      if (audioUrl.value) {
        URL.revokeObjectURL(audioUrl.value);
      }
      
      if (audioElement.value) {
        audioElement.value.pause();
        audioElement.value.removeEventListener('timeupdate', updateTime);
        audioElement.value.removeEventListener('loadedmetadata', updateDuration);
        audioElement.value.removeEventListener('ended', handleEnded);
      }
    });

    // Watch for initial volume changes
    watch(() => props.content?.initialVolume, (newValue) => {
      if (newValue !== undefined && !isNaN(newValue)) {
        const validVolume = Math.max(0, Math.min(1, newValue));
        volume.value = validVolume;
        
        if (audioElement.value) {
          audioElement.value.volume = validVolume;
        }
      }
    });

    onMounted(() => {
      updateVolumeSliderFill();
    });
    watch(volume, () => {
      updateVolumeSliderFill();
    });

    // audioUrlが変わったらaudioElementを再生成し、イベントをバインド
    watch(audioUrl, (newUrl) => {
      if (!newUrl) return;
      if (audioElement.value) {
        audioElement.value.pause();
        audioElement.value.removeEventListener('timeupdate', updateTime);
        audioElement.value.removeEventListener('loadedmetadata', updateDuration);
        audioElement.value.removeEventListener('ended', handleEnded);
      }
      audioElement.value = new Audio(newUrl);
      audioElement.value.volume = volume.value;
      audioElement.value.addEventListener('timeupdate', updateTime);
      audioElement.value.addEventListener('loadedmetadata', updateDuration);
      audioElement.value.addEventListener('ended', handleEnded);
      // durationがすぐ取れる場合もあるので即時反映
      if (audioElement.value.readyState >= 1) {
        updateDuration();
      }
    });

    return {
      // State
      isRecording,
      recordingTime,
      formattedRecordingTime,
      audioUrl,
      isPlaying,
      currentTime,
      duration,
      formattedCurrentTime,
      formattedDuration,
      volume,
      progressPercentage,
      formattedDurationDisplay,
      
      // Methods
      toggleRecording,
      togglePlayback,
      updateVolume,
      toggleMute,
      // Seek bar drag
      onSeekStart,
      
      // Actions
      startNewRecording,
      playAudio,
      pauseAudio,
      seekToPosition,
      setVolumeLevel,
      
      // Internal variables
      audioBlob,
      audioDataUrl,
      updateVolumeSliderFill,
      showVolumeSlider,
      toggleVolumeSlider
    };
  }
};
</script>

<style lang="scss" scoped>
.audio-recorder {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

/* Recording Button */
.record-button {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  &.recording {
    background-color: #ff4c4c;
    animation: pulse 1.5s infinite;
  }
}

.record-button-inner {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.mic-icon {
  width: 32px;
  height: 32px;
  color: #333;
  
  svg {
    width: 100%;
    height: 100%;
  }
}

.stop-icon {
  width: 16px;
  height: 16px;
  background-color: #ff4c4c;
  border-radius: 2px;
}

.recording-time {
  font-size: 12px;
  margin-top: 4px;
  color: #333;
}

/* Audio Player */
.audio-player-wrapper {
  width: 95%;
  margin: 24px auto 0 auto;
  display: flex;
  justify-content: center;
}

.audio-player-grid {
  display: grid;
  align-items: center;
  width: 100%;
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  grid-template-columns: auto auto 1fr auto auto;
  gap: 8px;
}
.play-pause-btn {
  grid-column: 1;
  background: #4169E1;
  color: #fff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}
.play-pause-btn:hover {
  background: #4169E1;
}
.play-icon {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8px 0 8px 14px;
  border-color: transparent transparent transparent #fff;
  margin-left: 3px;
}

.pause-icon {
  width: 14px;
  height: 14px;
  display: flex;
  justify-content: space-between;
  
  .pause-bar {
    width: 4px;
    height: 14px;
    background-color: white;
    border-radius: 2px;
  }
}

.time-display {
  min-width: 60px;
  text-align: center;
  font-size: 12px; 
}

.seek-bar-container {
  flex: 1;
  margin: 0 8px;
  position: relative;
  height: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  touch-action: none;
}

.seek-bar-background {
  width: 100%;
  height: 4px;
  background-color: #ddd;
  border-radius: 2px;
  position: absolute;
}

.seek-bar-progress {
  height: 4px;
  background-color: #4169E1;
  border-radius: 2px;
  position: absolute;
}

.seek-bar-handle {
  width: 12px;
  height: 12px;
  background-color: #4169E1;
  border-radius: 50%;
  position: absolute;
  transform: translateX(-50%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.volume-icon {
  width: 20px;
  height: 20px;
  color: #555;
  cursor: pointer;
  
  svg {
    width: 100%;
    height: 100%;
  }
  
  &:hover {
    color: #333;
  }
}

.volume-slider {
  grid-column: 5;
  width: 60px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #ddd;
  border-radius: 2px;
  outline: none;
  transition: width 0.2s, background 0.2s;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #4169E1;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #4169E1;
  cursor: pointer;
  border: none;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 76, 76, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 76, 76, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 76, 76, 0);
  }
}
</style>