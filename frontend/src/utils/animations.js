import anime from 'animejs';

// Staggered list reveal
export const staggerReveal = (selector) => {
  anime({
    targets: selector,
    opacity: [0, 1],
    translateY: [30, 0],
    delay: anime.stagger(80),
    duration: 600,
    easing: 'easeOutQuad',
  });
};

// Hover scale + glow
export const hoverGlow = (element) => {
  element.addEventListener('mouseenter', () => {
    anime({
      targets: element,
      scale: 1.03,
      boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)',
      duration: 300,
      easing: 'easeOutQuad',
    });
  });
  element.addEventListener('mouseleave', () => {
    anime({
      targets: element,
      scale: 1,
      boxShadow: 'none',
      duration: 300,
      easing: 'easeOutQuad',
    });
  });
};

// Pulse live indicator
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
