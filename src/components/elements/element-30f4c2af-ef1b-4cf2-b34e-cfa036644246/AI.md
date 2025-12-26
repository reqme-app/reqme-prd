---
name: audio-recorder
description: A customizable audio recorder with a built-in player for capturing and previewing audio recordings directly in the browser.
keywords: audio, recorder, microphone, voice, recording, player, playback, sound
---

#### Audio Recorder

***Purpose:***
A complete audio recording solution that allows users to capture audio through a microphone and play it back with custom controls, all within the browser.

***Features:***
- Circular recording button with microphone/stop icons and recording time display
- Custom audio player with play/pause, timeline scrubbing, and volume control
- Audio blob storage in WeWeb variables for further processing
- Responsive design that works across all modern browsers

***Properties:***
- initialVolume: number (0-1) - Sets the initial volume level for audio playback
- buttonSize: string - CSS length value for the recording button size
- buttonColor: string - Background color of the recording button
- recordingColor: string - Background color of the recording button when active
- accentColor: string - Color for player controls like the play button and progress bar

***Events:***
- recordingComplete: Triggered when recording is stopped. Payload: { duration: number, size: number }
- play: Triggered when audio playback starts. Payload: { currentTime: number }
- pause: Triggered when audio playback is paused. Payload: { currentTime: number }
- playbackEnded: Triggered when audio playback reaches the end. No payload.
- seek: Triggered when the user changes the playback position. Payload: { currentTime: number }
- volumeChange: Triggered when the volume level changes. Payload: { volume: number }
- error: Triggered when an error occurs. Payload: { message: string, details: string }

***Exposed Actions:***
- `startNewRecording`: Starts a new recording, discarding any previous recording.
- `playAudio`: Plays the current audio recording.
- `pauseAudio`: Pauses the current audio playback.
- `seekToPosition`: Seeks to a specific position in the audio. Args: percentage (0-100)
- `setVolumeLevel`: Sets the volume level. Args: volume (0-1)

***Exposed Variables:***
- audioBlob: The recorded audio as a Blob object. (path: variables['current_element_uid-audioBlob'])
- audioDataUrl: The recorded audio as a Data URL string. (path: variables['current_element_uid-audioDataUrl'])

***Notes:***
- The component uses the MediaRecorder API which requires user permission to access the microphone.
- Audio is recorded in WebM format for maximum browser compatibility.
- The audio player is fully custom-built without relying on the browser's native audio controls.
- For security reasons, recording can only be initiated by a user interaction (click/tap).
- The component handles cleanup of audio resources when unmounted to prevent memory leaks.