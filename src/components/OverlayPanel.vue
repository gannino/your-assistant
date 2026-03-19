<template>
  <div class="overlay-panel" :class="{ 'is-thinking': isThinking }">
    <!-- Header bar -->
    <div class="overlay-header" @mousedown="startDrag">
      <span class="overlay-title">Your Assistant</span>
      <div class="overlay-actions">
        <el-tag v-if="isRecording" type="danger" size="small" effect="dark">● REC</el-tag>
        <el-button :icon="Close" size="small" circle @click="$emit('close')" />
      </div>
    </div>

    <!-- AI response -->
    <div ref="responseEl" class="overlay-response">
      <div v-if="isThinking" class="overlay-thinking">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>Thinking...</span>
      </div>
      <div v-else-if="aiResult" class="overlay-text" v-html="renderedResult" />
      <div v-else class="overlay-empty">AI response will appear here</div>
    </div>

    <!-- Footer actions -->
    <div class="overlay-footer">
      <el-button
        v-if="!isRecording"
        type="success"
        size="small"
        :loading="isStarting"
        @click="$emit('start')"
      >
        Start
      </el-button>
      <el-button v-else type="danger" size="small" :loading="isStopping" @click="$emit('stop')">
        Stop
      </el-button>
      <el-button type="primary" size="small" :disabled="!hasTranscript" @click="$emit('ask')">
        Ask AI
      </el-button>
      <el-button v-if="aiResult" size="small" :icon="DocumentCopy" @click="$emit('copy')" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Close, Loading, DocumentCopy } from '@element-plus/icons-vue';
import { renderMarkdown } from '../utils/markdown_util';

const props = defineProps({
  aiResult: { type: String, default: '' },
  isThinking: { type: Boolean, default: false },
  isRecording: { type: Boolean, default: false },
  isStarting: { type: Boolean, default: false },
  isStopping: { type: Boolean, default: false },
  hasTranscript: { type: Boolean, default: false },
});

defineEmits(['close', 'start', 'stop', 'ask', 'copy']);

const responseEl = ref(null);

const renderedResult = computed(() => renderMarkdown(props.aiResult || ''));

// ── Drag to reposition ──────────────────────────────────────────────────────
let dragOffsetX = 0;
let dragOffsetY = 0;

function startDrag(e) {
  const panel = e.currentTarget.closest('.overlay-panel');
  const rect = panel.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;

  const onMove = ev => {
    panel.style.left = ev.clientX - dragOffsetX + 'px';
    panel.style.top = ev.clientY - dragOffsetY + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  };

  const onUp = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}
</script>

<style scoped>
.overlay-panel {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 380px;
  max-height: 520px;
  background: var(--bg-primary, rgba(255, 255, 255, 0.92));
  backdrop-filter: var(--backdrop-blur, blur(12px));
  -webkit-backdrop-filter: var(--backdrop-blur, blur(12px));
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  z-index: 9999;
  overflow: hidden;
  transition: opacity 0.2s ease;
}

.overlay-panel.is-thinking {
  border-color: #409eff;
}

.overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg-secondary, rgba(245, 247, 250, 0.95));
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  cursor: move;
  user-select: none;
  border-radius: 14px 14px 0 0;
}

.overlay-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.overlay-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.overlay-response {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  font-size: 13px;
  line-height: 1.7;
  color: #303133;
  -webkit-overflow-scrolling: touch;
}

.overlay-thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-size: 13px;
}

.overlay-empty {
  color: #c0c4cc;
  font-size: 13px;
  text-align: center;
  margin-top: 40px;
}

.overlay-text :deep(p) {
  margin: 0 0 8px;
}
.overlay-text :deep(ul),
.overlay-text :deep(ol) {
  margin-left: 16px;
  margin-bottom: 8px;
}
.overlay-text :deep(code) {
  background: #f5f7fa;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 12px;
}
.overlay-text :deep(pre) {
  background: #f5f7fa;
  padding: 8px;
  border-radius: 6px;
  overflow-x: auto;
}
.overlay-text :deep(h1),
.overlay-text :deep(h2),
.overlay-text :deep(h3) {
  font-size: 14px;
  font-weight: 600;
  margin: 8px 0 4px;
}

.overlay-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: var(--bg-secondary, rgba(245, 247, 250, 0.95));
  border-radius: 0 0 14px 14px;
}
</style>
