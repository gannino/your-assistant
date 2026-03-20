<template>
  <span>
    {{ show_text }}
  </span>
</template>

<script setup>
import { ref } from 'vue';

const start_time = ref(0);
const show_text = ref(null);
let cur_interval_pointer = null;

const formatTime = seconds => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
};

const start = () => {
  start_time.value = new Date().getTime();
  cur_interval_pointer = setInterval(() => {
    // 更新内容
    const time_last_seconds = parseInt((new Date().getTime() - start_time.value) / 1000);
    show_text.value = formatTime(time_last_seconds);
  }, 1000);
};

const stop = () => {
  clearInterval(cur_interval_pointer);
  show_text.value = null;
};

defineExpose({
  start,
  stop,
});
</script>

<style scoped></style>
