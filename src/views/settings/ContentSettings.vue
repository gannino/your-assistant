<template>
  <SettingsLayout>
    <div class="content-settings">
      <p class="info-text">
        Configure system prompts and attach context documents for AI responses.
        <a :href="github_url" target="_blank">View documentation</a>
      </p>

      <!-- System Prompt -->
      <section class="settings-section">
        <h2>System Prompt</h2>
        <p class="section-desc">Custom instructions prepended to every AI request</p>
        <el-input
          v-model="gpt_system_prompt"
          type="textarea"
          placeholder="e.g., You are an expert technical assistant. Provide concise, accurate answers."
          :rows="5"
          @change="onKeyChange('gpt_system_prompt')"
        />
      </section>

      <!-- Website Content -->
      <section class="settings-section">
        <h2>🌐 Website Content</h2>
        <p class="section-desc">
          Fetch content from a CV or portfolio website. Used for the first AI question only.
        </p>

        <div class="input-row">
          <el-input
            v-model="websiteUrl"
            placeholder="https://example.com/cv"
            :disabled="fetchingWebsite"
            @keyup.enter="fetchWebsite"
          >
            <template #prepend>URL</template>
          </el-input>
          <el-button
            type="primary"
            :loading="fetchingWebsite"
            :disabled="!websiteUrl.trim()"
            @click="fetchWebsite"
          >
            Fetch
          </el-button>
        </div>

        <el-collapse style="margin-top: 12px">
          <el-collapse-item title="Or paste content manually" name="1">
            <el-input
              v-model="manualWebsiteContent"
              type="textarea"
              :rows="6"
              placeholder="Paste website content here..."
            />
            <el-button
              type="success"
              :disabled="!manualWebsiteContent.trim()"
              style="margin-top: 10px"
              size="small"
              @click="addManualWebsiteContent"
            >
              Add Content
            </el-button>
          </el-collapse-item>
        </el-collapse>

        <div v-if="websiteAttachments.length > 0" class="attachments-list">
          <div v-for="(site, index) in websiteAttachments" :key="index" class="attachment-item">
            <el-icon><Link /></el-icon>
            <span class="attachment-name">{{ site.name }}</span>
            <el-tag size="small">{{ site.lines }} lines</el-tag>
            <el-button :icon="View" circle size="small" @click="openMarkdownViewer(site)" />
            <el-button
              :icon="Delete"
              circle
              size="small"
              type="danger"
              @click="removeWebsite(index)"
            />
          </div>
        </div>
      </section>

      <!-- PDF Attachments -->
      <section class="settings-section">
        <h2>📄 PDF Attachments</h2>
        <p class="section-desc">
          Upload resume or job description. Used for the first AI question only.
        </p>

        <el-upload
          :auto-upload="false"
          :on-change="handleFileChange"
          :before-upload="beforePDFUpload"
          accept=".pdf"
          :limit="5"
          :file-list="pdfFileList"
          drag
          multiple
          class="pdf-upload"
        >
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-text">Drop PDF files here or <em>click to upload</em></div>
          <template #tip>
            <div class="upload-tip">PDF only, max 10MB per file, up to 5 files</div>
          </template>
        </el-upload>

        <div v-if="pdfAttachments.length > 0" class="attachments-list">
          <div v-for="(pdf, index) in pdfAttachments" :key="index" class="attachment-item">
            <el-icon><Document /></el-icon>
            <span class="attachment-name">{{ pdf.name }}</span>
            <el-tag size="small">{{ pdf.lines || pdf.pages }} lines</el-tag>
            <el-tag size="small" type="success">{{ formatFileSize(pdf.size) }}</el-tag>
            <el-button :icon="View" circle size="small" @click="openPDFViewer(pdf)" />
            <el-button :icon="Delete" circle size="small" type="danger" @click="removePDF(index)" />
          </div>
          <el-button size="small" style="margin-top: 12px" @click="clearAllPDFs">
            Clear All PDFs
          </el-button>
        </div>

        <el-alert
          v-if="pdfAttachments.length > 0 || websiteAttachments.length > 0"
          type="success"
          :closable="false"
          style="margin-top: 16px"
        >
          <template #title>
            {{ attachmentCount }} attached — will be used for the first AI question
          </template>
        </el-alert>
      </section>

      <!-- Summarize Context -->
      <section class="settings-section">
        <h2>📋 Summarize Context</h2>
        <p class="section-desc">
          Pre-summarize your attached documents for instant AI responses during sessions.
          <el-tag type="info" size="small" style="margin-left: 8px">Recommended</el-tag>
        </p>

        <!-- Action Buttons - Always Visible -->
        <div class="prepare-actions">
          <div style="display: flex; gap: 12px; flex-wrap: wrap">
            <el-button
              type="primary"
              :loading="isPreparingContext"
              :disabled="attachmentCount === 0"
              size="large"
              @click="prepareContext(false)"
            >
              <el-icon><MagicStick /></el-icon>
              {{ preparedContext ? 'Re-summarize Context' : 'Summarize Context' }}
            </el-button>
            <el-button
              type="warning"
              :loading="isPreparingContext"
              :disabled="attachmentCount === 0"
              size="large"
              @click="prepareContext(true)"
            >
              <el-icon><Lightning /></el-icon>
              Force Summarization
            </el-button>
            <el-button
              v-if="preparedContext"
              type="success"
              :loading="isPreparingContext"
              size="large"
              @click="updateContext"
            >
              <el-icon><Refresh /></el-icon>
              Update Context
            </el-button>
            <el-button
              v-if="preparedContext"
              type="info"
              size="large"
              @click="showContextPreview = true"
            >
              <el-icon><View /></el-icon>
              View Context
            </el-button>
            <el-button
              v-if="preparedContext"
              type="danger"
              size="large"
              @click="clearPreparedContext"
            >
              <el-icon><Delete /></el-icon>
              Clear Cache
            </el-button>
          </div>

          <div v-if="attachmentCount === 0" style="margin-top: 12px">
            <el-text type="info" size="small">
              💡 Attach documents (PDFs or websites) first to summarize context
            </el-text>
          </div>
        </div>

        <!-- Context Cache Status -->
        <div v-if="preparedContext" class="context-cache-status">
          <el-alert type="success" :closable="false" show-icon>
            <template #title>
              <div style="display: flex; align-items: center; gap: 8px">
                <el-icon><MagicStick /></el-icon>
                <span
                  >Context Ready — {{ formatCacheTimestamp(contextCacheMetadata.timestamp) }}</span
                >
              </div>
            </template>
            <div style="margin-top: 8px">
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="Documents">{{
                  contextCacheMetadata.documentCount
                }}</el-descriptions-item>
                <el-descriptions-item label="Total Characters">{{
                  contextCacheMetadata.totalChars.toLocaleString()
                }}</el-descriptions-item>
                <el-descriptions-item label="Cache Version">{{
                  contextCacheMetadata.version
                }}</el-descriptions-item>
                <el-descriptions-item label="Status">
                  <el-tag type="success" size="small">Active</el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-alert>
        </div>

        <!-- Preparation Progress -->
        <div v-if="isPreparingContext" class="preparation-progress">
          <el-progress
            :percentage="100"
            :indeterminate="true"
            :status="preparationProgress.includes('✅') ? 'success' : undefined"
            style="margin-bottom: 12px"
          />
          <el-text type="info">{{ preparationProgress }}</el-text>
        </div>

        <!-- Info Box -->
        <el-alert type="info" :closable="false" show-icon style="margin-top: 16px">
          <template #title> 💡 Why Prepare Context? </template>
          <div style="margin-top: 8px; line-height: 1.6">
            <p style="margin: 0 0 8px 0">
              <strong>Instant Responses:</strong> Pre-summarized context enables immediate AI
              answers without waiting for document processing during sessions.
            </p>
            <p style="margin: 0 0 8px 0">
              <strong>Optimized Performance:</strong> Documents are analyzed once and cached,
              reducing CPU usage and battery drain during sessions.
            </p>
            <p style="margin: 0">
              <strong>Smart Summarization:</strong> Large documents are automatically summarized to
              fit within AI model limits while preserving important information.
            </p>
          </div>
        </el-alert>
      </section>

      <!-- Markdown Viewer Dialog -->
      <el-dialog
        v-model="markdownViewerVisible"
        :title="markdownViewerData.title"
        width="90%"
        :fullscreen="isMobile"
      >
        <MarkdownViewer
          v-if="markdownViewerVisible"
          v-model:markdown-content="markdownViewerData.markdownContent"
          :title="markdownViewerData.title"
          :source-url="markdownViewerData.sourceUrl"
          :fetch-time="markdownViewerData.fetchTime"
          :is-attached="markdownViewerData.isAttached"
          @close="closeMarkdownViewer"
          @attach="attachMarkdownContent"
        />
      </el-dialog>

      <!-- Prepared Context Preview Dialog -->
      <el-dialog
        v-model="showContextPreview"
        title="📊 Summarized Context"
        width="80%"
        :close-on-click-modal="false"
        class="context-preview-dialog"
      >
        <template #header>
          <div class="dialog-header">
            <div class="header-title">
              <el-icon><Document /></el-icon>
              <span>Summarized Context</span>
            </div>
            <div class="header-actions">
              <el-tag type="success" size="small">
                {{ preparedContext ? preparedContext.length.toLocaleString() : 0 }} chars
              </el-tag>
              <el-tag v-if="contextCacheMetadata.timestamp" type="info" size="small">
                Updated {{ formatCacheTimestamp(contextCacheMetadata.timestamp) }}
              </el-tag>
            </div>
          </div>
        </template>

        <div class="context-preview-content">
          <div v-if="preparedContext" class="context-text">
            <MarkdownViewer
              v-model:markdown-content="preparedContext"
              :title="'Summarized Context'"
              :source-url="'Cached Context'"
              :fetch-time="formatCacheTimestamp(contextCacheMetadata.timestamp)"
              :is-attached="false"
            />
          </div>
          <div v-else class="no-context">
            <el-empty description="No prepared context available">
              <el-button type="primary" @click="prepareContext"> Summarize Now </el-button>
            </el-empty>
          </div>
        </div>

        <template #footer>
          <div class="dialog-footer">
            <div class="context-info">
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="Documents">
                  {{ contextCacheMetadata.documentCount || 0 }} attached
                </el-descriptions-item>
                <el-descriptions-item label="Total Characters">
                  {{ (contextCacheMetadata.totalChars || 0).toLocaleString() }}
                </el-descriptions-item>
                <el-descriptions-item v-if="contextCacheMetadata.timestamp" label="Last Updated">
                  {{ formatCacheTimestamp(contextCacheMetadata.timestamp) }}
                </el-descriptions-item>
                <el-descriptions-item label="Cache Version">
                  {{ contextCacheMetadata.version || '1.0' }}
                </el-descriptions-item>
              </el-descriptions>
              <el-divider style="margin: 12px 0" />
              <el-text size="small" type="info">
                💡 This summarized context will be used for all session questions. Click "Update
                Context" to refresh when documents change.
              </el-text>
            </div>
            <div class="footer-actions">
              <el-button @click="showContextPreview = false">Close</el-button>
              <el-button type="primary" @click="copyPreparedContext"> Copy to Clipboard </el-button>
              <el-button type="success" @click="exportPreparedContext">
                <el-icon><Download /></el-icon>
                Export as File
              </el-button>
            </div>
          </div>
        </template>
      </el-dialog>
    </div>
  </SettingsLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Document,
  Link,
  View,
  Delete,
  UploadFilled,
  MagicStick,
  Refresh,
  Download,
  Lightning,
} from '@element-plus/icons-vue';
import SettingsLayout from './SettingsLayout.vue';
import MarkdownViewer from '../../components/MarkdownViewer.vue';
import config_util from '../../utils/config_util';
import { convertPDFToMarkdown, validatePDF } from '../../utils/pdf_util';
import {
  fetchWebsiteToMarkdown,
  validateWebsiteUrl,
  getDomainFromUrl,
} from '../../utils/website_util';
import { providerRegistry } from '../../services/ai/providerRegistry';

