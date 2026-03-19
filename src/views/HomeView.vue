<template>
  <div class="homeview-container" :class="{ 'is-mobile': isMobile }">
    <!-- Mobile Header -->
    <div v-if="isMobile" class="mobile-header">
      <div class="header-top">
        <div class="status-indicators">
          <el-tag v-if="state === 'ing'" type="danger" size="small" effect="dark">
            <el-icon><VideoCameraFilled /></el-icon>
            Recording
          </el-tag>
          <el-tag v-if="hasContext" type="success" size="small">
            <el-icon><Document /></el-icon>
            {{ attachmentCount }}
          </el-tag>
          <el-tag v-if="preparedContext" type="success" size="small" effect="dark">
            <el-icon><MagicStick /></el-icon>
            Ready {{ (preparedContext.length / 1000).toFixed(0) }}k
          </el-tag>
          <el-tag v-if="isPreparingContext" type="warning" size="small">
            <el-icon class="is-loading"><Loading /></el-icon>
            Preparing...
          </el-tag>
        </div>
        <MyTimer ref="MyTimerRef" />
      </div>
      <div class="mobile-controls">
        <el-button size="small" :type="isAutoMode ? 'warning' : 'default'" @click="toggleAutoMode">
          <span :class="{ 'auto-pulse': isAutoMode }">⚡</span>
          {{ isAutoMode ? 'Auto ON' : 'Auto' }}
        </el-button>
        <span v-if="autoStatus" class="auto-status">{{ autoStatus }}</span>
        <el-button
          v-if="screenCaptureSupported"
          size="small"
          :loading="isCapturingScreenshot"
          :icon="Camera"
          @click="takeScreenshot"
        />
        <el-tag v-if="screenshotQueue.length > 0" type="info" size="small">
          {{ screenshotQueue.length }} 📷
          <el-button size="small" link @click="clearScreenshots">✕</el-button>
        </el-tag>
      </div>
    </div>

    <!-- Desktop Header -->
    <div v-else class="desktop-header">
      <div class="header-section">
        <div class="status-bar">
          <div v-if="contextAttachments.length > 0" class="attachment-indicator">
            <el-tag
              v-if="contextAttachments.filter(a => a.source === 'pdf').length > 0"
              type="success"
              size="default"
            >
              <el-icon><Document /></el-icon>
              {{ contextAttachments.filter(a => a.source === 'pdf').length }} PDF(s)
            </el-tag>
            <el-tag
              v-if="contextAttachments.filter(a => a.source === 'website').length > 0"
              type="primary"
              size="default"
            >
              <el-icon><Link /></el-icon>
              {{ contextAttachments.filter(a => a.source === 'website').length }} website(s)
            </el-tag>
            <!-- Preparation Status -->
            <el-tag v-if="preparedContext" type="success" size="default" effect="dark">
              <el-icon><MagicStick /></el-icon>
              Context Ready ({{ preparedContext ? (preparedContext.length / 1000).toFixed(1) : 0 }}k
              chars)
            </el-tag>
            <el-tag v-if="isPreparingContext" type="warning" size="default">
              <el-icon class="is-loading"><Loading /></el-icon>
              Preparing...
            </el-tag>
          </div>
          <div v-if="state === 'ing'" class="recording-indicator">
            <el-icon class="recording-dot"><VideoCameraFilled /></el-icon>
            <span>Recording...</span>
          </div>
        </div>
        <div class="header-right">
          <!-- Auto Mode Toggle -->
          <div class="auto-mode-controls">
            <el-button
              size="small"
              :type="isAutoMode ? 'warning' : 'default'"
              @click="toggleAutoMode"
            >
              <span :class="{ 'auto-pulse': isAutoMode }">⚡</span>
              {{ isAutoMode ? 'Auto ON' : 'Auto' }}
            </el-button>
            <span v-if="autoStatus" class="auto-status">{{ autoStatus }}</span>
          </div>

          <!-- Screenshot Queue -->
          <div v-if="screenCaptureSupported" class="screenshot-controls">
            <el-button
              size="small"
              :loading="isCapturingScreenshot"
              :icon="Camera"
              @click="takeScreenshot"
            >
              Screenshot
            </el-button>
            <div v-if="screenshotQueue.length > 0" class="screenshot-thumbnails">
              <div v-for="(img, idx) in screenshotQueue" :key="idx" class="screenshot-thumb">
                <img :src="img" alt="screenshot" />
                <el-button
                  class="thumb-delete"
                  :icon="Close"
                  size="small"
                  circle
                  type="danger"
                  @click="removeScreenshot(idx)"
                />
              </div>
              <el-button size="small" type="danger" plain @click="clearScreenshots"
                >Clear all</el-button
              >
            </div>
          </div>
          <div class="timer-display">
            <MyTimer ref="MyTimerRef" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content" :class="{ 'is-mobile': isMobile }">
      <!-- Mobile: Tab Navigation -->
      <div v-if="isMobile" class="mobile-tabs">
        <div class="tab-item" :class="{ active: activeTab === 'asr' }" @click="activeTab = 'asr'">
          <el-icon><Microphone /></el-icon>
          <span>Speech</span>
        </div>
        <div class="tab-item" :class="{ active: activeTab === 'ai' }" @click="activeTab = 'ai'">
          <el-icon><User /></el-icon>
          <span>AI</span>
        </div>
      </div>

      <!-- Panels Container -->
      <div class="panels-wrapper">
        <div class="panels-container">
          <!-- Left Panel: Speech Recognition -->
          <div
            class="content-panel asr-panel"
            :class="{
              'is-mobile': isMobile,
              'is-active': isMobile ? activeTab === 'asr' : true,
              'is-hidden': isMobile && activeTab !== 'asr',
            }"
          >
            <div class="panel-header">
              <div class="panel-title">
                <el-icon :size="isMobile ? 18 : 20"><Microphone /></el-icon>
                <span>{{ isMobile ? 'Speech' : 'Speech Recognition' }}</span>
              </div>
              <!-- Desktop: Clear button -->
              <el-button
                v-if="currentText && !isMobile"
                :icon="Delete"
                type="danger"
                size="default"
                @click="clearASRContent"
              >
                Clear Text
              </el-button>
              <!-- Mobile: Clear button in header actions -->
              <div v-if="isMobile" class="panel-actions">
                <el-button
                  v-if="currentText"
                  :icon="Delete"
                  type="danger"
                  size="small"
                  circle
                  @click="clearASRContent"
                >
                </el-button>
              </div>
            </div>

            <div ref="asrResponseContainer" class="panel-content" @scroll="onAsrContainerScroll">
              <div v-if="!currentText" class="empty-state">
                <el-icon :size="isMobile ? 64 : 48" color="#c0c4cc">
                  <Microphone />
                </el-icon>
                <p>{{ isMobile ? 'Tap Start and begin speaking' : 'No speech detected yet' }}</p>
                <p class="hint">
                  {{
                    isMobile ? 'Your speech will appear here' : 'Start copilot and begin speaking'
                  }}
                </p>
              </div>
              <div v-else class="text-content">{{ currentText }}</div>
            </div>

            <!-- Desktop: Chat Input + Ask AI Button -->
            <div v-if="!isMobile" class="panel-footer">
              <div class="chat-input-row">
                <el-input
                  v-model="chatInput"
                  placeholder="Add a message to include with your question..."
                  clearable
                  @keydown.enter.prevent="submitChatInput"
                />
                <el-button
                  type="primary"
                  :icon="Select"
                  :disabled="!currentText && !chatInput"
                  size="large"
                  @click="submitChatInput"
                >
                  Ask AI
                </el-button>
              </div>
            </div>
          </div>

          <!-- Right Panel: AI Response -->
          <div
            class="content-panel ai-panel"
            :class="{
              'is-mobile': isMobile,
              'is-active': isMobile ? activeTab === 'ai' : true,
              'is-hidden': isMobile && activeTab !== 'ai',
            }"
          >
            <div class="panel-header">
              <div class="panel-title">
                <el-icon :size="isMobile ? 18 : 20"><User /></el-icon>
                <span>AI Response</span>
              </div>
              <div class="panel-actions">
                <!-- Mobile: Copy, Summarize, History and Clear buttons in header -->
                <template v-if="isMobile && ai_result">
                  <el-button :icon="DocumentCopy" size="small" circle @click="copyAIResponse" />
                  <el-button
                    :icon="Memo"
                    size="small"
                    circle
                    :loading="isSummarizingSession"
                    @click="summarizeSession"
                  />
                  <el-button
                    v-if="sessionSummary"
                    :icon="View"
                    size="small"
                    circle
                    @click="showSessionSummary = true"
                  />
                  <el-button
                    v-if="conversationHistory"
                    :icon="Clock"
                    size="small"
                    circle
                    @click="showHistory = true"
                  />
                  <el-button
                    :icon="Delete"
                    type="danger"
                    size="small"
                    circle
                    @click="clearAIResponse"
                  />
                </template>
                <!-- Desktop: Copy, Summarize, History and Clear buttons -->
                <template v-if="!isMobile">
                  <el-button
                    v-if="ai_result"
                    :icon="DocumentCopy"
                    size="default"
                    @click="copyAIResponse"
                  >
                    Copy
                  </el-button>
                  <el-button
                    v-if="currentText || ai_result"
                    :icon="Memo"
                    size="default"
                    :loading="isSummarizingSession"
                    @click="summarizeSession"
                  >
                    Summarize Session
                  </el-button>
                  <el-button
                    v-if="sessionSummary"
                    :icon="View"
                    size="default"
                    @click="showSessionSummary = true"
                  >
                    View Summary
                  </el-button>
                  <el-button
                    v-if="conversationHistory"
                    :icon="Clock"
                    size="default"
                    @click="showHistory = true"
                  >
                    History
                  </el-button>
                  <el-button
                    v-if="ai_result"
                    :icon="Delete"
                    type="danger"
                    size="default"
                    @click="clearAIResponse"
                  >
                    Clear
                  </el-button>
                </template>
              </div>
            </div>

            <div ref="aiResponseContainer" class="panel-content" @scroll="onContainerScroll">
              <div v-if="show_ai_thinking_effect && !ai_result" class="loading-state">
                <el-icon class="is-loading" :size="32" color="#409eff"><Loading /></el-icon>
                <p>AI is thinking...</p>
              </div>
              <div v-else-if="!ai_result" class="empty-state">
                <el-icon :size="isMobile ? 64 : 48" color="#c0c4cc">
                  <User />
                </el-icon>
                <p>
                  {{ isMobile ? 'AI response will appear here' : 'AI response will appear here' }}
                </p>
                <p class="hint">
                  {{ isMobile ? 'Ask a question to get started' : 'Ask a question to get started' }}
                </p>
              </div>
              <div v-else class="text-content markdown-content">
                <span v-html="renderedAIResult"></span
                ><span v-if="streamingState.isActive" class="streaming-cursor"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop: Bottom Action Bar -->
    <div v-if="!isMobile" class="desktop-action-bar">
      <el-button
        v-show="state === 'end'"
        type="success"
        :loading="copilot_starting"
        :disabled="copilot_starting || isPreparingContext"
        size="large"
        @click.prevent="startCopilot"
      >
        <el-icon><VideoPlay /></el-icon>
        Start Session
      </el-button>
      <el-button
        v-show="state === 'ing'"
        type="danger"
        :loading="copilot_stopping"
        size="large"
        @click="userStopCopilot"
      >
        <el-icon><VideoPause /></el-icon>
        Stop Recording
      </el-button>
    </div>

    <!-- Mobile: Bottom Action Bar (Fixed) -->
    <div v-if="isMobile" class="mobile-action-bar">
      <el-button
        v-show="state === 'end'"
        type="success"
        :loading="copilot_starting"
        :disabled="copilot_starting || isPreparingContext"
        size="large"
        block
        @click.prevent="startCopilot"
      >
        <el-icon><VideoPlay /></el-icon>
        Start Session
      </el-button>
      <el-button
        v-show="state === 'ing'"
        type="danger"
        :loading="copilot_stopping"
        size="large"
        block
        @click="userStopCopilot"
      >
        <el-icon><VideoPause /></el-icon>
        Stop Recording
      </el-button>
      <!-- Ask AI Button (show on both tabs when there is text) -->
      <div class="chat-input-row">
        <el-input
          v-model="chatInput"
          placeholder="Add a message..."
          clearable
          size="large"
          @keydown.enter.prevent="submitChatInput"
        />
        <el-button
          v-if="currentText || chatInput"
          type="primary"
          size="large"
          @click="submitChatInput"
        >
          <el-icon><Select /></el-icon>
          Ask AI
        </el-button>
      </div>
    </div>

    <!-- Conversation History Dialog -->
    <el-dialog
      v-model="showHistory"
      title="🕐 Conversation History"
      width="560px"
      :fullscreen="isMobile"
    >
      <div v-if="conversationHistory" class="history-content">
        <p class="history-hint">Compacted summary of all Q&amp;A exchanges this session.</p>
        <div class="history-body">{{ conversationHistory }}</div>
      </div>
      <el-empty v-else description="No history yet — history builds after each AI response" />
      <template #footer>
        <el-button @click="showHistory = false">Close</el-button>
        <el-button
          v-if="conversationHistory"
          type="danger"
          plain
          @click="
            conversationHistory = null;
            showHistory = false;
          "
        >
          Clear History
        </el-button>
      </template>
    </el-dialog>

    <!-- Session Summary Dialog -->
    <el-dialog
      v-model="showSessionSummary"
      title="📋 Session Summary"
      width="700px"
      :fullscreen="isMobile"
    >
      <div v-if="sessionSummary" class="summary-content">
        <p class="summary-hint">Concise recap of key topics, AI responses, and action items.</p>
        <div class="summary-body" v-html="renderMarkdown(sessionSummary)"></div>
      </div>
      <el-empty v-else description="No summary yet — click 'Summarize Session' to generate one" />
      <template #footer>
        <el-button @click="showSessionSummary = false">Close</el-button>
        <el-button v-if="sessionSummary" type="primary" @click="copySessionSummary">
          Copy Summary
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Microphone,
  Delete,
  Select,
  User,
  Document,
  Link,
  VideoCameraFilled,
  VideoPlay,
  VideoPause,
  DocumentCopy,
  Loading,
  MagicStick,
  Camera,
  Close,
  Memo,
  Clock,
  View,
} from '@element-plus/icons-vue';
import MyTimer from '@/components/MyTimer.vue';
import { providerRegistry } from '../services/ai/providerRegistry';
import { transcriptionRegistry } from '../services/transcription/transcriptionRegistry';
import config_util from '../utils/config_util';
import { useMobile } from '../composables/useMobile';
import { renderMarkdown } from '../utils/markdown_util';
import {
  captureScreenshot,
  stopScreenCapture,
  isScreenCaptureSupported,
} from '../utils/screenshot_util';
import { useAutoMode, startAutoMode, stopAutoMode } from '../composables/useAutoMode';

