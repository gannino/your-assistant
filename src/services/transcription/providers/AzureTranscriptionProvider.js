/**
 * AzureTranscriptionProvider - Microsoft Azure Speech Recognition
 *
 * Uses Microsoft Azure's Cognitive Services Speech SDK for speech recognition.
 * This is the original provider used in Your Assistant.
 */

import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { BaseTranscriptionProvider } from '../BaseTranscriptionProvider';

export class AzureTranscriptionProvider extends BaseTranscriptionProvider {
  constructor() {
    super({});
    this.recognizer = null;
  }

  /**
   * Initialize the Azure provider with configuration
   * @param {Object} config - Configuration object
   * @param {string} config.azureToken - Azure subscription key
   * @param {string} config.azureRegion - Azure region (e.g., 'eastasia', 'westus')
   * @param {string} config.language - Recognition language (default: 'en-US')
   */
  async initialize(config) {
    if (!config.azureToken) {
      throw new Error('Azure token/subscription key is required');
    }

    if (!config.azureRegion) {
      throw new Error('Azure region is required');
    }

    this.config = {
      azureToken: config.azureToken,
      azureRegion: config.azureRegion,
      language: config.language || 'en-US',
      ...config,
    };

    this.initialized = true;
    console.log('[Azure Transcription] Initialized with region:', this.config.azureRegion);
  }

  /**
   * Start continuous speech recognition
   * @param {Function} onResult - Callback(transcript) for each result
   * @param {Function} onError - Callback(error) for errors
   */
  async startRecognition(onResult, onError) {
    if (!this.initialized) {
      throw new Error('Azure provider not initialized. Call initialize() first.');
    }

    if (this.isRecording) {
      console.warn('[Azure Transcription] Already recording');
      return;
    }

    // Check for iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
      console.warn('[Azure Transcription] iOS Safari detected - checking mediaDevices support');
    }

    // Store the microphone stream for cleanup
    this.microphoneStream = null;

    try {
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        this.config.azureToken,
        this.config.azureRegion
      );
      speechConfig.speechRecognitionLanguage = this.config.language;

      let audioConfig;