const isMobile = ref(window.innerWidth <= 768);
const github_url = 'https://github.com/gannino/your-assistant';

const gpt_system_prompt = ref('');
const websiteUrl = ref('');
const fetchingWebsite = ref(false);
const websiteAttachments = ref([]);
const manualWebsiteContent = ref('');
const pdfFileList = ref([]);
const pdfAttachments = ref([]);

const markdownViewerVisible = ref(false);
const markdownViewerData = ref({
  title: '',
  markdownContent: '',
  sourceUrl: '',
  fetchTime: '',
  isAttached: false,
});

// Context preparation state
const isPreparingContext = ref(false);
const preparedContext = ref(null);
const preparationProgress = ref('');
const showContextPreview = ref(false);

// Context cache metadata
const contextCacheMetadata = ref({
  timestamp: null,
  documentCount: 0,
  totalChars: 0,
  version: '1.0',
});

const attachmentCount = computed(() => {
  const parts = [];
  if (pdfAttachments.value.length > 0)
    parts.push(`${pdfAttachments.value.length} PDF${pdfAttachments.value.length > 1 ? 's' : ''}`);
  if (websiteAttachments.value.length > 0)
    parts.push(
      `${websiteAttachments.value.length} site${websiteAttachments.value.length > 1 ? 's' : ''}`
    );
  return parts.join(' + ');
});

