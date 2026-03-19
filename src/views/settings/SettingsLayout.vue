<template>
  <div class="settings-layout">
    <div class="settings-header">
      <h1>Settings</h1>
      <p class="settings-subtitle">Configure Your Assistant providers and content</p>
    </div>

    <el-menu :default-active="activeRoute" mode="horizontal" class="settings-nav">
      <el-menu-item index="/settings/content" @click="navigateTo('/settings/content')">
        <el-icon><Document /></el-icon>
        <span>Content</span>
      </el-menu-item>
      <el-menu-item index="/settings/speech" @click="navigateTo('/settings/speech')">
        <el-icon><Microphone /></el-icon>
        <span>Speech</span>
      </el-menu-item>
      <el-menu-item index="/settings/ai" @click="navigateTo('/settings/ai')">
        <el-icon><ChatDotRound /></el-icon>
        <span>AI</span>
      </el-menu-item>
      <el-menu-item index="/settings/electron" @click="navigateTo('/settings/electron')">
        <el-icon><Monitor /></el-icon>
        <span>Overlay</span>
      </el-menu-item>
    </el-menu>

    <div class="settings-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Document, Microphone, ChatDotRound, Monitor } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const activeRoute = computed(() => route.path);

const navigateTo = path => {
  router.push(path);
};
</script>

<style scoped>
.settings-layout {
  width: 400px;
  max-width: 100%;
  margin: 0 auto;
  padding: 24px;
}

@media (min-width: 1400px) {
  .settings-layout {
    width: 960px;
  }
}

.settings-header {
  margin-bottom: 24px;
}

.settings-header h1 {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.settings-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.settings-nav {
  margin-bottom: 32px;
  border-bottom: 2px solid #e4e7ed;
}

.settings-nav .el-menu-item {
  font-size: 16px;
  font-weight: 500;
  padding: 0 20px;
  height: 56px;
  line-height: 56px;
}

.settings-nav .el-menu-item .el-icon {
  margin-right: 8px;
  font-size: 20px;
}

.settings-content {
  background: #ffffff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
  min-height: 600px;
}

@media (max-width: 768px) {
  .settings-layout {
    padding: 16px;
  }

  .settings-header h1 {
    font-size: 24px;
  }

  .settings-nav .el-menu-item {
    padding: 0 12px;
    font-size: 14px;
  }

  .settings-nav .el-menu-item span {
    display: none;
  }

  .settings-content {
    padding: 20px;
  }
}
</style>