      // On iOS, check if we can use explicit microphone access
      if (
        isIOS &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function'
      ) {
        console.log('[Azure Transcription] Using explicit microphone access on iOS...');

        try {
          // Get the actual microphone stream - this will trigger the permission prompt
          this.microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 16000,
            },
          });

          console.log(
            '[Azure Transcription] Microphone stream obtained on iOS:',
            this.microphoneStream.id
          );

          // Create AudioConfig from the actual stream
          audioConfig = SpeechSDK.AudioConfig.fromStreamInput(this.microphoneStream);
        } catch (permError) {
          console.error('[Azure Transcription] Failed to get microphone stream on iOS:', permError);
          this.microphoneStream = null;

          let errorMsg = 'Microphone access failed.\n\n';
          if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
            errorMsg +=
              'Microphone permission was denied.\n\n' +
              'Please:\n' +
              '1. Go to Settings > Safari > Microphone\n' +
              '2. Enable microphone access\n' +
              '3. Refresh this page\n' +
              '4. Try again';
          } else if (permError.name === 'NotFoundError') {
            errorMsg += 'No microphone found on this device.';
          } else {
            errorMsg +=
              `Error: ${permError.message}\n\n` +
              'Try:\n' +
              '1. Refresh the page\n' +
              '2. Check Settings > Safari > Microphone\n' +
              '3. Use Whisper provider as alternative';
          }

          const error = new Error(errorMsg);
          if (onError) {
            onError(error);
          }
          throw error;
        }
      } else {
        // On iOS without mediaDevices support, or non-iOS: Use default microphone input
        if (isIOS) {
          console.warn(
            '[Azure Transcription] iOS: navigator.mediaDevices not available, using Azure SDK default'
          );
        }
        audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      }

      this.recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      this.recognizer.recognized = (sender, event) => {
        if (
          SpeechSDK.ResultReason.RecognizedSpeech === event.result.reason &&
          event.result.text.length > 0
        ) {
          onResult(event.result.text);
        } else if (SpeechSDK.ResultReason.NoMatch === event.result.reason) {
          console.log('[Azure Transcription] Speech could not be recognized');
        }
      };

      this.recognizer.canceled = (sender, event) => {
        console.error('[Azure Transcription] Canceled:', event.reason, event.errorDetails);

        // Handle iOS-specific cancellation
        if (isIOS) {
          if (event.errorDetails && event.errorDetails.includes('microphone')) {
            console.error('[Azure Transcription] iOS Safari: Microphone access issue');
            if (onError) {
              onError(
                new Error(
                  'Microphone access error on iOS.\n\n' +
                    'Please check:\n' +
                    '1. Settings > Safari > Microphone is enabled\n' +
                    "2. Make sure you're using HTTPS (required for microphone access)\n" +
                    '3. Refresh the page and try again\n' +
                    '4. Consider using Whisper provider'
                )
              );
            }
            return;
          }

          // Handle case where getUserMedia is not supported
          if (event.errorDetails && event.errorDetails.includes('getUserMedia')) {
            console.error('[Azure Transcription] iOS Safari: getUserMedia not supported');
            if (onError) {
              onError(
                new Error(
                  'iOS Safari microphone access not available.\n\n' +
                    'This is a browser limitation on iOS Safari.\n\n' +
                    'Recommendations:\n' +
                    '1. Use the Whisper provider for best iOS support\n' +
                    '2. Or try accessing via HTTPS on a different browser'
                )
              );
            }
            return;
          }
        }

        if (onError) {
          onError(
            new Error(
              `Recognition canceled: ${event.reason} - ${event.errorDetails || 'No details'}`
            )
          );
        }
      };

      this.recognizer.startContinuousRecognitionAsync(
        () => {
          this.isRecording = true;
          console.log('[Azure Transcription] Started continuous recognition');
          if (isIOS) {
            console.log(
              '[Azure Transcription] iOS Safari: Recognition started',
              this.microphoneStream
                ? `with stream: ${this.microphoneStream.id}`
                : 'using default input'
            );
          }
        },
        err => {
          this.isRecording = false;
          console.error('[Azure Transcription] Start failed:', err);

          // Provide better error message for iOS
          let errorMessage = `Failed to start recognition: ${err}`;
          if (isIOS) {
            errorMessage +=
              '\n\niOS Safari Troubleshooting:\n' +
              '1. Make sure you tapped "Start Session" directly (not through a script)\n' +
              '2. Check Settings > Safari > Microphone is enabled\n' +
              "3. Make sure you're using HTTPS (required for microphone access)\n" +
              '4. Try the Whisper provider for better iOS support';
          }

          if (onError) {
            onError(new Error(errorMessage));
          }
        }
      );
    } catch (error) {
      this.isRecording = false;
      console.error('[Azure Transcription] Error starting recognition:', error);
      throw error;
    }
  }

  /**
   * Stop continuous speech recognition
   */
  async stopRecognition() {
    if (!this.recognizer || !this.isRecording) {
      console.warn('[Azure Transcription] Not recording');
      return;
    }

    return new Promise((resolve, reject) => {
      this.recognizer.stopContinuousRecognitionAsync(
        () => {
          this.isRecording = false;
          console.log('[Azure Transcription] Stopped recognition');

          // Clean up microphone stream on iOS
          if (this.microphoneStream) {
            console.log('[Azure Transcription] Stopping microphone stream');
            this.microphoneStream.getTracks().forEach(track => {
              track.stop();
            });
            this.microphoneStream = null;
          }

          this.recognizer.close();
          this.recognizer = null;
          resolve();
        },
        err => {
          console.error('[Azure Transcription] Stop failed:', err);
          this.isRecording = false;

          // Still try to clean up the stream
          if (this.microphoneStream) {
            this.microphoneStream.getTracks().forEach(track => {
              track.stop();
            });
            this.microphoneStream = null;
          }

          reject(err);
        }
      );
    });
  }

  /**
   * Validate the Azure configuration
   */
  async validateConfig() {
    const errors = [];

    if (!this.config.azureToken) {
      errors.push('Azure token/subscription key is required');
    }

    if (!this.config.azureRegion) {
      errors.push('Azure region is required');
    }

    if (this.config.language && !/^[a-z]{2}-[A-Z]{2}$/.test(this.config.language)) {
      errors.push('Language must be in format: en-US, zh-CN, etc.');
    }

    return {
      valid: errors.length === 0,
      errors,
      diagnostics: {
        region: this.config.azureRegion,
        language: this.config.language,
        hasToken: !!this.config.azureToken,
      },
    };
  }

  /**
   * Check browser support (requires Azure SDK)
   */
  checkBrowserSupport() {
    // Azure SDK works in all modern browsers
    return typeof SpeechSDK !== 'undefined';
  }

  /**
   * Get provider metadata
   */
  getProviderInfo() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    return {
      id: 'azure',
      name: 'Microsoft Azure Speech',
      description: isIOS
        ? 'Azure Cognitive Services Speech Recognition. iOS Safari: Ensure you tap "Start Session" directly to trigger microphone permission prompt.'
        : 'Azure Cognitive Services Speech Recognition (original provider)',
      supportsContinuous: true,
      requiresApiKey: true,
      requiresLocalServer: false,
      browserSupport: 'all',
      iosSupport: 'good',
      documentationUrl: 'https://docs.microsoft.com/azure/cognitive-services/speech-service/',
      configFields: [
        { name: 'azureToken', label: 'Azure Subscription Key', type: 'password', required: true },
        {
          name: 'azureRegion',
          label: 'Region',
          type: 'text',
          required: true,
          placeholder: 'eastasia',
        },
        {
          name: 'language',
          label: 'Language',
          type: 'text',
          required: false,
          placeholder: 'en-US',
        },
      ],
      languageSupport: [
        { code: 'en-US', name: 'English (US)' },
        { code: 'en-GB', name: 'English (UK)' },
        { code: 'zh-CN', name: 'Chinese (Mandarin)' },
        { code: 'es-ES', name: 'Spanish' },
        { code: 'fr-FR', name: 'French' },
        { code: 'de-DE', name: 'German' },
        { code: 'it-IT', name: 'Italian' },
        { code: 'ja-JP', name: 'Japanese' },
        { code: 'ko-KR', name: 'Korean' },
      ],
      troubleshooting: isIOS
        ? [
            'iOS Safari: Make sure to tap "Start Session" button directly',
            "iOS: Go to Settings > Safari > Microphone and ensure it's enabled",
            "iOS: Refresh the page if microphone permission doesn't appear",
            'Check that your Azure subscription key is valid',
            'Verify the region is correct (e.g., eastasia, westus)',
            'Still not working? Try the Whisper provider for better iOS support',
          ]
        : [
            'Ensure your Azure subscription key is valid',
            'Verify the region is correct (e.g., eastasia, westus)',
            'Check browser console for detailed error messages',
            'Make sure microphone access is allowed in browser settings',
            'Try refreshing the page if you get connection errors',
          ],
    };
  }
}