const updateAttachmentsStorage = () => {
  const all = [
    ...pdfAttachments.value.map(p => ({ ...p, source: 'pdf' })),
    ...websiteAttachments.value.map(w => ({ ...w, source: 'website' })),
  ];
  localStorage.setItem('context_attachments', JSON.stringify(all));
};

const onKeyChange = key_name => {
  localStorage.setItem(key_name, gpt_system_prompt.value);
};

// PDF
const beforePDFUpload = file => {
  const validation = validatePDF(file);
  if (!validation.valid) {
    ElMessage.error(validation.error);
    return false;
  }
  return true;
};

const handleFileChange = async (uploadFile, uploadFiles) => {
  for (const file of uploadFiles.map(f => f.raw).filter(Boolean)) {
    if (pdfAttachments.value.some(p => p.name === file.name)) {
      ElMessage.warning(`${file.name} already uploaded`);
      continue;
    }
    try {
      ElMessage.info(`Converting ${file.name}...`);
      const markdown = await convertPDFToMarkdown(file);
      pdfAttachments.value.push({
        name: file.name,
        markdown,
        file,
        size: file.size,
        lines: markdown.split('\n').length,
      });
      updateAttachmentsStorage();
      ElMessage.success(`Converted ${file.name}`);

      // Clear prepared context since documents changed
      if (preparedContext.value) {
        preparedContext.value = null;
        contextCacheMetadata.value = {
          timestamp: null,
          documentCount: 0,
          totalChars: 0,
          version: '1.0',
        };
        localStorage.removeItem('prepared_context');
        console.log('[Context] Prepared context cleared - PDF added');
      }
    } catch (error) {
      ElMessage.error(`Failed: ${error.message}`);
    }
  }
  pdfFileList.value = [];
};

const removePDF = index => {
  const removed = pdfAttachments.value.splice(index, 1);
  ElMessage.info(`Removed ${removed[0].name}`);
  updateAttachmentsStorage();

  // Clear prepared context since documents changed
  if (preparedContext.value) {
    preparedContext.value = null;
    contextCacheMetadata.value = {
      timestamp: null,
      documentCount: 0,
      totalChars: 0,
      version: '1.0',
    };
    localStorage.removeItem('prepared_context');
    console.log('[Context] Prepared context cleared - documents changed');
  }
};

