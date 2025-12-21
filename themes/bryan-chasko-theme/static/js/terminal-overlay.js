// Terminal overlay auto-dismiss after animation completes
document.addEventListener('DOMContentLoaded', () => {
  const terminal = document.querySelector('.terminal-wrapper');
  if (!terminal) return;

  // Total animation time: slide (0.6s) + glitch (8s) + fade (0.8s) = 9.4s
  // Fade starts at 7.6s, completes at 8.4s, so dismiss at 8.5s
  setTimeout(() => {
    terminal.setAttribute('aria-hidden', 'true');
    terminal.style.pointerEvents = 'none';
  }, 8500);
});
