import { describe, it, expect } from '@jest/globals';
import { mount } from '@vue/test-utils';
import LoadingIcon from './LoadingIcon.vue';

describe('LoadingIcon.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(LoadingIcon);
    expect(wrapper.exists()).toBe(true);
  });

  it('has the correct CSS class', () => {
    const wrapper = mount(LoadingIcon);
    const rippleContainer = wrapper.find('.lds-ripple');
    expect(rippleContainer.exists()).toBe(true);
  });

  it('contains two animated divs', () => {
    const wrapper = mount(LoadingIcon);
    const divs = wrapper.findAll('div');
    // The component has 1 div with class "lds-ripple" containing 2 child divs
    // Plus 1 outer container div, so 4 divs total
    expect(divs.length).toBe(4);
  });

  it('is centered', () => {
    const wrapper = mount(LoadingIcon);
    const container = wrapper.findAll('div')[0]; // The outer container
    expect(container.attributes('style')).toContain('text-align: center');
  });
});