// Mobile detection
const { isMobile } = useMobile();

// Mobile tab state
const activeTab = ref('asr');

// Reactive state
const currentText = ref('');
const state = ref('end'); // end\ing
const ai_result = ref(null);
const copilot_starting = ref(false); // 显示loading
const copilot_stopping = ref(false);
const show_ai_thinking_effect = ref(false);
const transcriptionProvider = ref(null);
const aiResponseContainer = ref(null); // Reference to AI response container for auto-scrolling
const asrResponseContainer = ref(null); // Reference to ASR response container for auto-scrolling
const responseCount = ref(0); // Track number of AI responses for better formatting
const hasStartedResponse = ref(false); // Track if we've started a response (to avoid duplicate separators)
const currentQuestion = ref(''); // Track the current question being asked

// Context attachments (session-only, in-memory)
const contextAttachments = ref([]); // Array of { name, markdown, source: 'pdf' | 'website', url?, size? }

// Screenshot queue for vision AI (session-only, max 5)
const screenshotQueue = ref([]); // Array of base64 PNG data URLs
const MAX_SCREENSHOTS = 5;
const isCapturingScreenshot = ref(false);
const screenCaptureSupported = isScreenCaptureSupported();

// Chat input for appending user messages to the AI question
const chatInput = ref('');

// Session summarization
const isSummarizingSession = ref(false);
const sessionSummary = ref(null); // Store the session summary separately
const showSessionSummary = ref(false); // Control summary dialog visibility

// History dialog
const showHistory = ref(false);

// Auto mode
const { isAutoMode, autoStatus } = useAutoMode();
const isRecordingComputed = computed(() => state.value === 'ing');

const toggleAutoMode = () => {
  if (isAutoMode.value) {
    stopAutoMode();
  } else {
    startAutoMode({
      askFn: askCurrentText,
      addScreenshotFn: dataUrl => {
        screenshotQueue.value.push(dataUrl);
        if (screenshotQueue.value.length > MAX_SCREENSHOTS) screenshotQueue.value.shift();
      },
      isRecordingRef: isRecordingComputed,
      transcriptRef: currentText,
    });
  }
};

// Rolling compacted conversation history (session-only)
const conversationHistory = ref(null); // string | null

// Track processed transcript position for incremental AI responses
const lastProcessedPosition = ref(0); // Position in currentText that was last sent to AI
const lastAIResponseLength = ref(0); // Track response length for history management

// Context preparation state (managed by ContentSettings.vue, but status shown here)
const isPreparingContext = ref(false); // Preparing context
const preparedContext = ref(null); // Pre-summarized context

// Max chars of context to send per request
// Modern AI models (GPT-4, Claude, GLM-4) can handle 100k+ tokens efficiently
// Desktop: 100k chars (~25k tokens) - optimal for powerful models
// Mobile: 50k chars (~12.5k tokens) - conservative for mobile performance
const MAX_CONTEXT_CHARS = 100000;

// Memory management limits to prevent browser performance issues
const MAX_TRANSCRIPTION_LENGTH = 15000; // Max transcription text to accumulate
const MAX_AI_RESPONSE_LENGTH = 50000; // Max AI response length
const TRUNCATION_MESSAGE =
  '\n\n[Content truncated due to length. Please ask follow-up questions for more details.]';

// Mobile-specific optimizations
const MOBILE_MAX_TRANSCRIPTION_LENGTH = 10000; // Reduce for mobile
const MOBILE_MAX_AI_RESPONSE_LENGTH = 30000; // Reduce for mobile
const MOBILE_CONTEXT_LIMIT = 50000; // Mobile context limit (still plenty powerful)

// Mobile session persistence
const MOBILE_SESSION_KEY = 'your_assistant_session';
const SESSION_SAVE_INTERVAL = 5000; // Save every 5 seconds on mobile

/**
 * Save mobile session state
 */
