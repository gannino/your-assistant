<template>
  <div id="app" :class="{ 'electron-app': isElectron }">
    <!-- Electron-only: frameless window drag bar -->
    <div v-if="isElectron" class="electron-titlebar">
      <!-- Left spacer for system buttons (macOS traffic lights) -->
      <div class="titlebar-spacer-left"></div>

      <!-- Centered title -->
      <span class="titlebar-title" @mousedown="startDrag">Your Assistant {{ appVersion }}</span>

      <!-- Right controls -->
      <div class="titlebar-controls">
        <el-button :icon="Close" size="small" circle @click="hideWindow" />
      </div>
    </div>

    <el-menu :default-active="activeIndex" mode="horizontal" :router="true">
      <el-menu-item index="/">Your Assistant {{ appVersion }}</el-menu-item>
      <el-menu-item index="/settings/content">Settings</el-menu-item>
    </el-menu>

    <router-view class="router_view" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Close } from '@element-plus/icons-vue';
import { useElectron } from './composables/useElectron';
import { initializeTheme } from './utils/theme_util';

const route = useRoute();
const { isElectron, hideWindow, moveWindow } = useElectron();

// App version - injected during build
const appVersion = ref(import.meta.env.VUE_APP_VERSION || '1.0.0');

const activeIndex = computed(() => {
  if (route.path.startsWith('/settings')) return '/settings/content';
  return route.path;
});

let cleanupTheme = null;

onMounted(() => {
  // Initialize theme system
  cleanupTheme = initializeTheme();

  // Apply saved appearance settings
  const _opacity = localStorage.getItem('appearance_opacity');
  const savedOpacity = _opacity !== null ? parseFloat(_opacity) : 0.72;

  // Apply saved window size in Electron
  if (isElectron) {
    const w = parseInt(localStorage.getItem('electron_win_width')) || 480;
    const h = parseInt(localStorage.getItem('electron_win_height')) || 640;
    window.electronAPI.setWindowSize(w, h);
    window.electronAPI.setOpacity(savedOpacity);
  }
});

onUnmounted(() => {
  if (cleanupTheme) cleanupTheme();
});

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
  --bg-solid: #ffffff;
  --bg-info-light: #f0f9ff;
  --bg-scrollbar-track: #f1f1f1;
  --bg-scrollbar-thumb: #c1c1c1;
  --bg-scrollbar-thumb-hover: #a8a8a8;
  --text-primary: #303133;
  --text-regular: #606266;
  --text-secondary: #909399;
  --text-placeholder: #c0c4cc;
  --border-base: #dcdfe6;
  --border-light: rgba(228, 231, 237, 0.7);
  --warning-color: #e6a23c;
  --shadow-light: 0 2px 12px rgba(0, 0, 0, 0.06);
  --shadow-base: 0 2px 4px rgba(0, 0, 0, 0.08);
  --backdrop-blur: blur(18px);
}

/* ── Dark Mode Theme ── */
:root[data-theme='dark'] {
  --bg-primary: rgba(30, 30, 30, 0.85);
  --bg-secondary: rgba(40, 40, 40, 0.8);
  --bg-tertiary: rgba(50, 50, 50, 0.75);
  --bg-solid: #1a1a1a;
  --bg-info-light: rgba(30, 58, 95, 0.8);
  --bg-scrollbar-track: #2a2a2a;
  --bg-scrollbar-thumb: #4a4a4a;
  --bg-scrollbar-thumb-hover: #5a5a5a;
  --text-primary: #ffffff;
  --text-regular: #e0e0e0;
  --text-secondary: #c0c0c0;
  --text-placeholder: #909090;
  --border-base: #4c4d4f;
  --border-light: rgba(76, 77, 79, 0.7);
  --warning-color: #f0a030;
  --shadow-light: 0 2px 12px rgba(0, 0, 0, 0.25);
  --shadow-base: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Make text bolder in dark mode for better visibility */
[data-theme='dark'] #app,
[data-theme='dark'] body,
[data-theme='dark'] .settings-section h2,
[data-theme='dark'] .form-group label,
[data-theme='dark'] .section-desc,
[data-theme='dark'] .info-text,
[data-theme='dark'] .field-hint,
[data-theme='dark'] .checkbox-desc {
  font-weight: 500;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: transparent;
}

.router_view {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  background: transparent;
}

/* Global body background — solid in browser, transparent in Electron (OS desktop shows through) */
body {
  background-color: var(--bg-solid);
  color: var(--text-primary);
}

/* In Electron the window is transparent — body must be clear so CSS backdrop-filter blurs the OS desktop */
.electron-app body {
  background-color: transparent !important;
}

.menu-spacer {
  flex: 1;
}

/* ── Electron frameless titlebar ── */
.electron-titlebar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 6px 12px;
  background: var(--bg-secondary);
  backdrop-filter: var(--backdrop-blur);
  -webkit-backdrop-filter: var(--backdrop-blur);
  border-bottom: 1px solid var(--border-light);
  user-select: none;
  height: 32px;
  min-height: 32px;
}

