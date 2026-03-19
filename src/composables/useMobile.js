import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Composable for mobile device detection
 * @returns {Object} Mobile detection state and methods
 */
export function useMobile() {
  const isMobile = ref(false);
  const isTablet = ref(false);
  const isDesktop = ref(false);
  const breakpoint = 768;
  const tabletBreakpoint = 1024;

  const checkDevice = () => {
    const width = window.innerWidth;
    isMobile.value = width < breakpoint;
    isTablet.value = width >= breakpoint && width < tabletBreakpoint;
    isDesktop.value = width >= tabletBreakpoint;
  };

  onMounted(() => {
    checkDevice();
    window.addEventListener('resize', checkDevice);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', checkDevice);
  });

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
    tabletBreakpoint,
  };
}