const saveMobileSession = () => {
  if (!isMobile.value) return;

  try {
    const session = {
      currentText: currentText.value,
      aiResult: ai_result.value,
      conversationHistory: conversationHistory.value,
      sessionSummary: sessionSummary.value,
      timestamp: Date.now(),
      state: state.value,
    };
    localStorage.setItem(MOBILE_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('[Mobile] Failed to save session:', e.message);
  }
};

/**
 * Load mobile session state
 * Fixed to prevent auto-activation on iOS
 */
const loadMobileSession = () => {
  if (!isMobile.value) return false;

  try {
    const saved = localStorage.getItem(MOBILE_SESSION_KEY);
    if (!saved) return false;

    const session = JSON.parse(saved);

    // Only restore if session is recent (within 1 hour)
    const sessionAge = Date.now() - session.timestamp;
    if (sessionAge > 3600000) {
      // 1 hour
      localStorage.removeItem(MOBILE_SESSION_KEY);
      return false;
    }

    // Restore session state but prevent auto-activation
    // Always set state to 'end' on page load to prevent auto-starting sessions
    if (session.currentText) currentText.value = session.currentText;
    if (session.aiResult) ai_result.value = session.aiResult;
    if (session.conversationHistory) conversationHistory.value = session.conversationHistory;
    if (session.sessionSummary) sessionSummary.value = session.sessionSummary;

    // IMPORTANT: Always reset to 'end' state to prevent auto-activation on iOS
    // Users must manually tap "Start Session" to begin
    state.value = 'end';

    console.log('[Mobile] Session restored from', new Date(session.timestamp).toLocaleTimeString());
    console.log('[Mobile] State reset to "end" to prevent auto-activation');
    return true;
  } catch (error) {
    console.error('[Mobile] Failed to load session:', error.message);
    return false;
  }
};

// Mobile session auto-save interval
let mobileSessionInterval = null;

/**
 * Start mobile session persistence
 */
const startMobileSessionPersistence = () => {
  if (!isMobile.value || mobileSessionInterval) return;

  mobileSessionInterval = setInterval(() => {
    if (state.value === 'ing') {
      // Only save during active session
      saveMobileSession();
    }
  }, SESSION_SAVE_INTERVAL);

  console.log('[Mobile] Session persistence started');
};

/**
 * Stop mobile session persistence
 */
const stopMobileSessionPersistence = () => {
  if (mobileSessionInterval) {
    clearInterval(mobileSessionInterval);
    mobileSessionInterval = null;
    console.log('[Mobile] Session persistence stopped');
  }
};

// Streaming recovery state
const streamingState = ref({
  isActive: false,
  lastChunkTime: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 2,
});

/**
 * Get platform-specific limits
 * @returns {Object} Platform-specific limits
 */
const getPlatformLimits = () => {
  return {
    maxTranscription: isMobile.value ? MOBILE_MAX_TRANSCRIPTION_LENGTH : MAX_TRANSCRIPTION_LENGTH,
    maxAIResponse: isMobile.value ? MOBILE_MAX_AI_RESPONSE_LENGTH : MAX_AI_RESPONSE_LENGTH,
    maxContext: isMobile.value ? MOBILE_CONTEXT_LIMIT : MAX_CONTEXT_CHARS,
  };
};

/**
 * Enhanced streaming with recovery support
 * @param {Function} streamFn - Streaming function to execute
 * @param {Function} onChunk - Chunk callback
 * @param {Function} onError - Error callback
 * @param {Function} onComplete - Completion callback
 */
const executeWithStreamingRecovery = async (streamFn, onChunk, onError, onComplete) => {
  streamingState.value.isActive = true;
  streamingState.value.reconnectAttempts = 0;

  const attemptStream = async () => {
    try {
      await streamFn(chunk => {
        streamingState.value.lastChunkTime = Date.now();
        onChunk(chunk);
      });

      streamingState.value.isActive = false;
      if (onComplete) onComplete();
    } catch (error) {
      console.error('[Streaming] Error:', error);

      // Check if we should attempt reconnection
      if (streamingState.value.reconnectAttempts < streamingState.value.maxReconnectAttempts) {
        streamingState.value.reconnectAttempts++;
        console.log(`[Streaming] Reconnection attempt ${streamingState.value.reconnectAttempts}`);

        // Wait before reconnect
        await new Promise(resolve =>
          setTimeout(resolve, 1000 * streamingState.value.reconnectAttempts)
        );
        await attemptStream();
      } else {
        streamingState.value.isActive = false;
        if (onError) onError(error);
      }
    }
  };

  // Monitor for stale streams (no chunks for 30 seconds)
  const staleMonitor = setInterval(() => {
    if (streamingState.value.isActive && streamingState.value.lastChunkTime) {
      const timeSinceLastChunk = Date.now() - streamingState.value.lastChunkTime;
      if (timeSinceLastChunk > 30000) {
        // 30 seconds
        console.warn('[Streaming] No chunks received for 30s, may be stale');
      }
    }
  }, 10000); // Check every 10 seconds

  try {
    await attemptStream();
  } finally {
    clearInterval(staleMonitor);
    streamingState.value.isActive = false;
  }
};

/**
 * Safely update currentText with length limit (platform-specific)
 * @param {string} newText - New text to append
 */
const updateCurrentText = newText => {
  const limits = getPlatformLimits();

  if (!currentText.value) {
    currentText.value = newText;
    return;
  }

  const combined = currentText.value + '\n' + newText;
  if (combined.length > limits.maxTranscription) {
    // Keep the most recent transcription
    const truncateAmount = combined.length - limits.maxTranscription;
    const truncated = combined.slice(truncateAmount);
    currentText.value = truncated;

    // Show a subtle indicator that text was truncated
    console.warn(`[Transcription] Truncated ${truncateAmount} chars to prevent memory issues`);
  } else {
    currentText.value = combined;
  }
};

/**
 * Format response separator with question, timestamp and response number
 * @returns {string}
 */
const formatResponseSeparator = () => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  responseCount.value++;

  // Get the question text, truncate if too long
  let questionText = currentQuestion.value || 'Question';
  if (questionText.length > 60) {
    questionText = questionText.substring(0, 57) + '...';
  }

  // Clean up the question text for display (remove extra whitespace)
  questionText = questionText.trim().replace(/\s+/g, ' ');

  const separator = `\n\n---\n\n### 📝 ${questionText}\n\n**Response ${responseCount.value} • ${timeStr}**\n\n`;
  console.log(`[Response Separator] Creating "${separator.trim()}"`);
  return separator;
};

/**
 * Safely update ai_result with length limit (platform-specific)
 * @param {string} newContent - New content to append
 * @param {boolean} forceNewResponse - Force creating a new response with separator
 */
const updateAIResult = (newContent, forceNewResponse = false) => {
  const limits = getPlatformLimits();

  // Check if this should be a new response
  const shouldCreateNewResponse = !ai_result.value || !hasStartedResponse.value || forceNewResponse;

  console.log(`[AI Result] Update called:`, {
    hasExistingResult: !!ai_result.value,
    hasStartedResponse: hasStartedResponse.value,
    forceNewResponse,
    shouldCreateNewResponse,
    contentLength: newContent?.length || 0,
  });

  if (shouldCreateNewResponse) {
    // First response or explicitly requested new response
    if (!ai_result.value) {
      responseCount.value = 0; // Reset counter for first response
      console.log(`[AI Result] Starting fresh - response count reset to 0`);
    }

    const separator = formatResponseSeparator();
    ai_result.value = (ai_result.value || '') + separator + newContent;
    hasStartedResponse.value = true;

    console.log(
      `[AI Result] ✅ New response created. Total length: ${ai_result.value.length} chars`
    );
    return;
  }

  // Streaming - append content without separator
  const combined = ai_result.value + newContent;
  if (combined.length > limits.maxAIResponse) {
    // Stop appending if we've hit the limit
    ai_result.value = combined + TRUNCATION_MESSAGE;
    console.warn(`[AI Response] Truncated to prevent memory issues`);
  } else {
    ai_result.value = combined;
  }

  console.log(`[AI Result] 📝 Appended content. Total length: ${ai_result.value.length} chars`);
};

/**
 * Build the base system prompt with high-level behavioral instructions only.
 * Context documents and history are now included in the user message for better balance.
 * @returns {string|null}
 */
const buildBasePrompt = () => {
  const base = config_util.gpt_system_prompt();
  return base || null;
};

/**
 * Build the formatted context text from attachments (platform-specific).
 * Uses pre-prepared context if available, otherwise summarizes on-demand.
 * @returns {Promise<string>}
 */
const buildContextText = async () => {
  if (contextAttachments.value.length === 0) {
    console.log('[Context] No attachments found');
    return '';
  }

  // Use pre-prepared context if available (instant responses)
  if (preparedContext.value) {
    console.log('[Context] Using pre-prepared context - instant response!');
    console.log(`[Context] Prepared context length: ${preparedContext.value.length} chars`);
    return preparedContext.value;
  }

  // Fallback to on-demand summarization (slower but works)
  console.log('[Context] No prepared context, using on-demand summarization');
  return await buildContextTextOnDemand();
};

/**
 * Build context text on-demand (when pre-prepared context is not available).
 * This is slower but provides a fallback.
 * @returns {Promise<string>}
 */
const buildContextTextOnDemand = async () => {
  const limits = getPlatformLimits();

  // First, try using raw content
  let rawContextText = contextAttachments.value
    .map(att => {
      const label = att.source === 'website' ? `Website: ${att.name}` : `Document: ${att.name}`;
      return `## ${label}\n\n${att.markdown}`;
    })
    .join('\n\n---\n\n');

  console.log(`[Context] Building context from ${contextAttachments.value.length} attachment(s)`);
  console.log(`[Context] Original context length: ${rawContextText.length} chars`);
  console.log(`[Context] Platform: ${isMobile.value ? 'Mobile' : 'Desktop'}`);
  console.log(`[Context] Context limit: ${limits.maxContext} chars`);

  // If within limit, return raw content
  if (rawContextText.length <= limits.maxContext) {
    console.log(`[Context] Context fits within limit, using raw content`);
    return rawContextText;
  }

  // Context exceeds limit - need to summarize
  console.log(
    `[Context] Context exceeds limit by ${rawContextText.length - limits.maxContext} chars, will summarize`
  );
  return await summarizeContextAttachments(contextAttachments.value, limits.maxContext);
};

/**
 * Summarize context attachments when they exceed the context limit.
 * This ensures the AI has access to key information from all sources.
 * @param {Array} attachments - Array of context attachments
 * @param {number} maxLength - Maximum allowed length
 * @returns {Promise<string>} Summarized context text
 */
const summarizeContextAttachments = async (attachments, maxLength) => {
  console.log('[Context Summary] Starting summarization process...');

  try {
    // Get AI provider for summarization
    const providerId = config_util.ai_provider();
    const provider = providerRegistry.get(providerId);

    if (!provider) {
      console.warn('[Context Summary] No provider available, using truncation fallback');
      return truncateContextSimple(attachments, maxLength);
    }

    // Calculate target lengths for each attachment
    const avgLengthPerAttachment = Math.floor(maxLength / attachments.length);
    const summaries = [];

    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      const label = att.source === 'website' ? `Website: ${att.name}` : `Document: ${att.name}`;

      // If individual attachment is already small enough, keep it
      if (att.markdown.length <= avgLengthPerAttachment) {
        summaries.push(`## ${label}\n\n${att.markdown}`);
        console.log(
          `[Context Summary] Attachment ${i + 1} (${att.name}): ${att.markdown.length} chars, kept as-is`
        );
        continue;
      }

      // Need to summarize this attachment
      console.log(
        `[Context Summary] Attachment ${i + 1} (${att.name}): ${att.markdown.length} chars, summarizing...`
      );

      try {
        const summary = await summarizeSingleAttachment(att, provider, avgLengthPerAttachment);
        summaries.push(`## ${label} (Summary)\n\n${summary}`);
        console.log(`[Context Summary] Attachment ${i + 1} summarized to ${summary.length} chars`);
      } catch (error) {
        console.error(`[Context Summary] Failed to summarize attachment ${i + 1}:`, error.message);
        // Fallback to truncation for this attachment
        const truncated = att.markdown.slice(0, avgLengthPerAttachment) + '\n\n[Content truncated]';
        summaries.push(`## ${label}\n\n${truncated}`);
      }
    }

    const result = summaries.join('\n\n---\n\n');
    console.log(`[Context Summary] Final summarized context: ${result.length} chars`);
    return result;
  } catch (error) {
    console.error('[Context Summary] Summarization failed:', error.message);
    console.log('[Context Summary] Falling back to simple truncation');
    return truncateContextSimple(attachments, maxLength);
  }
};

