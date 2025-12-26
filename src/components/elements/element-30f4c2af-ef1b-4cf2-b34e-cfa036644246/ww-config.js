export default {
  editor: {
    label: {
      en: 'Audio Recorder'
    },
    icon: 'microphone'
  },
  properties: {
    initialVolume: {
      label: { en: 'Initial Volume' },
      type: 'Number',
      section: 'settings',
      bindable: true,
      defaultValue: 1,
      options: {
        min: 0,
        max: 1,
        step: 0.1
      },
    },
    buttonSize: {
      label: { en: 'Button Size' },
      type: 'Length',
      section: 'style',
      bindable: true,
      defaultValue: '80px',
    },
    buttonColor: {
      label: { en: 'Button Color' },
      type: 'Color',
      section: 'style',
      bindable: true,
      defaultValue: '#f0f0f0',
    },
    recordingColor: {
      label: { en: 'Recording Color' },
      type: 'Color',
      section: 'style',
      bindable: true,
      defaultValue: '#ff4c4c',
    },
    accentColor: {
      label: { en: 'Accent Color' },
      type: 'Color',
      section: 'style',
      bindable: true,
      defaultValue: '#4a86e8',
    }
  },
  triggerEvents: [
    {
      name: 'recordingComplete',
      label: { en: 'On recording complete' },
      event: { 
        duration: 0,
        size: 0
      }
    },
    {
      name: 'play',
      label: { en: 'On play' },
      event: { 
        currentTime: 0
      }
    },
    {
      name: 'pause',
      label: { en: 'On pause' },
      event: { 
        currentTime: 0
      }
    },
    {
      name: 'playbackEnded',
      label: { en: 'On playback ended' },
      event: {}
    },
    {
      name: 'seek',
      label: { en: 'On seek' },
      event: { 
        currentTime: 0
      }
    },
    {
      name: 'volumeChange',
      label: { en: 'On volume change' },
      event: { 
        volume: 1
      }
    },
    {
      name: 'error',
      label: { en: 'On error' },
      event: { 
        message: '',
        details: ''
      }
    }
  ],
  actions: [
    {
      action: 'startNewRecording',
      label: { en: 'Start new recording' }
    },
    {
      action: 'playAudio',
      label: { en: 'Play audio' }
    },
    {
      action: 'pauseAudio',
      label: { en: 'Pause audio' }
    },
    {
      action: 'seekToPosition',
      label: { en: 'Seek to position' },
      args: [
        {
          name: 'percentage',
          type: 'number',
          label: { en: 'Percentage (0-100)' }
        }
      ]
    },
    {
      action: 'setVolumeLevel',
      label: { en: 'Set volume level' },
      args: [
        {
          name: 'volume',
          type: 'number',
          label: { en: 'Volume (0-1)' }
        }
]
}
]
};