const clearAllPDFs = () => {
  pdfAttachments.value = [];
  pdfFileList.value = [];
  updateAttachmentsStorage();
  ElMessage.info('All PDFs cleared');

  // Clear prepared context since documents changed
  if (preparedContext.value) {
    preparedContext.value = null;
    contextCacheMetadata.value = {
      timestamp: null,
      documentCount: 0,
      totalChars: 0,
      version: '1.0',
    };
    localStorage.removeItem('prepared_context');
    console.log('[Context] Prepared context cleared - all PDFs removed');
  }
};

const formatFileSize = bytes => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const openPDFViewer = pdf => {
  markdownViewerData.value = {
    title: pdf.name,
    markdownContent: pdf.markdown,
    sourceUrl: 'PDF Document',
    fetchTime: 'Converted from PDF',
    isAttached: false,
  };
  markdownViewerVisible.value = true;
};

// Website
const fetchWebsite = async () => {
  const url = websiteUrl.value.trim();
  if (!url) {
    ElMessage.warning('Please enter a URL');
    return;
  }
  const validation = validateWebsiteUrl(url);
  if (!validation.valid) {
    ElMessage.error(validation.error);
    return;
  }
  if (websiteAttachments.value.some(s => s.url === url)) {
    ElMessage.warning('Already fetched');
    return;
  }

  fetchingWebsite.value = true;
  try {
    ElMessage.info(`Fetching ${getDomainFromUrl(url)}...`);
    const markdown = await fetchWebsiteToMarkdown(url);
    websiteAttachments.value.push({
      name: getDomainFromUrl(url),
      markdown,
      url,
      lines: markdown.split('\n').length,
    });
    updateAttachmentsStorage();
    ElMessage.success(`Fetched ${getDomainFromUrl(url)}`);
    websiteUrl.value = '';

    // Clear prepared context since documents changed
    if (preparedContext.value) {
      preparedContext.value = null;
      contextCacheMetadata.value = {
        timestamp: null,
        documentCount: 0,
        totalChars: 0,
        version: '1.0',
      };
      localStorage.removeItem('prepared_context');
      console.log('[Context] Prepared context cleared - website added');
    }
  } catch (error) {
    ElMessage.error(`Failed: ${error.message}`);
  } finally {
    fetchingWebsite.value = false;
  }
};

const removeWebsite = index => {
  const removed = websiteAttachments.value.splice(index, 1);
  ElMessage.info(`Removed ${removed[0].name}`);
  updateAttachmentsStorage();

  // Clear prepared context since documents changed
  if (preparedContext.value) {
    preparedContext.value = null;
    contextCacheMetadata.value = {
      timestamp: null,
      documentCount: 0,
      totalChars: 0,
      version: '1.0',
    };
    localStorage.removeItem('prepared_context');
    console.log('[Context] Prepared context cleared - website removed');
  }
};

const addManualWebsiteContent = () => {
  const content = manualWebsiteContent.value.trim();
  if (!content) {
    ElMessage.warning('Please paste content first');
    return;
  }
  const name = `Manual Content ${websiteAttachments.value.length + 1}`;
  websiteAttachments.value.push({
    name,
    markdown: content,
    url: null,
    lines: content.split('\n').length,
  });
  updateAttachmentsStorage();
  ElMessage.success('Added manual content');
  manualWebsiteContent.value = '';

  // Clear prepared context since documents changed
  if (preparedContext.value) {
    preparedContext.value = null;
    contextCacheMetadata.value = {
      timestamp: null,
      documentCount: 0,
      totalChars: 0,
      version: '1.0',
    };
    localStorage.removeItem('prepared_context');
    console.log('[Context] Prepared context cleared - manual content added');
  }
};

const openMarkdownViewer = site => {
  markdownViewerData.value = {
    title: site.name,
    markdownContent: site.markdown,
    sourceUrl: site.url || 'Manual Content',
    fetchTime: site.url ? new Date().toLocaleString() : 'Manual',
    isAttached: false,
  };
  markdownViewerVisible.value = true;
};

const closeMarkdownViewer = () => {
  markdownViewerVisible.value = false;
};

const attachMarkdownContent = attachment => {
  pdfAttachments.value.push({
    name: attachment.name,
    markdown: attachment.markdown,
    file: null,
    size: attachment.size || attachment.markdown.length,
    lines: attachment.markdown.split('\n').length,
  });
  updateAttachmentsStorage();
  ElMessage.success(`Attached ${attachment.name}`);
  closeMarkdownViewer();
};

// Context preparation functions
const getAllContextAttachments = () => {
  return [
    ...pdfAttachments.value.map(p => ({ ...p, source: 'pdf' })),
    ...websiteAttachments.value.map(w => ({ ...w, source: 'website' })),
  ];
};

const getPlatformLimits = () => {
  const isMobile = window.innerWidth <= 768;
  return {
    maxContext: isMobile ? 50000 : 100000, // Mobile: 12.5k tokens, Desktop: 25k tokens
    maxTranscriptionLength: isMobile ? 10000 : 15000,
    maxAIResponseLength: isMobile ? 30000 : 50000,
  };
};