/**
 * Summarize a single attachment using the AI.
 * @param {Object} attachment - The attachment to summarize
 * @param {Object} provider - The AI provider to use
 * @param {number} targetLength - Target length for the summary
 * @returns {Promise<string>} Summarized content
 */
const summarizeSingleAttachment = async (attachment, provider, targetLength) => {
  const sourceType = attachment.source === 'website' ? 'website' : 'document';
  const prompt =
    `Please summarize the following ${sourceType} content "${attachment.name}" in ${Math.floor(targetLength * 0.8)}-${targetLength} words. ` +
    `Focus on the key information, main points, and any specific details that would be important for an assistant session context. ` +
    `Keep the summary structured and easy to read.\n\n` +
    `Content to summarize:\n${attachment.markdown}`;

  try {
    const config = getProviderConfig(config_util.ai_provider());
    await provider.initialize(config);

    // Use non-streaming for summarization to get complete result
    const summary = await provider.generateCompletion(prompt, {
      temperature: config.temperature,
      max_tokens: Math.ceil(targetLength * 1.5), // Allow some buffer
    });

    return summary.trim();
  } catch (error) {
    console.error('[Context Summary] AI summarization failed:', error.message);
    throw error;
  }
};

/**
 * Simple fallback truncation when summarization fails.
 * @param {Array} attachments - Array of context attachments
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Truncated context text
 */
const truncateContextSimple = (attachments, maxLength) => {
  let result = '';
  let remainingLength = maxLength;

  for (const att of attachments) {
    const label = att.source === 'website' ? `Website: ${att.name}` : `Document: ${att.name}`;
    const header = `## ${label}\n\n`;

    if (remainingLength <= header.length + 100) {
      // Not enough space left, skip this attachment
      break;
    }

    const availableSpace = remainingLength - header.length;
    const content = att.markdown.slice(0, availableSpace);

    result += header + content + '\n\n[Content truncated due to length]\n\n---\n\n';
    remainingLength -= (header + content).length;
  }

  console.log(`[Context] Used simple truncation, final length: ${result.length} chars`);
  return result.trim();
};

/**
 * Build the user message by combining the question with context and history.
 * This approach provides better balance and allows the model to treat context as reference material.
 * @param {string} question - The user's question or transcription
 * @returns {Promise<string>}
 */
const buildUserMessage = async question => {
  const parts = [];

  // Add the question first
  parts.push(question);

  // Add context documents if available (now async for summarization)
  const contextText = await buildContextText();
  if (contextText) {
    parts.push(`\n\n---\n\n## Reference Materials\n\n${contextText}`);
  }

  // Add conversation history if available
  if (conversationHistory.value) {
    parts.push(`\n\n---\n\n## Previous Conversation\n\n${conversationHistory.value}`);
  }

  const finalMessage = parts.join('');
  console.log(`[User Message] Total length: ${finalMessage.length} chars`);
  console.log(`[User Message] Question: ${question.length} chars`);
  console.log(`[User Message] Context: ${contextText.length} chars`);
  console.log(
    `[User Message] History: ${conversationHistory.value ? conversationHistory.value.length : 0} chars`
  );

  return finalMessage;
};

/**
 * Fire-and-forget: summarize the latest Q&A exchange into the rolling history.
 * Uses the same provider the user has selected.
 * @param {string} question - The user's question
 * @param {string} answer - The AI's full response
 */
const compactHistory = async (question, answer) => {
  const providerId = config_util.ai_provider();
  const provider = providerRegistry.get(providerId);
  if (!provider) {
    console.warn('[History] No provider available for compaction');
    return;
  }

  const config = getProviderConfig(providerId);
  const previous = conversationHistory.value
    ? `Previous summary:\n${conversationHistory.value}\n\n`
    : '';

  const compactionPrompt =
    `${previous}New exchange to add:\nQ: ${question}\nA: ${answer}\n\n` +
    `Produce a concise bullet-point summary of ALL Q&A exchanges so far (including previous summary if present). ` +
    `Each bullet: "• [topic]: [one-sentence recap]". ` +
    `Only include facts explicitly stated in the exchanges. Do not infer or add details not present. ` +
    `No preamble, no extra commentary.`;

  try {
    await provider.initialize(config);

    // Try streaming compaction first
    let summary = '';
    try {
      await provider.generateCompletionStream(compactionPrompt, chunk => {
        summary += chunk;
      });
      if (summary.trim()) {
        conversationHistory.value = summary.trim();
        console.log('[History] Compaction successful');
      }
    } catch (streamError) {
      // Fallback to non-streaming if streaming fails
      console.warn(
        '[History] Streaming compaction failed, trying non-streaming:',
        streamError.message
      );
      summary = await provider.generateCompletion(compactionPrompt);
      if (summary.trim()) {
        conversationHistory.value = summary.trim();
        console.log('[History] Non-streaming compaction successful');
      }
    }
  } catch (e) {
    console.error('[History] Compaction failed completely:', e.message);

    // Fallback: Simple concatenation if AI compaction fails
    const fallbackEntry = `• Q: ${question.slice(0, 100)}${question.length > 100 ? '...' : ''}\n  A: ${answer.slice(0, 200)}${answer.length > 200 ? '...' : ''}`;

    if (conversationHistory.value) {
      conversationHistory.value = conversationHistory.value + '\n' + fallbackEntry;
    } else {
      conversationHistory.value = fallbackEntry;
    }

    console.warn('[History] Using fallback simple compaction');
  }
};

// Template ref for MyTimer
const MyTimerRef = ref(null);

// Computed properties
const isDevMode = computed(() => {
  return process.env.NODE_ENV === 'development';
});

const hasContext = computed(() => {
  return contextAttachments.value.length > 0;
});

const attachmentCount = computed(() => {
  const pdfCount = contextAttachments.value.filter(a => a.source === 'pdf').length;
  const websiteCount = contextAttachments.value.filter(a => a.source === 'website').length;
  const parts = [];
  if (pdfCount > 0) parts.push(`${pdfCount} PDF${pdfCount > 1 ? 's' : ''}`);
  if (websiteCount > 0) parts.push(`${websiteCount} site${websiteCount > 1 ? 's' : ''}`);
  return parts.join(' + ');
});

const renderedAIResult = computed(() => {
  return ai_result.value ? renderMarkdown(ai_result.value) : '';
});

// Watch for preparedContext changes to help debug
watch(
  preparedContext,
  (newVal, oldVal) => {
    console.log('[HomeView] preparedContext changed:', {
      hadValue: !!oldVal,
      hasValue: !!newVal,
      length: newVal?.length || 0,
    });
  },
  { immediate: true }
);

// ── Auto-scroll with readable pacing ──────────────────────────────────────
const userScrolledUp = ref(false);
let scrollRafId = null;
const SCROLL_SPEED = computed(() => config_util.scroll_speed());
let lastScrollTime = null;

function startSmoothScroll() {
  if (scrollRafId) return;

  function step(timestamp) {
    const el = aiResponseContainer.value;
    if (!el || userScrolledUp.value) {
      scrollRafId = null;
      lastScrollTime = null;
      return;
    }

    if (lastScrollTime === null) lastScrollTime = timestamp;
    const delta = ((timestamp - lastScrollTime) / 1000) * SCROLL_SPEED.value;
    lastScrollTime = timestamp;

    const target = el.scrollHeight - el.clientHeight;
    const remaining = target - el.scrollTop;

    if (remaining <= 1) {
      // Already at bottom — idle until next content arrives
      scrollRafId = null;
      lastScrollTime = null;
      return;
    }

    el.scrollTop = Math.min(el.scrollTop + delta, target);
    scrollRafId = requestAnimationFrame(step);
  }

  scrollRafId = requestAnimationFrame(step);
}

function onContainerScroll() {
  const el = aiResponseContainer.value;
  if (!el) return;
  const distanceFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
  // If user scrolled more than 80px from bottom, consider it intentional
  userScrolledUp.value = distanceFromBottom > 80;
}

// ── Speech panel auto-scroll ─────────────────────────────────────────────────
const userScrolledUpAsr = ref(false);
let asrScrollRafId = null;
let lastAsrScrollTime = null;

function startAsrSmoothScroll() {
  if (asrScrollRafId) return;

  function step(timestamp) {
    const el = asrResponseContainer.value;
    if (!el || userScrolledUpAsr.value) {
      asrScrollRafId = null;
      lastAsrScrollTime = null;
      return;
    }

    if (lastAsrScrollTime === null) lastAsrScrollTime = timestamp;
    const delta = ((timestamp - lastAsrScrollTime) / 1000) * SCROLL_SPEED.value;
    lastAsrScrollTime = timestamp;

    const target = el.scrollHeight - el.clientHeight;
    const remaining = target - el.scrollTop;

    if (remaining <= 1) {
      // Already at bottom — idle until next content arrives
      asrScrollRafId = null;
      lastAsrScrollTime = null;
      return;
    }

    el.scrollTop = Math.min(el.scrollTop + delta, target);
    asrScrollRafId = requestAnimationFrame(step);
  }

  asrScrollRafId = requestAnimationFrame(step);
}

function onAsrContainerScroll() {
  const el = asrResponseContainer.value;
  if (!el) return;
  const distanceFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
  // If user scrolled more than 80px from bottom, consider it intentional
  userScrolledUpAsr.value = distanceFromBottom > 80;
}

watch(
  () => ai_result.value,
  async () => {
    await nextTick();
    if (!userScrolledUp.value) startSmoothScroll();
  }
);

// Reset user-scroll flag when a new response starts
watch(
  () => streamingState.value.isActive,
  active => {
    if (active) {
      userScrolledUp.value = false;
      startSmoothScroll();
    }
  }
);

// Auto-scroll speech panel when new text arrives
watch(
  () => currentText.value,
  async () => {
    await nextTick();
    if (!userScrolledUpAsr.value) startAsrSmoothScroll();
  }
);

