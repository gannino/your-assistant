<template>
  <div id="app">
    <!-- Electron-only: frameless window drag bar -->
    <div v-if="isElectron" class="electron-titlebar" @mousedown="startDrag">
      <span class="titlebar-title">Your Assistant</span>
      <div class="titlebar-controls">
        <el-button :icon="Close" size="small" circle @click="hideWindow" />
      </div>
    </div>

    <el-menu :default-active="activeIndex" mode="horizontal" :router="true">
      <el-menu-item index="/">Your Assistant</el-menu-item>
      <el-menu-item index="/settings/content">Settings</el-menu-item>
    </el-menu>

    <router-view class="router_view" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { Close } from '@element-plus/icons-vue';
import { useElectron } from './composables/useElectron';

const route = useRoute();
const { isElectron, hideWindow, moveWindow } = useElectron();

const activeIndex = computed(() => {
  if (route.path.startsWith('/settings')) return '/settings/content';
  return route.path;
});

onMounted(() => {
  // Apply saved appearance settings
  const _opacity = localStorage.getItem('appearance_opacity');
  const _blur = localStorage.getItem('appearance_blur');
  const savedOpacity = _opacity !== null ? parseFloat(_opacity) : 0.72;
  const savedBlur = _blur !== null ? parseInt(_blur) : 18;
  const root = document.documentElement;
  root.style.setProperty('--bg-primary', `rgba(255,255,255,${savedOpacity.toFixed(2)})`);
  root.style.setProperty('--bg-secondary', `rgba(245,247,250,${(savedOpacity * 0.9).toFixed(2)})`);
  root.style.setProperty('--bg-tertiary', `rgba(250,250,250,${(savedOpacity * 0.83).toFixed(2)})`);
  root.style.setProperty('--backdrop-blur', `blur(${savedBlur}px)`);

  // Apply saved window size in Electron
  if (isElectron) {
    const w = parseInt(localStorage.getItem('electron_win_width')) || 480;
    const h = parseInt(localStorage.getItem('electron_win_height')) || 640;
    window.electronAPI.setWindowSize(w, h);
    window.electronAPI.setOpacity(savedOpacity);
  }
});
onUnmounted(() => {});

// Drag the frameless Electron window
function startDrag(e) {
  if (!isElectron) return;
  let lastX = e.screenX;
  let lastY = e.screenY;

  const onMove = ev => {
    moveWindow(ev.screenX - lastX, ev.screenY - lastY);
    lastX = ev.screenX;
    lastY = ev.screenY;
  };
  const onUp = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}
</script>

<style>
/* ── CSS variable defaults (overridden at runtime by ElectronSettings) ── */
:root {
  --primary-color: #409eff;
  --primary-light: #66b1ff;
  --success-color: #67c23a;
  --danger-color: #f56c6c;
  --bg-primary: rgba(255, 255, 255, 0.72);
  --bg-secondary: rgba(245, 247, 250, 0.65);
  --bg-tertiary: rgba(250, 250, 250, 0.6);
  --text-primary: #303133;
  --text-regular: #606266;
  --text-secondary: #909399;
  --text-placeholder: #c0c4cc;
  --border-base: #dcdfe6;
  --border-light: rgba(228, 231, 237, 0.7);
  --shadow-light: 0 2px 12px rgba(0, 0, 0, 0.06);
  --shadow-base: 0 2px 4px rgba(0, 0, 0, 0.08);
  --backdrop-blur: blur(18px);
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  /* Transparent background when running in Electron */
  background: transparent;
}

.router_view {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.menu-spacer {
  flex: 1;
}

/* ── Electron frameless titlebar ── */
.electron-titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: rgba(245, 247, 250, 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  cursor: move;
  user-select: none;
  -webkit-app-region: drag;
}

.titlebar-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.titlebar-controls {
  display: flex;
  gap: 6px;
  -webkit-app-region: no-drag;
}
</style>
