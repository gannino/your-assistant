<template>
  <div class="markdown-viewer" :class="{ 'is-mobile': isMobile, 'is-fullscreen': isFullscreen }">
    <!-- Header -->
    <div class="viewer-header">
      <div class="header-content">
        <div class="title-section">
          <el-icon :size="24" color="#409eff"><Document /></el-icon>
          <h3>{{ title }}</h3>
        </div>
        <div class="header-actions">
          <el-button
            v-if="!isFullscreen"
            :icon="FullScreen"
            size="small"
            circle
            title="Enter Fullscreen"
            @click="toggleFullscreen"
          >
          </el-button>
          <el-button
            v-if="isFullscreen"
            :icon="Close"
            size="small"
            circle
            title="Exit Fullscreen"
            @click="toggleFullscreen"
          >
          </el-button>
          <el-button
            :icon="Download"
            size="small"
            title="Download Markdown"
            @click="downloadMarkdown"
          >
            Download
          </el-button>
          <el-button
            :icon="CopyDocument"
            size="small"
            title="Copy to Clipboard"
            @click="copyToClipboard"
          >
            Copy
          </el-button>
          <el-button
            :icon="View"
            size="small"
            :type="showPreview ? 'primary' : 'default'"
            title="Toggle Preview"
            @click="togglePreview"
          >
            {{ showPreview ? 'Edit' : 'Preview' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="viewer-content">
      <!-- Editor Mode -->
      <div v-if="!showPreview" class="editor-section">
        <div class="editor-header">
          <span class="editor-label">Markdown Editor</span>
          <span class="char-count">{{ markdownContent.length }} characters</span>
        </div>
        <div class="editor-container">
          <textarea
            v-model="localMarkdownContent"
            class="markdown-editor"
            :style="{ height: editorHeight + 'px', flex: 'none' }"
            placeholder="Edit your markdown content here..."
          >
          </textarea>
          <div class="resize-handle" @mousedown="startResize"></div>
        </div>
      </div>

      <!-- Preview Mode -->
      <div v-else class="preview-section">
        <div class="preview-header">
          <span class="preview-label">Markdown Preview</span>
          <span class="word-count">{{ wordCount }} words</span>
        </div>
        <div class="preview-container">
          <div class="markdown-content" v-html="renderedMarkdown"></div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="viewer-footer">
      <div class="footer-info">
        <span class="source-info">
          <el-icon><Link /></el-icon>
          Source: {{ sourceUrl }}
        </span>
        <span class="fetch-info">
          <el-icon><Clock /></el-icon>
          Fetched: {{ fetchTime }}
        </span>
      </div>
      <div class="footer-actions">
        <el-button size="small" @click="closeViewer"> Close </el-button>
        <el-button v-if="!isAttached" type="primary" size="small" @click="attachToContext">
          Attach to Context
        </el-button>
      </div>
    </div>

    <!-- Toast notification -->
    <el-message
      v-if="showToast"
      :message="toastMessage"
      :type="toastType"
      :duration="2000"
      :show-close="true"
      class="toast-message"
    >
    </el-message>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Document,
  FullScreen,
  Close,
  Download,
  CopyDocument,
  View,
  Link,
  Clock,
} from '@element-plus/icons-vue';
import { useMobile } from '../composables/useMobile';
import { renderMarkdown } from '../utils/markdown_util';

// Props
const props = defineProps({
  title: {
    type: String,
    default: 'Content',
  },
  markdownContent: {
    type: String,
    default: '',
  },
  sourceUrl: {
    type: String,
    default: '',
  },
  fetchTime: {
    type: String,
    default: '',
  },
  isAttached: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['close', 'update:markdownContent', 'attach']);

// Mobile detection
const { isMobile } = useMobile();

// Reactive state
const showPreview = ref(false);
const isFullscreen = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const localMarkdownContent = ref(props.markdownContent);
const editorHeight = ref(400); // Default editor height in pixels

// Computed properties
const renderedMarkdown = computed(() => {
  return renderMarkdown(localMarkdownContent.value);
});

const wordCount = computed(() => {
  const text = localMarkdownContent.value.replace(/[^a-zA-Z\s]/g, '');
  return text.split(/\s+/).filter(word => word.length > 0).length;
});

// Methods
const togglePreview = () => {
  showPreview.value = !showPreview.value;
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  // Force a reflow to ensure proper height calculation
  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden';
    // Force fullscreen class to be applied
    document.body.style.height = '100vh';
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
    document.body.style.height = '';
  }
};

const downloadMarkdown = () => {
  const blob = new Blob([props.markdownContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const domain = new URL(props.sourceUrl).hostname;
  a.href = url;
  a.download = `${domain.replace(/\./g, '_')}_${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToastMessage('Markdown downloaded successfully', 'success');
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.markdownContent);
    showToastMessage('Content copied to clipboard', 'success');
  } catch (error) {
    showToastMessage('Failed to copy to clipboard', 'error');
  }
};

const closeViewer = () => {
  emit('close');
};

const attachToContext = () => {
  // Use the local content (which includes any edits) instead of the original prop
  const contentToAttach = localMarkdownContent.value || props.markdownContent;

  emit('attach', {
    name: props.title,
    markdown: contentToAttach,
    source: 'website',
    url: props.sourceUrl,
    size: contentToAttach.length,
  });
  showToastMessage('Content attached to context', 'success');
};

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;

  setTimeout(() => {
    showToast.value = false;
  }, 2000);
};

// Resize functionality
let isResizing = false;
let startY = 0;
let startHeight = 0;

const startResize = e => {
  isResizing = true;
  startY = e.clientY;
  startHeight = editorHeight.value;
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', endResize);
  document.body.style.cursor = 'ns-resize';
  document.body.style.userSelect = 'none';
};

const handleResize = e => {
  if (!isResizing) return;

  const deltaY = e.clientY - startY;
  const newHeight = startHeight + deltaY;

  // Set minimum and maximum heights
  const minHeight = 200;
  const maxHeight = window.innerHeight - 200;

  if (newHeight >= minHeight && newHeight <= maxHeight) {
    editorHeight.value = newHeight;
  }
};

const endResize = () => {
  isResizing = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', endResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

// Watch for changes in markdown content
watch(
  () => props.markdownContent,
  newContent => {
    // Sync local content when prop changes
    if (localMarkdownContent.value !== newContent) {
      localMarkdownContent.value = newContent;
    }
  }
);

// Watch for changes in local content and emit updates
watch(localMarkdownContent, newContent => {
  if (newContent !== props.markdownContent) {
    emit('update:markdownContent', newContent);
  }
});

// Lifecycle hooks
onMounted(() => {
  // Initialize with preview mode if content exists
  if (props.markdownContent) {
    showPreview.value = true;
  }
});
</script>

<style scoped>
.markdown-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
}

.markdown-viewer.is-mobile {
  border-radius: 0;
  box-shadow: none;
  border: none;
}

/* Header Styles */
.viewer-header {
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  padding: 12px 16px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.title-section h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Content Styles */
.viewer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Editor Section */
.editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
  height: 40px; /* Fixed height for header */
}

.editor-label {
  font-weight: 600;
}

.char-count {
  font-family: 'Monaco', 'Consolas', monospace;
}

.editor-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.markdown-editor {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: none;
  outline: none;
  padding: 16px;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  background: #ffffff;
  color: #303133;
  box-sizing: border-box;
  min-height: 200px; /* Ensure minimum height */
}

/* Resize Handle */
.resize-handle {
  height: 8px;
  background: linear-gradient(to bottom, transparent, #e4e7ed, transparent);
  cursor: ns-resize;
  border-top: 1px solid #dcdfe6;
  border-bottom: 1px solid #dcdfe6;
  margin: 0 -16px; /* Extend to container edges */
  position: relative;
  z-index: 10;
}

.resize-handle:hover {
  background: linear-gradient(to bottom, transparent, #409eff, transparent);
  border-top-color: #409eff;
  border-bottom-color: #409eff;
}

/* Preview Section */
.preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-size: 12px;
  color: #909399;
}

.preview-label {
  font-weight: 600;
}

.word-count {
  font-family: 'Monaco', 'Consolas', monospace;
}

.preview-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #ffffff;
}

/* Markdown Content Styles */
.markdown-content {
  line-height: 1.8;
  color: #303133;
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
  color: #303133;
  border-bottom: 2px solid #e4e7ed;
  padding-bottom: 8px;
}

.markdown-content :deep(h2) {
  font-size: 1.5em;
  color: #409eff;
}

.markdown-content :deep(h3) {
  font-size: 1.3em;
  color: #606266;
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
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.9em;
  color: #e6a23c;
}

.markdown-content :deep(pre) {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 12px;
  border-left: 4px solid #409eff;
}

.markdown-content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #303133;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 16px;
  margin: 12px 0;
  color: #909399;
  font-style: italic;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
}

.markdown-content :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #e4e7ed;
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
}

/* Footer Styles */
.viewer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e4e7ed;
  gap: 16px;
}

.footer-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.source-info,
.fetch-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

/* Toast Message */
.toast-message {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

/* Fullscreen Mode */
.markdown-viewer.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  width: 100vw;
  height: 100vh;
}

/* Responsive Styles */
@media (max-width: 767px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .footer-info {
    flex-direction: column;
    gap: 8px;
  }

  .footer-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .markdown-editor {
    font-size: 16px; /* Larger font for mobile */
  }
}

/* Scrollbar Styling */
.preview-container::-webkit-scrollbar,
.editor-container::-webkit-scrollbar {
  width: 8px;
}

.preview-container::-webkit-scrollbar-track,
.editor-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.preview-container::-webkit-scrollbar-thumb,
.editor-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.preview-container::-webkit-scrollbar-thumb:hover,
.editor-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
