import { useEffect, useRef } from 'react';
import anime from 'animejs';

export const useStaggerReveal = (selector, options = {}) => {
  useEffect(() => {
    anime({
      targets: selector,
      opacity: [0, 1],
      translateY: [30, 0],
      delay: anime.stagger(80),
      duration: 600,
      easing: 'easeOutQuad',
      ...options,
    });
  }, [selector, options]);
};

export const useHoverGlow = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const glow = (value) => {
      anime({
        targets: el,
        scale: value ? 1.03 : 1,
        boxShadow: value ? '0 0 30px rgba(0, 240, 255, 0.3)' : 'none',
        duration: 300,
        easing: 'easeOutQuad',
      });
    };
    el.addEventListener('mouseenter', () => glow(true));
    el.addEventListener('mouseleave', () => glow(false));
    return () => {
      el.removeEventListener('mouseenter', () => glow(true));
      el.removeEventListener('mouseleave', () => glow(false));
    };
  }, []);
  return ref;
};

export const usePulse = (selector, options = {}) => {
  useEffect(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    anime({
      targets: el,
      scale: [1, 1.2, 1],
      opacity: [1, 0.6, 1],
      duration: 1500,
      loop: true,
      easing: 'easeInOutQuad',
      ...options,
    });
  }, [selector, options]);
};