// Lifecycle hooks
onMounted(() => {
  console.log('mounted');

  // Load previously prepared context if available
  const savedData = localStorage.getItem('prepared_context');
  console.log('[Context Prep] Checking for prepared context in localStorage...');
  console.log('[Context Prep] Found data:', !!savedData);

  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      preparedContext.value = parsed.context;
      console.log('[Context Prep] ✅ Successfully loaded prepared context!');
      console.log('[Context Prep] Context length:', preparedContext.value?.length || 0, 'chars');
      console.log('[Context Prep] preparedContext.value:', !!preparedContext.value);
    } catch (e) {
      console.error('[Context Prep] ❌ Failed to load cached context:', e);
    }
  } else {
    console.log('[Context Prep] No prepared context found in localStorage');
  }

  // Load all context attachments (PDFs + websites)
  const storedAttachments = localStorage.getItem('context_attachments');
  if (storedAttachments) {
    try {
      contextAttachments.value = JSON.parse(storedAttachments);
      const pdfCount = contextAttachments.value.filter(a => a.source === 'pdf').length;
      const siteCount = contextAttachments.value.filter(a => a.source === 'website').length;
      console.log(`[Context] Loaded ${pdfCount} PDF(s) and ${siteCount} website(s) from settings`);
      console.log(`[Context] Total attachments: ${contextAttachments.value.length}`);
      contextAttachments.value.forEach((att, index) => {
        console.log(
          `[Context] Attachment ${index + 1}: ${att.name} (${att.source}), ${att.markdown?.length || 0} chars`
        );
      });

      // Don't clear prepared context - it's stored with metadata for consistency
      // The context will be cleared by ContentSettings when documents actually change
      if (preparedContext.value) {
        console.log('[Context] ✅ Documents loaded, prepared context is still valid');
      }
    } catch (e) {
      console.error('[Context] Failed to load stored attachments:', e);
    }
  } else {
    console.log('[Context] No stored attachments found');
  }

  // Mobile: try to restore previous session
  if (isMobile.value) {
    loadMobileSession();
    startMobileSessionPersistence();
  }

  // Reset flag on page load
  if (isDevMode.value) {
    // currentText.value = demo_text
  }
});

onUnmounted(() => {
  // Clean up transcription provider on destroy
  if (transcriptionProvider.value && transcriptionProvider.value.isRecording) {
    transcriptionProvider.value.stopRecognition();
  }

  // Release screen capture stream
  stopScreenCapture();
  stopAutoMode();

  if (scrollRafId) cancelAnimationFrame(scrollRafId);
  // Mobile: clean up session persistence
  if (isMobile.value) {
    stopMobileSessionPersistence();
    // Save final session state
    if (state.value === 'ing') {
      saveMobileSession();
    }
  }
});
/**
 * Get the new/unanswered portion of the transcript.
 * This ensures we only process new content since the last AI response.
 * @returns {string} New transcript content to process
 */
const getNewTranscriptContent = () => {
  if (!currentText.value) {
    return '';
  }

  // If this is the first question, process everything
  if (lastProcessedPosition.value === 0) {
    console.log(
      '[Transcript] First question, processing full transcript:',
      currentText.value.length,
      'chars'
    );
    return currentText.value;
  }

  // Get only the new content since last processing
  const newContent = currentText.value.slice(lastProcessedPosition.value);

  // Handle case where transcript was truncated due to memory limits
  if (newContent.length === 0 && currentText.value.length < lastProcessedPosition.value) {
    console.log('[Transcript] Transcript was truncated, resetting position');
    lastProcessedPosition.value = 0;
    return currentText.value;
  }

  console.log('[Transcript] New content since last response:', newContent.length, 'chars');
  console.log(
    '[Transcript] Previous position:',
    lastProcessedPosition.value,
    'Current total:',
    currentText.value.length
  );

  return newContent.trim();
};

/**
 * Update the processed position after successful AI response.
 * @param {string} processedContent - The content that was just processed
 */
const updateProcessedPosition = processedContent => {
  if (!processedContent) return;

  const newPosition = lastProcessedPosition.value + processedContent.length;
  console.log(
    '[Transcript] Updating processed position:',
    lastProcessedPosition.value,
    '->',
    newPosition
  );

  // Safety check: position should never exceed current transcript length
  if (newPosition <= currentText.value.length) {
    lastProcessedPosition.value = newPosition;
  } else {
    console.warn('[Transcript] Position exceeds transcript length, resetting');
    lastProcessedPosition.value = currentText.value.length;
  }
};

/**
 * Reset the incremental processing tracker.
 * Call this when starting a new session or clearing transcript.
 */
const resetProcessedPosition = () => {
  console.log('[Transcript] Resetting processed position');
  lastProcessedPosition.value = 0;
  lastAIResponseLength.value = 0;
};

// Methods
const askCurrentText = async () => {
  const providerId = config_util.ai_provider();
  const provider = providerRegistry.get(providerId);

  if (!provider) {
    ai_result.value = `Provider ${providerId} not found. Please check your settings.`;
    return;
  }

  // Get provider-specific config
  const config = getProviderConfig(providerId);

  // Initialize provider FIRST with config
  try {
    await provider.initialize(config);
  } catch (initError) {
    ai_result.value = `Failed to initialize provider: ${initError.message}`;
    console.error('[AI] Provider initialization failed:', initError);
    return;
  }

  // NOW validate required config (after provider is initialized)
  const validation = await provider.validateConfig();
  if (!validation.valid && provider.getProviderInfo().requiresApiKey) {
    ai_result.value = `Configuration error: ${validation.errors.join(', ')}`;
    return;
  }

  // Get only new/unanswered transcript content
  const question = getNewTranscriptContent();

  if (!question) {
    ai_result.value =
      "No new content to process. The transcript hasn't changed since the last response.";
    console.log('[AI] No new content to process');
    return;
  }

  // Store the current question for response header
  currentQuestion.value = question;
  console.log('[AI] Current question stored:', question.substring(0, 50) + '...');

  console.log('[AI] Processing new transcript content:', question.length, 'chars');

  // Show loading state for context summarization if needed
  const totalContextLength = contextAttachments.value.reduce(
    (sum, att) => sum + att.markdown.length,
    0
  );
  const contextNeedsSummarization = totalContextLength > getPlatformLimits().maxContext;

  if (contextNeedsSummarization) {
    ai_result.value = '📊 Analyzing context and generating summaries for optimal AI performance...';
    responseCount.value = 0; // Reset response counter
    hasStartedResponse.value = false; // Reset response start flag
    console.log('[AI] Context summarization required, showing loading state');
  }

  // Build user message with context and history (now async for summarization)
  const content = await buildUserMessage(question);

  // Clear loading state before actual AI response
  if (contextNeedsSummarization) {
    ai_result.value = '';
    responseCount.value = 0; // Reset response counter for new AI response
    hasStartedResponse.value = false; // Reset response start flag
    currentQuestion.value = ''; // Reset current question
    console.log('[AI] Context summarization complete');
  }

  show_ai_thinking_effect.value = true;

  // Get base system prompt (behavioral instructions only)
  const systemPrompt = buildBasePrompt();

  try {
    // Use streaming recovery for better reliability
    await executeWithStreamingRecovery(
      // Streaming function
      async onChunk => {
        const streamOptions = systemPrompt ? { systemPrompt } : {};
        if (screenshotQueue.value.length > 0) {
          streamOptions.images = [...screenshotQueue.value];
        }
        await provider.generateCompletionStream(content, onChunk, streamOptions);
      },
      // Chunk handler
      chunk => {
        if (show_ai_thinking_effect.value) show_ai_thinking_effect.value = false;

        // First chunk of a new response - force creating a new response with separator
        if (!hasStartedResponse.value) {
          updateAIResult(chunk, true); // force new response
        } else {
          updateAIResult(chunk); // continue streaming
        }
      },
      // Error handler
      error => {
        console.error('[AI] Streaming failed after retries:', error);
        throw error;
      },
      // Completion handler
      () => {
        show_ai_thinking_effect.value = false;

        // Track what content was successfully processed
        updateProcessedPosition(question);

        // Mark this response as complete - next AI call will start a new response
        hasStartedResponse.value = false;

        // Fire-and-forget: compact this exchange into rolling history
        compactHistory(question, ai_result.value);
      }
    );
  } catch (e) {
    show_ai_thinking_effect.value = false;
    const errorMessage = e.message || String(e);

    // Add helpful context for Z.ai errors
    if (providerId === 'zai') {
      if (errorMessage.includes('Failed to fetch')) {
        ai_result.value =
          `Error: Could not connect to Z.ai server.\n\n` +
          `Troubleshooting:\n` +
          `1. Check your Z.ai API key\n` +
          `2. Verify the endpoint URL (current: ${config.endpoint})\n` +
          `3. Check if Z.ai server is accessible\n` +
          `4. Check browser console for CORS errors\n\n` +
          `Original error: ${errorMessage}`;
      } else {
        ai_result.value = `Error: ${errorMessage}`;
      }
    } else {
      ai_result.value = `Error: ${errorMessage}`;
    }
  }
};