const prepareContext = async (forceSummarize = false) => {
  const contextAttachments = getAllContextAttachments();
  if (contextAttachments.length === 0) {
    ElMessage.warning('Please attach documents first before preparing for a session.');
    return;
  }

  if (preparedContext.value && !forceSummarize) {
    showContextPreview.value = true;
    return;
  }

  // If force summarizing and context already exists, confirm first
  if (preparedContext.value && forceSummarize) {
    const isWithinLimits =
      contextAttachments.reduce((sum, att) => sum + att.markdown.length, 0) <=
      getPlatformLimits().maxContext;

    try {
      await ElMessageBox.confirm(
        isWithinLimits
          ? 'This will compress your existing prepared context for even faster AI responses. Continue?'
          : 'This will replace your existing prepared context with a new summarized version. Continue?',
        'Force Summarization',
        {
          confirmButtonText: 'Yes, summarize',
          cancelButtonText: 'Cancel',
          type: 'warning',
        }
      );
    } catch {
      // User cancelled
      return;
    }
  }

  isPreparingContext.value = true;
  preparationProgress.value = forceSummarize
    ? '⚡ Force summarizing documents...'
    : 'Starting preparation...';

  try {
    const limits = getPlatformLimits();
    const totalContextLength = contextAttachments.reduce(
      (sum, att) => sum + att.markdown.length,
      0
    );

    console.log('[Context Prep] Starting context preparation');
    console.log('[Context Prep] Total context length:', totalContextLength, 'chars');
    console.log('[Context Prep] Context limit:', limits.maxContext, 'chars');
    console.log('[Context Prep] Force summarization:', forceSummarize);

    // Clear old context cache only if we're re-summarizing from scratch (not compressing)
    if (forceSummarize && preparedContext.value && totalContextLength > limits.maxContext) {
      console.log('[Context Prep] Clearing old context cache for re-summarization');
      contextCacheMetadata.value = null;
      localStorage.removeItem('prepared_context_metadata');
      // Note: We keep preparedContext.value for now, will replace after successful summarization
    }

    // Check if context fits without summarization (unless force summarization is enabled)
    if (totalContextLength <= limits.maxContext && !forceSummarize) {
      preparationProgress.value = '✅ Context fits within limit, no summarization needed';

      const combinedContext = contextAttachments
        .map(att => `## ${att.name}\n\n${att.markdown}`)
        .join('\n\n---\n\n');

      preparedContext.value = combinedContext;
      console.log('[Context Prep] Context fits within limit, no summarization needed');
    } else if (forceSummarize && preparedContext.value && totalContextLength <= limits.maxContext) {
      // Smart force summarization: summarize the existing prepared context instead of original attachments
      console.log('[Context Prep] Force summarizing existing prepared context');
      preparationProgress.value = '⚡ Compressing prepared context for even faster responses...';

      try {
        // Calculate proportional summary target (aim for 50-70% of current size)
        const currentContextLength = preparedContext.value.length;
        const targetMin = Math.floor(currentContextLength * 0.5);
        const targetMax = Math.floor(currentContextLength * 0.7);

        console.log(
          `[Context Prep] Compressing context from ${currentContextLength} chars to ${targetMin}-${targetMax} chars`
        );

        // Create a mock attachment from the prepared context
        const contextAttachment = {
          name: 'Prepared Session Context',
          markdown: preparedContext.value,
          source: 'prepared',
        };

        const compressedContext = await summarizeContextAttachments([contextAttachment], targetMax);

        preparedContext.value = compressedContext;
        preparationProgress.value = '✅ Context compressed successfully!';
        console.log('[Context Prep] Context compressed successfully');
      } catch (error) {
        console.error('[Context Prep] Failed to compress prepared context:', error);
        preparationProgress.value = '⚠️ Compression failed, keeping original context';
        // Keep the original prepared context if compression fails
      }
    } else {
      // Normal summarization flow (original attachments are too large)
      const message = forceSummarize
        ? '⚡ Force summarizing documents for faster responses...'
        : '📊 Analyzing documents and generating summaries...';
      preparationProgress.value = message;

      const summarizedContext = await summarizeContextAttachments(
        contextAttachments,
        limits.maxContext
      );
      preparedContext.value = summarizedContext;
      preparationProgress.value = '✅ Context prepared and optimized!';
      console.log('[Context Prep] Context summarized successfully');
    }

    // Update cache metadata (common to all paths)
    contextCacheMetadata.value = {
      timestamp: new Date().toISOString(),
      documentCount: contextAttachments.length,
      totalChars: preparedContext.value.length,
      version: '1.0',
    };

    // Save prepared context with metadata to localStorage
    const cacheData = {
      context: preparedContext.value,
      metadata: contextCacheMetadata.value,
    };
    localStorage.setItem('prepared_context', JSON.stringify(cacheData));
    console.log('[Context Prep] Context saved to localStorage with metadata');

    ElMessage.success(
      forceSummarize
        ? 'Context force-summarized successfully! AI responses will be even faster.'
        : 'Session context prepared! You can now start the session for instant responses.'
    );
  } catch (error) {
    console.error('[Context Prep] Failed to prepare context:', error);
    preparationProgress.value = '❌ Preparation failed. Using raw context during session.';
    ElMessage.error('Failed to prepare context. Will use raw documents during session.');
  } finally {
    isPreparingContext.value = false;
  }
};