.titlebar-spacer-left {
  -webkit-app-region: drag;
  cursor: move;
}

.titlebar-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: move;
  -webkit-app-region: drag;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.titlebar-controls {
  display: flex;
  gap: 6px;
  justify-self: end;
  -webkit-app-region: no-drag;
}

/* ── Element Plus Theme Overrides ── */
/* Menu component (top navigation bar and settings tabs) */
.el-menu {
  background-color: var(--bg-solid) !important;
  border-bottom: 1px solid var(--border-base) !important;
}

.el-menu-item {
  color: var(--text-regular) !important;
}

.el-menu-item:hover {
  background-color: var(--bg-secondary) !important;
}

.el-menu-item.is-active {
  color: var(--primary-color) !important;
  border-bottom-color: var(--primary-color) !important;
}

/* Button component */
.el-button {
  color: var(--text-regular) !important;
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
}

.el-button:hover {
  color: var(--primary-color) !important;
  border-color: var(--primary-light) !important;
}

.el-button--primary {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  color: #fff !important;
}

.el-button--primary:hover {
  background-color: var(--primary-light) !important;
  border-color: var(--primary-light) !important;
}

/* Success button (green) */
.el-button--success {
  background-color: var(--success-color, #67c23a) !important;
  border-color: var(--success-color, #67c23a) !important;
  color: #fff !important;
}

.el-button--success:hover {
  background-color: #85ce61 !important;
  border-color: #85ce61 !important;
}

/* Danger button (red) */
.el-button--danger {
  background-color: var(--danger-color, #f56c6c) !important;
  border-color: var(--danger-color, #f56c6c) !important;
  color: #fff !important;
}

.el-button--danger:hover {
  background-color: #f78989 !important;
  border-color: #f78989 !important;
}

/* Input component */
.el-input__wrapper {
  background-color: var(--bg-solid) !important;
  border: 1px solid var(--border-base) !important;
}

.el-input__inner {
  color: var(--text-primary) !important;
}

.el-input__wrapper:hover {
  border-color: var(--primary-color) !important;
}

.el-input__wrapper.is-focus {
  border-color: var(--primary-color) !important;
}

/* Dialog component */
.el-dialog {
  background-color: var(--bg-solid) !important;
  border: 1px solid var(--border-base) !important;
}

.el-dialog__header {
  border-bottom: 1px solid var(--border-base) !important;
}

.el-dialog__title {
  color: var(--text-primary) !important;
}

.el-dialog__body {
  color: var(--text-regular) !important;
}

/* Table component */
.el-table {
  background-color: var(--bg-solid) !important;
  color: var(--text-regular) !important;
}

.el-table th,
.el-table tr {
  background-color: var(--bg-solid) !important;
  color: var(--text-regular) !important;
}

.el-table td,
.el-table th.is-leaf {
  border-bottom: 1px solid var(--border-base) !important;
}

.el-table--enable-row-hover .el-table__body tr:hover > td {
  background-color: var(--bg-secondary) !important;
}

/* Descriptions component */
.el-descriptions {
  color: var(--text-regular) !important;
}

.el-descriptions__label {
  color: var(--text-secondary) !important;
}

.el-descriptions__content {
  color: var(--text-primary) !important;
}

.el-descriptions .el-descriptions__body {
  background-color: var(--bg-solid) !important;
}

/* Tag component */
.el-tag {
  color: var(--text-regular) !important;
  background-color: var(--bg-secondary) !important;
  border-color: var(--border-base) !important;
}

/* Select/Dropdown component */
.el-select__wrapper {
  background-color: var(--bg-solid) !important;
}

.el-select__input {
  color: var(--text-primary) !important;
}

/* Textarea component */
.el-textarea__inner {
  background-color: var(--bg-solid) !important;
  color: var(--text-primary) !important;
  border-color: var(--border-base) !important;
}

/* Radio component */
.el-radio-button__inner {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
  color: var(--text-regular) !important;
}

.el-radio-button__original-radio:checked + .el-radio-button__inner {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  color: #fff !important;
}

/* Switch component */
.el-switch.is-checked .el-switch__core {
  background-color: var(--primary-color) !important;
}

/* Alert component */
.el-alert {
  background-color: var(--bg-secondary) !important;
  border-color: var(--border-base) !important;
}

.el-alert__title {
  color: var(--text-primary) !important;
}

.el-alert__description {
  color: var(--text-regular) !important;
}

/* Card component */
.el-card {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
  color: var(--text-regular) !important;
}

/* Tabs component */
.el-tabs__item {
  color: var(--text-secondary) !important;
}

.el-tabs__item:hover {
  color: var(--primary-color) !important;
}

.el-tabs__item.is-active {
  color: var(--primary-color) !important;
}

.el-tabs__active-bar {
  background-color: var(--primary-color) !important;
}

/* Checkbox component */
.el-checkbox__input.is-checked + .el-checkbox__label {
  color: var(--text-primary) !important;
}

.el-checkbox__label {
  color: var(--text-regular) !important;
}

/* Progress component */
.el-progress__text {
  color: var(--text-primary) !important;
}

/* Message/Notification components */
.el-message {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
  color: var(--text-regular) !important;
}

/* Divider component */
.el-divider {
  border-top-color: var(--border-base) !important;
}

/* Tooltip component */
.el-tooltip__popper.is-dark {
  background-color: var(--bg-tertiary) !important;
  color: var(--text-primary) !important;
}

/* Slider component */
.el-slider__runway {
  background-color: var(--bg-secondary) !important;
}

.el-slider__bar {
  background-color: var(--primary-color) !important;
}

.el-slider__button {
  border-color: var(--primary-color) !important;
}

/* Number input component */
.el-input-number__decrease,
.el-input-number__increase {
  background-color: var(--bg-secondary) !important;
  color: var(--text-regular) !important;
  border-left-color: var(--border-base) !important;
}

/* Upload component */
.el-upload {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
}

.el-upload-dragger {
  background-color: var(--bg-secondary) !important;
  border-color: var(--border-base) !important;
  color: var(--text-regular) !important;
}

.el-upload-dragger:hover {
  border-color: var(--primary-color) !important;
}

.el-upload-list {
  background-color: var(--bg-solid) !important;
  color: var(--text-regular) !important;
}

.el-upload-list__item {
  background-color: var(--bg-secondary) !important;
  border-color: var(--border-base) !important;
  color: var(--text-primary) !important;
}

.el-upload-list__item-name {
  color: var(--text-primary) !important;
}

.el-upload-list__item:hover {
  background-color: var(--bg-tertiary) !important;
}

/* Collapse component */
.el-collapse {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
}

.el-collapse-item__header {
  background-color: var(--bg-solid) !important;
  color: var(--text-primary) !important;
  border-color: var(--border-base) !important;
}

.el-collapse-item__header:hover {
  background-color: var(--bg-secondary) !important;
}

.el-collapse-item__wrap {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
}

.el-collapse-item__content {
  background-color: var(--bg-solid) !important;
  color: var(--text-regular) !important;
}

/* Textarea component */
.el-textarea__inner {
  background-color: var(--bg-solid) !important;
  color: var(--text-primary) !important;
  border-color: var(--border-base) !important;
}

.el-textarea__inner:hover {
  border-color: var(--primary-color) !important;
}

.el-textarea__inner:focus {
  border-color: var(--primary-color) !important;
}

/* Descriptions component - more comprehensive */
.el-descriptions {
  background-color: var(--bg-solid) !important;
  color: var(--text-regular) !important;
}

.el-descriptions .el-descriptions__header {
  background-color: var(--bg-solid) !important;
  color: var(--text-primary) !important;
}

.el-descriptions__body {
  background-color: var(--bg-solid) !important;
  color: var(--text-regular) !important;
}

.el-descriptions__label {
  color: var(--text-secondary) !important;
}

.el-descriptions__content {
  color: var(--text-primary) !important;
}

.el-descriptions .el-descriptions__cell {
  border-color: var(--border-base) !important;
}

.el-descriptions.is-bordered .el-descriptions__cell {
  border-color: var(--border-base) !important;
}

/* Tag component - more comprehensive */
.el-tag {
  background-color: var(--bg-secondary) !important;
  border-color: var(--border-base) !important;
  color: var(--text-regular) !important;
}

.el-tag.el-tag--info {
  background-color: rgba(64, 158, 255, 0.1) !important;
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
}

.el-tag.el-tag--success {
  background-color: rgba(103, 194, 58, 0.1) !important;
  border-color: var(--success-color) !important;
  color: var(--success-color) !important;
}

.el-tag.el-tag--warning {
  background-color: rgba(230, 162, 60, 0.1) !important;
  border-color: var(--warning-color, #e6a23c) !important;
  color: var(--warning-color, #e6a23c) !important;
}

.el-tag.el-tag--danger {
  background-color: rgba(245, 108, 108, 0.1) !important;
  border-color: var(--danger-color) !important;
  color: var(--danger-color) !important;
}

/* Collapse item arrow */
.el-collapse-item__arrow {
  color: var(--text-secondary) !important;
}

/* Input component inner */
.el-input__wrapper {
  background-color: var(--bg-solid) !important;
}

.el-input__inner {
  background-color: transparent !important;
  color: var(--text-primary) !important;
}

.el-input__inner::placeholder {
  color: var(--text-placeholder) !important;
}

/* Input component with prepend/append */
.el-input-group__append,
.el-input-group__prepend {
  background-color: var(--bg-secondary) !important;
  color: var(--text-regular) !important;
  border-color: var(--border-base) !important;
}

/* Form item labels */
.el-form-item__label {
  color: var(--text-primary) !important;
}

/* Radio button inner text */
.el-radio-button__inner {
  color: var(--text-regular) !important;
}

/* Select dropdown */
.el-select-dropdown {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
}

.el-select-dropdown__item {
  color: var(--text-regular) !important;
}

.el-select-dropdown__item:hover {
  background-color: var(--bg-secondary) !important;
}

.el-select-dropdown__item.is-selected {
  color: var(--primary-color) !important;
  background-color: rgba(64, 158, 255, 0.1) !important;
}

/* Option group */
.el-select-group__title {
  color: var(--text-secondary) !important;
}

/* Popover */
.el-popover {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
  color: var(--text-regular) !important;
}

.el-popover__title {
  color: var(--text-primary) !important;
}

/* Card component */
.el-card__header {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
  color: var(--text-primary) !important;
}

.el-card__body {
  background-color: var(--bg-solid) !important;
  color: var(--text-regular) !important;
}

/* Steps component */
.el-steps {
  background-color: transparent !important;
}

.el-step__head {
  background-color: var(--bg-solid) !important;
}

.el-step__title {
  color: var(--text-primary) !important;
}

.el-step__description {
  color: var(--text-secondary) !important;
}

/* Breadcrumb */
.el-breadcrumb {
  background-color: transparent !important;
}

.el-breadcrumb__item {
  color: var(--text-secondary) !important;
}

.el-breadcrumb__item:last-child {
  color: var(--text-primary) !important;
}

.el-breadcrumb__inner {
  color: var(--text-secondary) !important;
}

.el-breadcrumb__inner:hover {
  color: var(--primary-color) !important;
}

.el-breadcrumb__separator {
  color: var(--text-secondary) !important;
}

/* Transfer component */
.el-transfer-panel {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
}

.el-transfer-panel__header {
  background-color: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
}

/* Calendar/Date picker */
.el-picker-panel {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
  color: var(--text-regular) !important;
}

.el-date-table th {
  color: var(--text-secondary) !important;
}

.el-date-table td.available:hover {
  background-color: var(--bg-secondary) !important;
  color: var(--primary-color) !important;
}

.el-date-table td.in-range {
  background-color: rgba(64, 158, 255, 0.1) !important;
}

.el-date-table td.current:not(.disabled) {
  color: var(--primary-color) !important;
}

.el-date-table td.today span {
  color: var(--primary-color) !important;
}

/* Time picker */
.el-time-panel {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
}

.el-time-spinner__item {
  color: var(--text-regular) !important;
}

.el-time-spinner__item:hover:not(.disabled):not(.active) {
  background-color: var(--bg-secondary) !important;
}

.el-time-spinner__item.active:not(.disabled) {
  color: var(--primary-color) !important;
}

/* Color picker */
.el-color-picker__panel {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
}

/* Rate component */
.el-rate__icon {
  color: var(--text-placeholder) !important;
}

.el-rate__icon.hover {
  color: var(--primary-color) !important;
}

/* Alert component - more comprehensive */
.el-alert {
  background-color: var(--bg-secondary) !important;
  border-color: var(--border-base) !important;
}

.el-alert__title {
  color: var(--text-primary) !important;
}

.el-alert__description {
  color: var(--text-regular) !important;
}

.el-alert--success {
  background-color: rgba(103, 194, 58, 0.1) !important;
  border-color: var(--success-color) !important;
}

.el-alert--warning {
  background-color: rgba(230, 162, 60, 0.1) !important;
  border-color: var(--warning-color, #e6a23c) !important;
}

.el-alert--error {
  background-color: rgba(245, 108, 108, 0.1) !important;
  border-color: var(--danger-color) !important;
}

.el-alert--info {
  background-color: rgba(64, 158, 255, 0.1) !important;
  border-color: var(--primary-color) !important;
}

/* Result component */
.el-result__title {
  color: var(--text-primary) !important;
}

.el-result__subtitle {
  color: var(--text-secondary) !important;
}

/* Skeleton component */
.el-skeleton {
  background-color: var(--bg-solid) !important;
}

.el-skeleton__p {
  background-color: var(--bg-secondary) !important;
}

/* Empty component */
.el-empty {
  background-color: transparent !important;
}

.el-empty__description {
  color: var(--text-secondary) !important;
}

/* Image component */
.el-image {
  background-color: var(--bg-secondary) !important;
}

/* Badge component */
.el-badge__content {
  background-color: var(--danger-color) !important;
  border-color: var(--bg-solid) !important;
}

/* Carousel component */
.el-carousel__arrow {
  background-color: var(--bg-secondary) !important;
  border-color: var(--border-base) !important;
  color: var(--text-primary) !important;
}

.el-carousel__arrow:hover {
  background-color: var(--bg-tertiary) !important;
}

/* Timeline component */
.el-timeline-item__tail {
  border-color: var(--border-base) !important;
}

.el-timeline-item__node {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
}

.el-timeline-item__wrapper {
  color: var(--text-regular) !important;
}

.el-timeline-item__timestamp {
  color: var(--text-secondary) !important;
}

/* Tree component */
.el-tree {
  background-color: transparent !important;
  color: var(--text-regular) !important;
}

.el-tree-node__content {
  color: var(--text-regular) !important;
}

.el-tree-node__content:hover {
  background-color: var(--bg-secondary) !important;
}

.el-tree-node.is-current > .el-tree-node__content {
  background-color: rgba(64, 158, 255, 0.1) !important;
  color: var(--primary-color) !important;
}

/* Pagination component */
.el-pagination {
  background-color: transparent !important;
}

.el-pagination button {
  background-color: var(--bg-solid) !important;
  color: var(--text-regular) !important;
}

.el-pagination button:hover {
  color: var(--primary-color) !important;
}

.el-pagination button:disabled {
  background-color: var(--bg-secondary) !important;
  color: var(--text-placeholder) !important;
}

.el-pager li {
  background-color: var(--bg-solid) !important;
  color: var(--text-regular) !important;
}

.el-pager li:hover {
  color: var(--primary-color) !important;
}

.el-pager li.is-active {
  background-color: var(--primary-color) !important;
  color: #fff !important;
}

/* Table component - more comprehensive */
.el-table {
  background-color: var(--bg-solid) !important;
  color: var(--text-regular) !important;
}

.el-table th.el-table__cell {
  background-color: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
}

.el-table tr {
  background-color: var(--bg-solid) !important;
}

.el-table td.el-table__cell {
  border-color: var(--border-base) !important;
  color: var(--text-regular) !important;
}

.el-table--enable-row-hover .el-table__body tr:hover > td {
  background-color: var(--bg-secondary) !important;
}

.el-table--striped .el-table__body tr.el-table__row--striped > td {
  background-color: var(--bg-secondary) !important;
}

.el-table-fixed-column--right,
.el-table-fixed-column--left {
  background-color: var(--bg-solid) !important;
}

.el-table-filter {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
}

.el-table-filter__list-item {
  color: var(--text-regular) !important;
}

.el-table-filter__list-item:hover {
  background-color: var(--bg-secondary) !important;
}

.el-table-filter__bottom {
  background-color: var(--bg-solid) !important;
  border-color: var(--border-base) !important;
}
</style>