const getProviderConfig = providerId => {
  switch (providerId) {
    case 'openai':
      return {
        apiKey: config_util.openai_api_key(),
        model: config_util.gpt_model(),
        temperature: config_util.openai_temperature(),
      };
    case 'zai':
      return {
        apiKey: config_util.zai_api_key(),
        model: config_util.zai_model(),
        endpoint: config_util.zai_endpoint(),
        temperature: config_util.zai_temperature(),
      };
    case 'ollama':
      return {
        endpoint: config_util.ollama_endpoint(),
        model: config_util.ollama_model(),
        temperature: config_util.ollama_temperature(),
      };
    case 'mlx':
      return {
        endpoint: config_util.mlx_endpoint(),
        model: config_util.mlx_model(),
        temperature: config_util.mlx_temperature(),
      };
    case 'anthropic':
      return {
        apiKey: config_util.anthropic_api_key(),
        model: config_util.anthropic_model(),
        temperature: config_util.anthropic_temperature(),
      };
    case 'gemini':
      return {
        apiKey: config_util.gemini_api_key(),
        model: config_util.gemini_model(),
        temperature: config_util.gemini_temperature(),
      };
    case 'openrouter':
      return {
        apiKey: config_util.openrouter_api_key(),
        model: config_util.openrouter_model(),
        temperature: config_util.openrouter_temperature(),
      };
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
};

const clearASRContent = () => {
  currentText.value = '';
  resetProcessedPosition();

  // Clear from localStorage to persist the clear operation
  if (isMobile.value) {
    try {
      const saved = localStorage.getItem(MOBILE_SESSION_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        session.currentText = '';
        session.timestamp = Date.now();
        localStorage.setItem(MOBILE_SESSION_KEY, JSON.stringify(session));
        console.log('[Transcript] Cleared transcript from localStorage');
      }
    } catch (e) {
      console.warn('[Transcript] Failed to clear transcript from localStorage:', e.message);
    }
  }

  console.log('[Transcript] Cleared transcript and reset position tracking');
};

/**
 * Submit the chat input, appending it to the transcript before asking AI.
 */
const submitChatInput = async () => {
  if (chatInput.value.trim()) {
    updateCurrentText(chatInput.value.trim());
    chatInput.value = '';
  }
  await askCurrentText();
};

/**
 * Summarize the full assistant session (transcript + AI responses) into a concise recap.
 */
const summarizeSession = async () => {
  if (!currentText.value && !ai_result.value) return;

  const providerId = config_util.ai_provider();
  const provider = providerRegistry.get(providerId);
  if (!provider) {
    ElMessage.error(`Provider ${providerId} not found.`);
    return;
  }

  isSummarizingSession.value = true;

  const parts = [];
  if (currentText.value) parts.push(`## Session Transcript\n\n${currentText.value}`);
  if (ai_result.value) parts.push(`## AI Responses\n\n${ai_result.value}`);

  const prompt =
    `Please summarize this assistant session into a concise recap. Include:\n` +
    `- Key topics and questions discussed\n` +
    `- Main points from the AI responses\n` +
    `- Any action items or follow-ups\n\n` +
    parts.join('\n\n---\n\n');

  try {
    const config = getProviderConfig(providerId);
    await provider.initialize(config);

    const systemPrompt = buildBasePrompt();
    let summaryText = '';

    await executeWithStreamingRecovery(
      async onChunk => {
        const opts = systemPrompt ? { systemPrompt } : {};
        await provider.generateCompletionStream(prompt, onChunk, opts);
      },
      chunk => {
        summaryText += chunk;
      },
      error => {
        throw error;
      },
      () => {
        sessionSummary.value = summaryText.trim();
        isSummarizingSession.value = false;
        showSessionSummary.value = true; // Automatically show the summary dialog
        ElMessage.success('Session summarized');
      }
    );
  } catch (e) {
    isSummarizingSession.value = false;
    ElMessage.error(`Summarization failed: ${e.message}`);
  }
};

// ============================================
// Screenshot Queue
// ============================================

/**
 * Capture a screenshot and add it to the queue.
 */
const takeScreenshot = async () => {
  if (!screenCaptureSupported) {
    ElMessage.warning('Screen capture is not supported in this browser. Use Chrome or Edge.');
    return;
  }
  isCapturingScreenshot.value = true;
  try {
    const dataUrl = await captureScreenshot();
    screenshotQueue.value.push(dataUrl);
    if (screenshotQueue.value.length > MAX_SCREENSHOTS) {
      screenshotQueue.value.shift();
    }
    ElMessage.success('Screenshot captured');
  } catch (error) {
    console.error('[Screenshot] Capture failed:', error);
    ElMessage.error(error.message);
  } finally {
    isCapturingScreenshot.value = false;
  }
};

/**
 * Remove a screenshot from the queue by index.
 * @param {number} index
 */
const removeScreenshot = index => {
  screenshotQueue.value.splice(index, 1);
};

/**
 * Clear all screenshots from the queue.
 */
const clearScreenshots = () => {
  screenshotQueue.value = [];
  stopScreenCapture();
};

// Copy to clipboard functionality
const copyAIResponse = async () => {
  try {
    await navigator.clipboard.writeText(ai_result.value);
    ElMessage.success('AI response copied to clipboard');
  } catch (error) {
    console.error('Failed to copy:', error);
    ElMessage.error('Failed to copy response');
  }
};

// Copy session summary
const copySessionSummary = async () => {
  try {
    await navigator.clipboard.writeText(sessionSummary.value);
    ElMessage.success('Summary copied to clipboard');
  } catch (error) {
    console.error('Failed to copy:', error);
    ElMessage.error('Failed to copy summary');
  }
};

// Clear AI response
const clearAIResponse = () => {
  ai_result.value = '';
  responseCount.value = 0; // Reset response counter
  hasStartedResponse.value = false; // Reset response start flag
  currentQuestion.value = ''; // Reset current question

  // Clear from localStorage to persist the clear operation
  if (isMobile.value) {
    try {
      const saved = localStorage.getItem(MOBILE_SESSION_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        session.aiResult = '';
        session.conversationHistory = null;
        session.sessionSummary = null;
        session.timestamp = Date.now();
        localStorage.setItem(MOBILE_SESSION_KEY, JSON.stringify(session));
        console.log('[AI Response] Cleared from localStorage');
      }
    } catch (e) {
      console.warn('[AI Response] Failed to clear from localStorage:', e.message);
    }
  }
};

const startCopilot = async () => {
  // Prevent auto-activation on iOS - ensure we're in the correct state
  if (state.value !== 'end') {
    console.warn('[Session] Preventing auto-activation - not in correct state:', state.value);
    return;
  }

  // Prevent starting if already starting or preparing
  if (copilot_starting.value || isPreparingContext.value) {
    console.warn('[Session] Preventing auto-activation - already processing');
    return;
  }

  // Reset scroll state for new session
  userScrolledUpAsr.value = false;
  userScrolledUp.value = false;

  copilot_starting.value = true;

  // Reset incremental processing for new session
  resetProcessedPosition();

  // Load all attachments from settings before starting
  const storedAttachments = localStorage.getItem('context_attachments');
  if (storedAttachments) {
    try {
      contextAttachments.value = JSON.parse(storedAttachments);
      console.log(
        `[Context] Session start: Loaded ${contextAttachments.value.length} attachment(s)`
      );
      contextAttachments.value.forEach(att => {
        console.log(`[Context] - ${att.name} (${att.source}): ${att.markdown?.length || 0} chars`);
      });
    } catch (e) {
      console.error('[Context] Failed to load stored attachments:', e);
    }
  } else {
    console.log('[Context] Session start: No stored attachments found');
  }

  // Reset conversation history and summary for new session
  conversationHistory.value = null;
  sessionSummary.value = null;

  // Get transcription provider
  const transcriptionProviderId = config_util.transcription_provider();
  const provider = transcriptionRegistry.get(transcriptionProviderId);

  if (!provider) {
    currentText.value = `Transcription provider ${transcriptionProviderId} not found. Please check your settings.`;
    copilot_starting.value = false;
    return;
  }

  // Validate AI provider configuration
  const aiProviderId = config_util.ai_provider();
  const aiProvider = providerRegistry.get(aiProviderId);
  const providerInfo = aiProvider?.getProviderInfo();

  console.log({ transcriptionProvider: transcriptionProviderId, aiProvider: aiProviderId });

  try {
    // Get transcription provider config
    const transcriptionConfig = getTranscriptionProviderConfig(transcriptionProviderId);

    // Initialize transcription provider (will throw if config is invalid)
    await provider.initialize(transcriptionConfig);

    // Validate AI provider config if it requires an API key
    if (providerInfo?.requiresApiKey) {
      const config = getProviderConfig(aiProviderId);
      if (!config.apiKey) {
        throw new Error(`You should setup ${providerInfo.name} API Key in settings`);
      }
    }

    // Start transcription
    await provider.startRecognition(
      transcript => {
        // On result - append transcript with memory management
        updateCurrentText(transcript);
      },
      error => {
        // On error
        console.error('[Transcription] Error:', error);
        updateCurrentText('[Transcription Error: ' + error.message + ']');
      }
    );

    transcriptionProvider.value = provider;
    copilot_starting.value = false;
    state.value = 'ing';
    MyTimerRef.value.start();
    console.log('[Transcription] Started');
  } catch (e) {
    console.error('[Transcription] Start failed:', e);
    currentText.value = 'Start Failed: ' + e.message;
    copilot_starting.value = false;
  }
};

const userStopCopilot = async () => {
  copilot_stopping.value = true;

  try {
    if (transcriptionProvider.value && transcriptionProvider.value.isRecording) {
      await transcriptionProvider.value.stopRecognition();
    }
    console.log('[Transcription] Stopped');

    // Mobile: save session when session stops
    if (isMobile.value) {
      saveMobileSession();
    }
  } catch (err) {
    console.error('[Transcription] Stop failed:', err);
  }

  copilot_stopping.value = false;
  state.value = 'end';
  MyTimerRef.value.stop();
};

/**
 * Get configuration for the selected transcription provider
 */
const getTranscriptionProviderConfig = providerId => {
  switch (providerId) {
    case 'azure':
      return {
        azureToken: config_util.azure_token(),
        azureRegion: config_util.azure_region(),
        language: config_util.azure_language(),
      };
    case 'whisper':
      return {
        apiKey: config_util.whisper_api_key(),
        model: config_util.whisper_model(),
        language: config_util.whisper_language(),
      };
    case 'webspeech':
      return {
        language: config_util.webspeech_language(),
        continuous: config_util.webspeech_continuous(),
        interimResults: config_util.webspeech_interim_results(),
      };
    case 'deepgram':
      return {
        apiKey: config_util.deepgram_api_key(),
        model: config_util.deepgram_model(),
        language: config_util.deepgram_language(),
      };
    default:
      throw new Error(`Unknown transcription provider: ${providerId}`);
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
/* ========== Base Layout ========== */
.homeview-container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  background: transparent;
  margin: 0 auto;
  width: 100%;
  overflow: hidden;
}

.homeview-container.is-mobile {
  max-width: 100%;
  grid-template-rows: auto auto 1fr auto;
  /* Ensure container doesn't overflow on mobile */
  overflow-x: hidden;
  overflow-y: auto;
  /* Prevent content from being hidden behind fixed elements */
  height: auto;
  min-height: 100vh;
}

/* ========== Mobile Header ========== */
.mobile-header {
  background: var(--bg-primary);
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicators {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mobile-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 8px;
}

/* ========== Desktop Header ========== */
.desktop-header {
  background: var(--bg-primary);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  padding: 20px 28px;
  border-bottom: 1px solid var(--border-light);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 48px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.auto-mode-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auto-status {
  font-size: 12px;
  color: #e6a23c;
  white-space: nowrap;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.auto-pulse {
  display: inline-block;
  animation: pulse 1.2s ease-in-out infinite;
}

.screenshot-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.screenshot-thumbnails {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.screenshot-thumb {
  position: relative;
  width: 48px;
  height: 36px;
  border-radius: 4px;
  overflow: visible;
  border: 1px solid var(--border-base);
}

.screenshot-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  display: block;
}

.thumb-delete {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px !important;
  height: 16px !important;
  min-height: unset !important;
  padding: 0 !important;
  font-size: 10px !important;
}

.status-bar {
  display: flex;
  gap: 16px;
  align-items: center;
}

.attachment-indicator {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  padding: 4px 0;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--danger-color);
  font-weight: 500;
}

.recording-dot {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.timer-display {
  font-size: 24px;
  font-weight: 600;
  font-family: 'Monaco', 'Consolas', 'Monaco', monospace;
  color: var(--text-primary);
  background: var(--bg-secondary);
  padding: 8px 16px;
  border-radius: 8px;
}

/* ========== Main Content ========== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content.is-mobile {
  padding: 0;
}

/* ========== Mobile Tabs ========== */
.mobile-tabs {
  display: flex;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  position: sticky;
  top: 0;
  z-index: 99;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
}

.tab-item.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  background: var(--bg-secondary);
}

.tab-item .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.tab-item span {
  font-size: 12px;
  font-weight: 500;
}

/* ========== Panels Wrapper ========== */
.panels-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  height: 100%;
  overflow: hidden;
}

/* ========== Panels Container ========== */
.panels-container {
  display: grid;
  grid-template-columns: 2fr 3fr;
  height: 100%;
  overflow: hidden;
  gap: 16px;
  width: 90%;
  margin: 0 auto;
}

/* Mobile: Single column layout */
@media (max-width: 767px) {
  .panels-wrapper {
    width: 100%;
    /* Allow scrolling on mobile to prevent content being hidden behind fixed action bar */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .panels-container {
    width: 100%;
    grid-template-columns: 1fr;
    height: auto;
    min-height: 100%;
    padding-bottom: 200px; /* Space for fixed action bar (3 buttons: ~184px + spacing) */
    overflow: visible;
  }

  /* On mobile, only show active panel */
  .content-panel.is-mobile.is-hidden {
    display: none !important;
  }

  .content-panel.is-mobile.is-active {
    display: flex !important;
    height: 100% !important;
    flex-direction: column !important;
  }

  .content-panel.is-mobile {
    height: 100%;
  }

  /* Prevent content from hiding behind fixed action bar */
  .panel-content {
    padding-bottom: calc(200px + env(safe-area-inset-bottom, 0px));
  }
}

/* ========== Content Panel ========== */
.content-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  overflow: hidden;
  position: relative;
}

/* Mobile content panel layout */
@media (max-width: 767px) {
  .content-panel.is-mobile {
    display: flex;
    flex-direction: column;
    height: auto;
    min-height: calc(
      100vh - 280px
    ); /* Leave room for header (~60px) and action bar (~184px) + spacing */
    position: relative;
  }
}

.content-panel.is-mobile {
  width: 100%;
  transition: transform 0.3s ease;
  /* Allow content to be visible above fixed action bar */
  max-height: calc(
    100vh - 280px
  ); /* Account for header (~60px) + action bar (~184px) + spacing (~36px) */
  /* Ensure panel doesn't get cut off */
  min-height: 300px;
}

/* Active panel should be fully visible and scrollable */
.content-panel.is-mobile:not(.is-hidden) {
  height: auto;
  min-height: calc(100vh - 280px);
}

/* Mobile: Full width panels wrapper */
@media (max-width: 767px) {
  .panels-wrapper,
  .panels-container {
    width: 100%;
  }
}

.content-panel.is-mobile.is-hidden {
  display: none;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-tertiary);
  min-height: 52px;
  position: relative;
  z-index: 10;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1; /* Allow title to take available space */
  min-width: 0; /* Allow text truncation if needed */
}

/* Mobile panel title adjustments */
@media (max-width: 767px) {
  .panel-title {
    font-size: 14px;
    gap: 6px;
  }

  .panel-title .el-icon {
    font-size: 16px;
  }

  /* Text truncation for long titles on mobile */
  .panel-title span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.panel-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.panel-actions .el-button {
  font-size: 14px;
  padding: 8px 16px;
}

/* Mobile panel header actions */
@media (max-width: 767px) {
  .panel-actions {
    gap: 4px;
    margin-left: auto; /* Push actions to the right */
    flex-shrink: 0; /* Prevent actions from being squished */
  }

  .panel-actions .el-button {
    /* Ensure buttons are properly sized on mobile */
    min-width: 32px;
    min-height: 32px;
    padding: 0;
  }

  /* Panel header layout for mobile with actions */
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 8px 12px; /* Slightly smaller padding on mobile */
  }

  .panel-title {
    flex: 1;
    min-width: 0; /* Allows text truncation if needed */
    font-size: 14px; /* Slightly smaller font on mobile */
  }

  /* Ensure circular buttons are properly sized on mobile */
  .panel-actions .el-button.el-button--circle {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }

  /* Icon sizing in circular buttons */
  .panel-actions .el-button.el-button--circle .el-icon {
    font-size: 14px;
  }

  /* Ensure touch targets are large enough on mobile (iOS recommends 44x44) */
  .panel-actions .el-button:not(.el-button--circle) {
    min-width: 44px;
    min-height: 44px;
  }

  /* Circular buttons slightly smaller but still touch-friendly */
  .panel-actions .el-button.el-button--circle {
    min-width: 36px;
    min-height: 36px;
    width: 36px;
    height: 36px;
  }

  /* Ensure panel-actions is properly positioned and doesn't overlap content */
  .panel-header .panel-actions {
    display: flex;
    gap: 4px;
    margin-left: auto;
    flex-shrink: 0;
  }

  /* Make sure panel title doesn't get squished by actions */
  .panel-header .panel-title {
    flex: 1;
    min-width: 0;
    padding-right: 8px;
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

/* Mobile-specific panel content improvements */
@media (max-width: 767px) {
  .panel-content {
    /* Ensure mobile panels have proper scrolling */
    overflow-y: auto;
    overflow-x: hidden;
    /* Extra padding at bottom to account for fixed action bar */
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    /* Prevent content from being hidden behind action bar */
    scroll-padding-bottom: 80px;
    /* Smooth scrolling */
    scroll-behavior: smooth;
  }

  /* Ensure panel content starts after the header, not under it */
  .content-panel {
    display: flex;
    flex-direction: column;
    height: auto;
    min-height: 300px;
  }

  /* Ensure header is properly positioned above content */
  .panel-header {
    position: relative;
    z-index: 1;
    width: 100%;
    flex-shrink: 0;
  }

  /* Ensure content area comes after header in document flow */
  .panel-content {
    order: 1; /* Ensure content comes after header */
    flex: 1;
  }

  /* Ensure AI response panel is scrollable */
  .panel-content:has(.markdown-content) {
    overflow-y: auto;
    max-height: calc(
      100vh - 280px
    ); /* Leave room for header (~60px) and action bar (~184px) + spacing */
  }

  /* Fallback for browsers without :has() support - ensures all panel-content containers have max-height on mobile */
  .panel-content {
    max-height: calc(100vh - 280px);
  }

  /* Mobile: Ensure panel-actions are properly styled and don't cause overlap */
  .panel-header .panel-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Hide empty panel-actions but maintain layout when buttons are present */
  .panel-header .panel-actions:empty {
    display: none;
  }

  /* Ensure proper spacing between title and actions on mobile */
  .panel-header {
    flex-wrap: nowrap; /* Prevent wrapping of header content */
  }

  /* Make sure buttons don't shrink the title */
  .panel-header .panel-title {
    flex: 1 1 auto;
    min-width: 0;
    margin-right: auto;
  }

  .panel-header .panel-actions {
    flex: 0 0 auto;
  }

  /* Make sure markdown content doesn't overflow */
  .panel-content .markdown-body {
    overflow-y: auto;
    max-height: calc(100vh - 280px);
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  /* Ensure scrolling works properly on mobile */
  .panel-content .markdown-body * {
    max-width: 100%;
    overflow-wrap: break-word;
  }
}

.panel-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-tertiary);
}

.chat-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.chat-input-row .el-input {
  flex: 1;
}

/* ========== Empty State ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  color: var(--text-secondary);
  text-align: center;
  padding: 24px;
}

.empty-state p {
  margin: 12px 0 0 0;
  font-size: 16px;
  line-height: 1.5;
}

.hint {
  font-size: 14px;
  color: var(--text-placeholder);
}

/* ========== Loading State ========== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  color: var(--text-secondary);
  text-align: center;
  padding: 24px;
}

.loading-state .el-icon {
  margin-bottom: 16px;
}

/* Blinking cursor shown while stream is active */
.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--primary-color);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 0.7s step-end infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* ========== Text Content ========== */
.text-content {
  white-space: pre-wrap;
  line-height: 1.8;
  color: var(--text-primary);
  font-size: 15px;
}

/* ========== Markdown Content ========== */
.markdown-content {
  line-height: 1.8;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-top: 24px;
  margin-bottom: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.markdown-content :deep(h1) {
  font-size: 1.8em;
  color: var(--text-primary);
}

.markdown-content :deep(h2) {
  font-size: 1.5em;
  color: var(--text-primary);
}

.markdown-content :deep(h3) {
  font-size: 1.3em;
  color: var(--text-regular);
}

.markdown-content :deep(p) {
  margin-bottom: 12px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-left: 24px;
  margin-bottom: 12px;
}

.markdown-content :deep(li) {
  margin-bottom: 6px;
}

.markdown-content :deep(code) {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 12px;
}

.markdown-content :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--primary-color);
  padding-left: 16px;
  margin: 12px 0;
  color: var(--text-secondary);
  font-style: italic;
}

.markdown-content :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

/* ========== Response Separator Styles ========== */
.markdown-content :deep(hr) {
  border: none;
  height: 2px;
  background: linear-gradient(to right, transparent, var(--border-light), transparent);
  margin: 24px 0;
}

.markdown-content :deep(h3) {
  font-size: 1.1em;
  font-weight: 600;
  color: var(--text-primary);
  margin: 16px 0 4px 0;
  padding: 10px 14px;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
  line-height: 1.4;
}

.markdown-content :deep(h3 strong) {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Mobile-specific response separator styles */
@media (max-width: 767px) {
  .markdown-content :deep(h3) {
    font-size: 1em;
    padding: 8px 12px;
    margin: 12px 0 4px 0;
  }

  .markdown-content :deep(h3 strong) {
    font-size: 0.8em;
  }

  .markdown-content :deep(hr) {
    margin: 16px 0;
  }

  .streaming-cursor {
    height: 0.8em;
  }
}

/* ========== Streaming Cursor ========== */
.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--primary-color);
  margin-left: 2px;
  animation: blink 1s infinite;
  vertical-align: text-bottom;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* ========== Mobile Bottom Action Bar ========== */
.mobile-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  padding: 12px 16px;
  border-top: 1px solid var(--border-light);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 100%;
  max-height: 40vh; /* Prevent action bar from taking too much screen space */
  overflow-y: auto; /* Allow scrolling if content exceeds max-height */
}