const updateContext = async () => {
  const contextAttachments = getAllContextAttachments();
  if (contextAttachments.length === 0) {
    ElMessage.warning('No documents attached to update context from.');
    return;
  }

  try {
    await ElMessageBox.confirm(
      'This will re-summarize your documents and update the cached context. The process may take a minute.',
      'Update Session Context',
      {
        confirmButtonText: 'Update',
        cancelButtonText: 'Cancel',
        type: 'info',
      }
    );
  } catch {
    return;
  }

  isPreparingContext.value = true;
  preparationProgress.value = '🔄 Refreshing context...';

  try {
    const limits = getPlatformLimits();
    const totalContextLength = contextAttachments.reduce(
      (sum, att) => sum + att.markdown.length,
      0
    );

    console.log('[Context Update] Starting context refresh');
    console.log('[Context Update] Total context length:', totalContextLength, 'chars');

    if (totalContextLength <= limits.maxContext) {
      preparationProgress.value = '✅ Context fits within limit, no summarization needed';
      const combinedContext = contextAttachments
        .map(att => `## ${att.name}\n\n${att.markdown}`)
        .join('\n\n---\n\n');
      preparedContext.value = combinedContext;
    } else {
      preparationProgress.value = '📊 Re-analyzing documents and generating summaries...';
      const summarizedContext = await summarizeContextAttachments(
        contextAttachments,
        limits.maxContext
      );
      preparedContext.value = summarizedContext;
      preparationProgress.value = '✅ Context updated successfully!';
      console.log('[Context Update] Context re-summarized successfully');
    }

    contextCacheMetadata.value = {
      timestamp: new Date().toISOString(),
      documentCount: contextAttachments.length,
      totalChars: preparedContext.value.length,
      version: '1.0',
    };

    const cacheData = {
      context: preparedContext.value,
      metadata: contextCacheMetadata.value,
    };
    localStorage.setItem('prepared_context', JSON.stringify(cacheData));
    console.log('[Context Update] Context saved to localStorage with metadata');

    ElMessage.success('Session context updated successfully!');
  } catch (error) {
    console.error('[Context Update] Failed to update context:', error);
    preparationProgress.value = '❌ Update failed. Using previous context.';
    ElMessage.error('Failed to update context. Previous context is still available.');
  } finally {
    isPreparingContext.value = false;
  }
};

const clearPreparedContext = async () => {
  try {
    await ElMessageBox.confirm(
      'This will clear the cached session context. You will need to prepare it again before the next session.',
      'Clear Context Cache',
      {
        confirmButtonText: 'Clear',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );
  } catch {
    return;
  }

  preparedContext.value = null;
  contextCacheMetadata.value = {
    timestamp: null,
    documentCount: 0,
    totalChars: 0,
    version: '1.0',
  };
  preparationProgress.value = '';
  localStorage.removeItem('prepared_context');
  console.log('[Context Prep] Cleared prepared context');
  ElMessage.success('Context cache cleared successfully.');
};

const loadPreparedContext = () => {
  try {
    const savedData = localStorage.getItem('prepared_context');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      preparedContext.value = parsed.context;
      contextCacheMetadata.value = parsed.metadata || {
        timestamp: null,
        documentCount: 0,
        totalChars: 0,
        version: '1.0',
      };

      console.log('[Context Prep] Loaded previously prepared context from localStorage');
      console.log('[Context Prep] Context length:', parsed.context.length, 'chars');
      console.log('[Context Prep] Cache metadata:', contextCacheMetadata.value);
      return true;
    }
  } catch (error) {
    console.error('[Context Prep] Failed to load cached context:', error);
    localStorage.removeItem('prepared_context');
  }
  return false;
};

const formatCacheTimestamp = timestamp => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

