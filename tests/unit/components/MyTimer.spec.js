/**
 * MyTimer component tests
 * @component tests
 */

import { mount } from '@vue/test-utils';
import MyTimer from '@/components/MyTimer.vue';

describe('MyTimer.vue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render component', () => {
    const wrapper = mount(MyTimer);
    expect(wrapper.exists()).toBe(true);
  });

  it('should display nothing when not started', () => {
    const wrapper = mount(MyTimer);
    expect(wrapper.text()).toBe('');
  });

  it('should start timer and display formatted time', async () => {
    const wrapper = mount(MyTimer);

    wrapper.vm.start();

    // Advance time by 1 second
    jest.advanceTimersByTime(1000);

    // Wait for next tick to update DOM
    await wrapper.vm.$nextTick();

    // Should show 00:01
    expect(wrapper.text()).toBe('00:01');
  });

  it('should format minutes and seconds correctly', async () => {
    const wrapper = mount(MyTimer);

    wrapper.vm.start();

    // Advance 65 seconds = 1 minute 5 seconds
    jest.advanceTimersByTime(65000);

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toBe('01:05');
  });

  it('should format larger time values correctly', async () => {
    const wrapper = mount(MyTimer);

    wrapper.vm.start();

    // Advance 3661 seconds = 61 minutes 1 second
    jest.advanceTimersByTime(3661000);

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toBe('61:01');
  });

  it('should pad single-digit values with zeros', async () => {
    const wrapper = mount(MyTimer);

    wrapper.vm.start();

    // Test various single-digit values
    for (let i = 1; i <= 9; i++) {
      jest.advanceTimersByTime(1000);
      await wrapper.vm.$nextTick();

      const seconds = i % 60;
      const formattedSeconds = String(seconds).padStart(2, '0');
      expect(wrapper.text()).toContain(formattedSeconds);
    }
  });

  it('should stop timer and clear display', async () => {
    const wrapper = mount(MyTimer);

    wrapper.vm.start();

    // Advance time
    jest.advanceTimersByTime(5000);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toBe('00:05');

    // Stop timer
    wrapper.vm.stop();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toBe('');
  });

  it('should clear interval when stopped', async () => {
    const wrapper = mount(MyTimer);

    wrapper.vm.start();

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    wrapper.vm.stop();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should handle multiple start/stop cycles', async () => {
    const wrapper = mount(MyTimer);

    // First cycle
    wrapper.vm.start();
    jest.advanceTimersByTime(3000);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe('00:03');

    wrapper.vm.stop();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe('');

    // Second cycle - should restart from zero
    wrapper.vm.start();
    jest.advanceTimersByTime(2000);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe('00:02');
  });

  it('should expose start and stop methods', () => {
    const wrapper = mount(MyTimer);

    expect(typeof wrapper.vm.start).toBe('function');
    expect(typeof wrapper.vm.stop).toBe('function');
  });

  it('should update display every second', async () => {
    const wrapper = mount(MyTimer);

    wrapper.vm.start();

    const texts = [];
    for (let i = 1; i <= 5; i++) {
      jest.advanceTimersByTime(1000);
      await wrapper.vm.$nextTick();
      texts.push(wrapper.text());
    }

    expect(texts).toEqual(['00:01', '00:02', '00:03', '00:04', '00:05']);
  });
});