.mobile-action-bar .el-button {
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
}

/* ========== Desktop Action Bar ========== */
.desktop-action-bar {
  padding: 16px 24px;
  background: var(--bg-primary);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* ========== Responsive Breakpoints ========== */
@media (min-width: 768px) and (max-width: 1024px) {
  .homeview-container {
    max-width: 1200px;
  }

  .main-content {
    padding: 12px;
  }

  .panels-container {
    width: 94%;
    display: flex;
    gap: 12px;
  }

  .panel-content {
    padding: 16px;
  }
}

@media (min-width: 1025px) and (max-width: 1399px) {
  .homeview-container {
    max-width: 1400px;
  }

  .main-content {
    padding: 16px;
    gap: 16px;
  }

  .panels-container {
    width: 92%;
  }

  .content-panel {
    border-radius: 12px;
    box-shadow: var(--shadow-light);
  }
}

@media (min-width: 1400px) {
  .homeview-container {
    max-width: 1600px;
  }

  .main-content {
    padding: 16px;
    gap: 16px;
  }

  .panels-container {
    width: 94%;
  }

  .content-panel {
    border-radius: 12px;
    box-shadow: var(--shadow-light);
  }
}

/* Ultra wide screens */
@media (min-width: 1920px) {
  .homeview-container {
    max-width: 90vw;
  }

  .panels-container {
    width: 96%;
  }
}

/* ========== Touch-Optimized Buttons ========== */
@media (hover: none) and (pointer: coarse) {
  .el-button {
    min-height: 44px;
    min-width: 44px;
    /* iOS-specific fixes to prevent auto-activation */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    /* Prevent double-tap zoom from triggering buttons */
    /* Prevent text selection on button taps */
    -webkit-user-select: none;
    user-select: none;
    /* Fix iOS button rendering issues */
    -webkit-appearance: none;
    appearance: none;
    /* Prevent unwanted hover/active states on iOS */
    -webkit-touch-callout: none;
  }

  /* iOS-specific: Prevent focus rings from causing issues */
  .el-button:focus {
    outline: none;
  }

  /* iOS-specific: Fix button tap delays */
  .el-button:active {
    -webkit-transform: scale(0.98);
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }

  /* Prevent button from being triggered by page scroll */
  .mobile-action-bar .el-button {
    touch-action: pan-y;
  }

  .tab-item {
    min-height: 64px;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  /* iOS-specific: Prevent buttons from being triggered by nearby touches */
  .desktop-action-bar .el-button,
  .mobile-action-bar .el-button {
    position: relative;
    z-index: 1;
  }
}

/* ========== Safe Area for iOS Notch ========== */
@supports (padding: env(safe-area-inset-bottom)) {
  .mobile-action-bar {
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
}

/* ========== Context Preview Dialog - Cross-Browser Optimized ========== */

/* Dialog base styles with browser-specific fixes */
.context-preview-dialog .dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 0;
  /* Firefox specific flex fix */
  flex-wrap: wrap;
}

.context-preview-dialog .header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  /* Safari text rendering optimization */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.context-preview-dialog .header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  /* IE11 flexbox fallback */
  display: -webkit-box;
  display: -ms-flexbox;
}

.context-preview-dialog .context-preview-content {
  max-height: 60vh;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 8px;
  background: #f5f7fa;
  padding: 16px;
  /* Custom scrollbar for webkit browsers */
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

/* Webkit browser scrollbar styling (Chrome, Safari, Edge) */
.context-preview-dialog .context-preview-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.context-preview-dialog .context-preview-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.context-preview-dialog .context-preview-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.context-preview-dialog .context-preview-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.context-preview-dialog .context-text {
  margin: 0;
}

.context-preview-dialog .context-text pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  background: transparent;
  padding: 0;
  border: none;
  /* Browser-specific text rendering */
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
  hyphens: auto;
  /* Better text selection */
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}

.context-preview-dialog .no-context {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.context-preview-dialog .dialog-footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.context-preview-dialog .context-info {
  padding: 12px;
  background: #f0f9ff;
  border-left: 4px solid #409eff;
  border-radius: 4px;
  line-height: 1.5;
}

.context-preview-dialog .context-info .el-descriptions {
  margin-bottom: 0;
}

.context-preview-dialog .context-info .el-descriptions .el-descriptions__label {
  font-weight: 600;
  color: #606266;
}

.context-preview-dialog .context-info .el-divider {
  margin: 12px 0;
}

.context-preview-dialog .footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

/* ========== Mobile Optimizations ========== */
@media (max-width: 767px) {
  /* Make dialog nearly fullscreen on mobile */
  .context-preview-dialog {
    width: 95% !important;
    max-width: 95% !important;
    margin: 20px auto !important;
  }

  /* Optimize header for mobile */
  .context-preview-dialog .dialog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .context-preview-dialog .header-title {
    font-size: 14px;
    width: 100%;
  }

  .context-preview-dialog .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  /* Increase content height for mobile readability */
  .context-preview-dialog .context-preview-content {
    max-height: 70vh;
    padding: 12px;
    background: #ffffff;
    border: 1px solid #e4e7ed;
    /* Mobile-specific scrolling */
    -webkit-overflow-scrolling: touch;
  }

  /* Hide scrollbars on mobile for cleaner look */
  .context-preview-dialog .context-preview-content::-webkit-scrollbar {
    display: none;
  }
  .context-preview-dialog .context-preview-content {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Improve text readability on mobile */
  .context-preview-dialog .context-text pre {
    font-size: 13px;
    line-height: 1.8;
    color: #2c3e50;
    /* Mobile text optimization */
    text-rendering: optimizeLegibility;
  }

  /* Stack footer actions vertically on mobile */
  .context-preview-dialog .dialog-footer {
    gap: 12px;
  }

  .context-preview-dialog .context-info {
    font-size: 12px;
    padding: 10px;
    line-height: 1.5;
  }

  .context-preview-dialog .context-info .el-descriptions {
    font-size: 11px;
  }

  .context-preview-dialog .context-info .el-descriptions .el-descriptions__label {
    font-weight: 600;
  }

  .context-preview-dialog .context-info .el-divider {
    margin: 8px 0;
  }

  /* Make action buttons full-width on mobile */
  .context-preview-dialog .footer-actions {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .context-preview-dialog .footer-actions .el-button {
    width: 100%;
    justify-content: center;
    min-height: 44px;
    font-size: 14px;
  }

  .context-preview-dialog .footer-actions .el-button .el-icon {
    margin-right: 4px;
  }

  /* Add safe area support for notched phones */
  @supports (padding: env(safe-area-inset-bottom)) {
    .context-preview-dialog {
      margin-bottom: calc(20px + env(safe-area-inset-bottom)) !important;
    }
  }
}

/* ========== Very Small Mobile Devices ========== */
@media (max-width: 375px) {
  .context-preview-dialog {
    width: 98% !important;
    max-width: 98% !important;
  }

  .context-preview-dialog .context-text pre {
    font-size: 12px;
  }

  .context-preview-dialog .header-title {
    font-size: 13px;
  }

  .context-preview-dialog .context-info {
    font-size: 11px;
  }
}

/* ========== Browser-Specific Optimizations ========== */

/* Safari-specific optimizations */
@supports (-webkit-appearance: none) {
  .context-preview-dialog .context-text pre {
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
  }

  .context-preview-dialog .context-preview-content {
    -webkit-overflow-scrolling: touch;
  }
}

/* Firefox-specific optimizations */
@supports (-moz-appearance: none) {
  .context-preview-dialog .context-text pre {
    -moz-text-size-adjust: none;
    text-rendering: optimizeLegibility;
  }

  .context-preview-dialog .context-preview-content {
    scrollbar-width: thin;
    scrollbar-color: #409eff #f1f1f1;
  }
}

/* Chrome/Edge-specific optimizations */
@supports (display: grid) and (not (-moz-appearance: none)) {
  .context-preview-dialog .context-preview-content {
    scroll-behavior: smooth;
  }

  .context-preview-dialog .context-text pre {
    text-size-adjust: 100%;
  }
}

/* ========== Touch-Friendly Improvements ========== */
@media (hover: none) and (pointer: coarse) {
  .context-preview-dialog .context-preview-content {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }

  .context-preview-dialog .footer-actions .el-button {
    min-height: 44px;
    min-width: 44px;
    font-size: 14px;
    /* Ensure touch targets are large enough */
    padding: 12px 20px;
  }

  .context-preview-dialog .context-text pre {
    /* Improve text selection on touch devices */
    -webkit-user-select: text;
    user-select: text;
    -webkit-tap-highlight-color: transparent;
  }
}

/* ========== Dark Mode Support ========== */
@media (prefers-color-scheme: dark) {
  .context-preview-dialog .context-preview-content {
    background: #1a1a1a;
    border-color: #3a3a3a;
  }

  .context-preview-dialog .context-preview-content::-webkit-scrollbar-track {
    background: #2a2a2a;
  }

  .context-preview-dialog .context-preview-content::-webkit-scrollbar-thumb {
    background: #4a4a4a;
  }

  .context-preview-dialog .context-preview-content::-webkit-scrollbar-thumb:hover {
    background: #5a5a5a;
  }

  .context-preview-dialog .context-text pre {
    color: #e4e7ed;
  }

  .context-preview-dialog .context-info {
    background: #1e3a5f;
    border-left-color: #66b1ff;
    color: #e4e7ed;
  }
}

/* ========== High Contrast Mode Support ========== */
@media (prefers-contrast: high) {
  .context-preview-dialog .context-preview-content {
    border: 2px solid currentColor;
  }

  .context-preview-dialog .context-text pre {
    font-weight: 500;
  }

  .context-preview-dialog .context-info {
    border-left-width: 6px;
  }
}

/* ========== Reduced Motion Support ========== */
@media (prefers-reduced-motion: reduce) {
  .context-preview-dialog .context-preview-content {
    scroll-behavior: auto;
  }

  .context-preview-dialog * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

/* ========== History Dialog ========== */
.history-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
}

.history-body {
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

/* ========== Summary Dialog ========== */
.summary-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
}

.summary-body {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.summary-body :deep(h1),
.summary-body :deep(h2),
.summary-body :deep(h3) {
  margin-top: 16px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.summary-body :deep(p) {
  margin-bottom: 12px;
}

.summary-body :deep(ul),
.summary-body :deep(ol) {
  margin-left: 20px;
  margin-bottom: 12px;
}

.summary-body :deep(li) {
  margin-bottom: 4px;
}
</style>