// Context summarization function
const summarizeContextAttachments = async (attachments, maxContext) => {
  // Timeout wrapper for API calls
  const withTimeout = (promise, timeoutMs, operation) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout: ${operation} took longer than ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  };

  // Split content into chunks for summarization
  const splitIntoChunks = (content, maxChunkSize) => {
    const chunks = [];
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    console.log(`[Context Summary] Split content into ${chunks.length} chunks`);
    return chunks;
  };

  // Summarize a large document using chunking strategy
  const summarizeLargeContent = async (content, label, maxAllowedLength) => {
    // Calculate proportional summary length based on content size
    // Aim for 10-20% of original length, bounded by reasonable limits
    const minSummaryLength = 500; // Minimum 500 chars
    const maxSummaryLength = maxAllowedLength; // Maximum allowed length
    const contentLength = content.length;

    // Proportional summary: 10-20% of original length
    const proportionalMin = Math.floor(contentLength * 0.1);
    const proportionalMax = Math.floor(contentLength * 0.2);

    // Apply bounds
    const targetMin = Math.max(minSummaryLength, Math.min(proportionalMin, maxSummaryLength));
    const targetMax = Math.max(minSummaryLength * 1.5, Math.min(proportionalMax, maxSummaryLength));

    console.log(
      `[Context Summary] Content: ${content.length} chars → Target summary: ${targetMin}-${targetMax} chars (${Math.round((targetMin / content.length) * 100)}-${Math.round((targetMax / content.length) * 100)}% of original)`
    );

    const maxChunkSize = 15000; // 15k chars per chunk (safe for most models)
    const chunks = splitIntoChunks(content, maxChunkSize);

    if (chunks.length === 1) {
      // Content is small enough to summarize directly
      const targetWordsMin = Math.floor(targetMin / 5); // Roughly 5 chars per word
      const targetWordsMax = Math.floor(targetMax / 5);
      const prompt = `Please summarize the following content in approximately ${targetWordsMin}-${targetWordsMax} words (about ${targetMin}-${targetMax} characters). Focus on key information and main points.\n\n${content}\n\nIMPORTANT: Provide only the summary. Do not offer to create additional documents, executive summaries, or follow-up materials.`;
      return await provider.generateCompletion(prompt, {
        temperature: config.temperature,
        max_completion_tokens: Math.ceil(targetMax * 1.5),
      });
    }

    // Summarize each chunk proportionally
    console.log(`[Context Summary] Summarizing ${chunks.length} chunks for ${label}...`);
    const chunkSummaries = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(
        `[Context Summary] Processing chunk ${i + 1}/${chunks.length} for ${label}... (${chunk.length} chars)`
      );

      // Calculate proportional target for this chunk
      const chunkProportionalMin = Math.floor(chunk.length * 0.1);
      const chunkProportionalMax = Math.floor(chunk.length * 0.2);
      const chunkTargetMin = Math.max(
        200,
        Math.min(chunkProportionalMin, Math.floor(targetMax / chunks.length))
      );
      const chunkTargetMax = Math.max(
        300,
        Math.min(chunkProportionalMax, Math.floor(targetMax / (chunks.length - 1 || 1)))
      );

      const chunkWordsMin = Math.floor(chunkTargetMin / 5);
      const chunkWordsMax = Math.floor(chunkTargetMax / 5);

      const prompt = `Please summarize this section in approximately ${chunkWordsMin}-${chunkWordsMax} words (about ${chunkTargetMin}-${chunkTargetMax} characters). Focus on key information and main points.\n\n${chunk}\n\nIMPORTANT: Provide only the summary. Do not offer to create additional documents, executive summaries, or follow-up materials.`;

      try {
        const chunkSummary = await withTimeout(
          provider.generateCompletion(prompt, {
            temperature: config.temperature,
            max_completion_tokens: Math.ceil(chunkTargetMax * 1.5),
          }),
          120000,
          `summarize chunk ${i + 1} of ${label}`
        );

        if (chunkSummary?.trim()) {
          chunkSummaries.push(chunkSummary.trim());
        }
      } catch (error) {
        console.error(`[Context Summary] Failed to summarize chunk ${i + 1}:`, error);
        // Use truncated chunk as fallback
        chunkSummaries.push(chunk.substring(0, chunkTargetMax * 2));
      }
    }

    // Combine chunk summaries
    const combinedSummaries = chunkSummaries.join('\n\n---\n\n');
    console.log(`[Context Summary] Combined chunk summaries: ${combinedSummaries.length} chars`);

    // If combined summaries are still too long, summarize them again
    if (combinedSummaries.length > targetMax * 3) {
      console.log(
        `[Context Summary] Combined summaries too long (${combinedSummaries.length} chars), doing final consolidation to ${targetMin}-${targetMax} chars...`
      );
      const finalWordsMin = Math.floor(targetMin / 5);
      const finalWordsMax = Math.floor(targetMax / 5);
      const finalPrompt = `Please consolidate these section summaries into a single coherent summary in approximately ${finalWordsMin}-${finalWordsMax} words (about ${targetMin}-${targetMax} characters).\n\n${combinedSummaries}\n\nIMPORTANT: Provide only the consolidated summary. Do not offer to create additional documents, executive summaries, or follow-up materials.`;

      try {
        const finalSummary = await withTimeout(
          provider.generateCompletion(finalPrompt, {
            temperature: config.temperature,
            max_completion_tokens: Math.ceil(targetMax * 1.5),
          }),
          120000,
          `finalize summary for ${label}`
        );

        return finalSummary || combinedSummaries;
      } catch (error) {
        console.error(`[Context Summary] Failed to create final summary:`, error);
        return combinedSummaries;
      }
    }

    return combinedSummaries;
  };
  const provider = providerRegistry.get(config_util.ai_provider());
  if (!provider) {
    throw new Error('AI provider not found');
  }

  const config = getProviderConfig(config_util.ai_provider());
  await provider.initialize(config);

  const totalLength = attachments.reduce((sum, att) => sum + att.markdown.length, 0);
  const targetLength = Math.floor(maxContext / attachments.length);

  console.log('[Context Summary] Total context:', totalLength, 'chars');
  console.log('[Context Summary] Target per attachment:', targetLength, 'chars');

  const summaries = [];
  let attachmentIndex = 0;

  for (const attachment of attachments) {
    attachmentIndex++;
    preparationProgress.value = `⚡ Processing attachment ${attachmentIndex}/${attachments.length}: ${attachment.name}...`;
    const label = attachment.name;
    console.log(`[Context Summary] Processing attachment: ${label}`);

    try {
      console.log(`[Context Summary] Processing ${label} (${attachment.markdown.length} chars)...`);
      await provider.initialize(getProviderConfig(config_util.ai_provider()));

      // Use chunked summarization for better accuracy
      const summary = await withTimeout(
        summarizeLargeContent(attachment.markdown, label, targetLength),
        300000, // 5 minute timeout for chunked summarization
        `summarize ${label}`
      );

      console.log(
        `[Context Summary] Got summary for ${label}:`,
        summary?.substring(0, 100) + '...'
      );

      if (summary && summary.trim()) {
        summaries.push(`## ${label}\n\n${summary}`);
      } else {
        console.warn(`[Context Summary] Empty summary for ${label}, using original content`);
        // Use original content if summarization fails
        summaries.push(`## ${label}\n\n${attachment.markdown}`);
      }
    } catch (error) {
      console.error(`[Context Summary] Failed to summarize ${label}:`, error);
      console.error(`[Context Summary] Error details:`, error.message, error.stack);
      // Use original content if summarization fails
      summaries.push(`## ${label}\n\n${attachment.markdown}`);
    }
  }

  const result = summaries.join('\n\n---\n\n');
  console.log(`[Context Summary] Final summarized context: ${result.length} chars`);
  return result;
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
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
};

