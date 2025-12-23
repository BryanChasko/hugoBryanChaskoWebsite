// Hide terminal and show social icons for testing
(function() {
    const style = document.createElement('style');
    style.textContent = `
        .terminal-wrapper {
            display: none !important;
        }
        .terminal-social-reveal {
            display: block !important;
            position: static !important;
            opacity: 1 !important;
            visibility: visible !important;
            animation: none !important;
            padding: var(--space-md) 0;
        }
    `;
    document.head.appendChild(style);
    console.log('Terminal hidden, social icons visible');
})();
