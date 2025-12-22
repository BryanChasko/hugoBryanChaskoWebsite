/**
 * GitHub Calendar Component Initialization
 * Ensures proper SVG rendering and responsive sizing
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  function initCalendar() {
    const calendarContainer = document.querySelector('.calendar');
    if (!calendarContainer) return;

    // Ensure container has proper display properties
    calendarContainer.style.display = 'block';
    calendarContainer.style.width = '100%';
    calendarContainer.style.maxWidth = '100%';
    calendarContainer.style.overflow = 'visible';
    calendarContainer.style.margin = '0';
    calendarContainer.style.padding = '0';

    // Fix SVG rendering
    const svg = calendarContainer.querySelector('svg');
    if (svg) {
      svg.style.display = 'block';
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.maxWidth = '100%';
      svg.style.overflow = 'visible';
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      
      // Ensure viewBox is set for responsive scaling
      if (!svg.getAttribute('viewBox')) {
        const bbox = svg.getBBox();
        svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      }

      // Fix all SVG child elements
      const rects = svg.querySelectorAll('rect');
      rects.forEach(rect => {
        rect.style.overflow = 'visible';
      });

      const texts = svg.querySelectorAll('text');
      texts.forEach(text => {
        text.style.overflow = 'visible';
      });

      const groups = svg.querySelectorAll('g');
      groups.forEach(group => {
        group.style.overflow = 'visible';
      });
    }

    // Ensure wrapper has proper styling
    const wrapper = calendarContainer.closest('.github-calendar-wrapper');
    if (wrapper) {
      wrapper.style.display = 'block';
      wrapper.style.width = '100%';
      wrapper.style.maxWidth = '100%';
      wrapper.style.overflow = 'visible';
      wrapper.style.margin = '0';
      wrapper.style.padding = '0';
      wrapper.style.pointerEvents = 'auto';
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendar);
  } else {
    initCalendar();
  }

  // Re-initialize after GitHubCalendar renders (it may render after initial load)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && (node.classList?.contains('calendar') || node.querySelector?.('.calendar'))) {
            initCalendar();
          }
        });
      }
    });
  });

  // Observe the calendar container for changes
  const calendarContainer = document.querySelector('.calendar');
  if (calendarContainer) {
    observer.observe(calendarContainer.parentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
})();
