import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { createPinia } from 'pinia';

const app = createApp(App);

// Register Element Plus
app.use(ElementPlus);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// Use router and Pinia
app.use(router);
const pinia = createPinia();
app.use(pinia);

app.mount('#app');

// Log successful mount for debugging
if (window.electronAPI?.isElectron) {
  console.log('[Renderer] Vue app mounted successfully in Electron');
} else {
  console.log('[Renderer] Vue app mounted successfully in browser');
}
