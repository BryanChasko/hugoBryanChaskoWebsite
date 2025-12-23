/**
 * Terminal Overlay Auto-Dismiss
 * 
 * Automatically dismisses terminal greeting components after animation completes.
 * Works with any element with class `.terminal-wrapper`.
 * 
 * Animation timeline:
 * - 0-0.6s: Slide down
 * - 0.6-8.6s: Glitch effect
 * - 7.6-8.4s: Fade out
 * - 8.5s: Dismiss (aria-hidden + pointer-events: none)
 */

document.addEventListener('DOMContentLoaded', () => {
  const terminal = document.querySelector('.terminal-wrapper');
  if (!terminal) return;

  // Fade starts at 7.6s, completes at 8.4s, so dismiss at 8.5s
  setTimeout(() => {
    terminal.setAttribute('aria-hidden', 'true');
    terminal.style.pointerEvents = 'none';
  }, 8500);
});