const copyPreparedContext = async () => {
  try {
    await navigator.clipboard.writeText(preparedContext.value);
    ElMessage.success('Context copied to clipboard!');
  } catch (error) {
    console.error('[Context] Failed to copy to clipboard:', error);
    ElMessage.error('Failed to copy to clipboard');
  }
};

const exportPreparedContext = () => {
  try {
    const blob = new Blob([preparedContext.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-context-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    ElMessage.success('Context exported successfully!');
  } catch (error) {
    console.error('[Context] Failed to export context:', error);
    ElMessage.error('Failed to export context');
  }
};

onMounted(() => {
  gpt_system_prompt.value = config_util.gpt_system_prompt();

  const stored = localStorage.getItem('context_attachments');
  if (stored) {
    try {
      const all = JSON.parse(stored);
      pdfAttachments.value = all.filter(a => a.source === 'pdf');
      websiteAttachments.value = all.filter(a => a.source === 'website');
    } catch (e) {
      console.error('Failed to load attachments:', e);
    }
  }

  // Load previously prepared context
  if (loadPreparedContext()) {
    console.log('[Context Prep] Found previously prepared context - ready to use!');
  }

  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768;
  });
});
</script>

<style scoped>
.content-settings {
  max-width: 100%;
}

.info-text {
  color: #606266;
  font-size: 14px;
  margin-bottom: 32px;
  line-height: 1.6;
}

.info-text a,
.section-desc a {
  color: #409eff;
  text-decoration: none;
}

.settings-section {
  margin-bottom: 40px;
}
.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.section-desc {
  font-size: 14px;
  color: #909399;
  margin: 0 0 16px 0;
}

.input-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.input-row .el-input {
  flex: 1;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 12px;
}
.upload-text {
  font-size: 14px;
  color: #606266;
}
.upload-text em {
  color: #409eff;
  font-style: normal;
}
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.attachments-list {
  margin-top: 16px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.attachment-name {
  flex: 1;
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .input-row {
    flex-direction: column;
  }
  .attachment-item {
    flex-wrap: wrap;
  }
}

/* Context Preview Dialog Styles */
.context-preview-dialog .dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 0;
  flex-wrap: wrap;
}

.context-preview-dialog .header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.context-preview-dialog .header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.context-preview-dialog .context-preview-content {
  max-height: 60vh;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 8px;
  background: #f5f7fa;
  padding: 16px;
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

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
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
  hyphens: auto;
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

/* Mobile Optimizations */
@media (max-width: 767px) {
  .context-preview-dialog {
    width: 95% !important;
    max-width: 95% !important;
    margin: 20px auto !important;
  }

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

  .context-preview-dialog .context-preview-content {
    max-height: 70vh;
    padding: 12px;
    background: #ffffff;
    border: 1px solid #e4e7ed;
    -webkit-overflow-scrolling: touch;
  }

  .context-preview-dialog .context-preview-content::-webkit-scrollbar {
    display: none;
  }

  .context-preview-dialog .context-preview-content {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .context-preview-dialog .context-text pre {
    font-size: 13px;
    line-height: 1.8;
    color: #2c3e50;
    text-rendering: optimizeLegibility;
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
}

/* Touch-Friendly Improvements */
@media (hover: none) and (pointer: coarse) {
  .context-preview-dialog .context-preview-content {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }

  .context-preview-dialog .footer-actions .el-button {
    min-height: 44px;
    min-width: 44px;
    font-size: 14px;
    padding: 12px 20px;
  }

  .context-preview-dialog .context-text pre {
    -webkit-user-select: text;
    user-select: text;
    -webkit-tap-highlight-color: transparent;
  }
}

/* Action Buttons Styles */
.prepare-actions {
  margin-top: 16px;
  padding: 20px;
  background: #f0f9ff;
  border: 2px dashed #409eff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prepare-actions .el-button {
  min-height: 40px;
  font-weight: 500;
}

/* Cache Status Styles */
.context-cache-status {
  margin-top: 16px;
}

.preparation-progress {
  margin-top: 16px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.no-context-prepared {
  margin-top: 16px;
}

/* Dark Mode Support */
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
</style>
