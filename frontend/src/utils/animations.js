import anime from 'animejs';

export const staggerReveal = (selector, options = {}) => {
  anime({
    targets: selector,
    opacity: [0, 1],
    translateY: [30, 0],
    delay: anime.stagger(80),
    duration: 600,
    easing: 'easeOutQuad',
    ...options,
  });
};

export const hoverGlow = (element) => {
  const glow = (value) => {
    anime({
      targets: element,
      scale: value ? 1.03 : 1,
      boxShadow: value ? '0 0 30px rgba(0, 240, 255, 0.3)' : 'none',
      duration: 300,
      easing: 'easeOutQuad',
    });
  };
  element.addEventListener('mouseenter', () => glow(true));
  element.addEventListener('mouseleave', () => glow(false));
};

export const pulseLive = (selector) => {
  anime({
    targets: selector,
    scale: [1, 1.2, 1],
    opacity: [1, 0.6, 1],
    duration: 1500,
    loop: true,
    easing: 'easeInOutQuad',
  });
};
