// GitHubCalendarComponent.js
// Object-oriented wrapper for GitHub contribution calendar

class GitHubCalendarComponent {
    /**
     * @param {string|HTMLElement} container - Selector or element for calendar
     * @param {string} username - GitHub username
     * @param {object} options - Options for calendar (see github-calendar docs)
     */
    constructor(container, username, options = {}) {
        this.container = container;
        this.username = username;
        this.options = Object.assign({
            responsive: true,
            tooltips: true,
            global_stats: false
        }, options);
    }

    /**
     * Initialize and render the calendar
     */
    render() {
        if (typeof GitHubCalendar === 'undefined') {
            console.error('GitHubCalendar library not loaded.');
            return;
        }
        GitHubCalendar(this.container, this.username, this.options);
    }

    /**
     * Static helper to inject required CSS/JS if needed
     */
    static injectAssets() {
        // Only inject if not already present
        if (!document.querySelector('link[href*="github-calendar-responsive.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/github-calendar@latest/dist/github-calendar-responsive.css';
            document.head.appendChild(link);
        }
        if (!document.querySelector('script[src*="github-calendar.min.js"]')) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/github-calendar@latest/dist/github-calendar.min.js';
            document.body.appendChild(script);
        }
    }
}

// Example usage (uncomment to use):
// GitHubCalendarComponent.injectAssets();
// const calendar = new GitHubCalendarComponent('#github-calendar', 'BryanChasko');
// calendar.render();

export default GitHubCalendarComponent;
