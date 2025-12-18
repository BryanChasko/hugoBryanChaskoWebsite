/**
 * GitHub Repository Fetcher
 * Fetches and displays user's repositories dynamically
 */

class GitHubReposFetcher {
    constructor(username, containerId = 'repos-container') {
        this.username = username;
        this.container = document.getElementById(containerId);
        this.apiUrl = `https://api.github.com/users/${username}/repos`;
        this.maxRepos = 6; // Show top 6 repos
    }

    async init() {
        if (!this.container) {
            console.warn('GitHub repos container not found');
            return;
        }

        try {
            const repos = await this.fetchRepos();
            this.renderRepos(repos);
        } catch (error) {
            console.error('Failed to fetch GitHub repos:', error);
            this.renderError();
        }
    }

    async fetchRepos() {
        const response = await fetch(this.apiUrl + '?sort=updated&per_page=100');
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const repos = await response.json();
        
        // Filter out forks and sort by stars + recent activity
        return repos
            .filter(repo => !repo.fork)
            .sort((a, b) => {
                // Prioritize starred repos
                const starDiff = b.stargazers_count - a.stargazers_count;
                if (starDiff !== 0) return starDiff;
                
                // Then by update date
                return new Date(b.updated_at) - new Date(a.updated_at);
            })
            .slice(0, this.maxRepos);
    }

    renderRepos(repos) {
        if (!repos || repos.length === 0) {
            this.container.innerHTML = '<p class="repos-empty">No repositories found.</p>';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'repos-grid';
        
        repos.forEach(repo => {
            const card = this.createRepoCard(repo);
            grid.appendChild(card);
        });

        this.container.innerHTML = '';
        this.container.appendChild(grid);
    }

    createRepoCard(repo) {
        const card = document.createElement('a');
        card.className = 'repo-card';
        card.href = repo.html_url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        const header = document.createElement('div');
        header.className = 'repo-header';
        
        const title = document.createElement('h3');
        title.className = 'repo-title';
        title.textContent = repo.name;
        header.appendChild(title);

        const description = document.createElement('p');
        description.className = 'repo-description';
        description.textContent = repo.description || 'No description provided';
        
        const meta = document.createElement('div');
        meta.className = 'repo-meta';
        
        if (repo.language) {
            const lang = document.createElement('span');
            lang.className = 'repo-language';
            lang.innerHTML = `<span class="lang-dot" style="background-color: ${this.getLanguageColor(repo.language)}"></span>${repo.language}`;
            meta.appendChild(lang);
        }
        
        if (repo.stargazers_count > 0) {
            const stars = document.createElement('span');
            stars.className = 'repo-stars';
            stars.innerHTML = `⭐ ${repo.stargazers_count}`;
            meta.appendChild(stars);
        }

        const updated = document.createElement('span');
        updated.className = 'repo-updated';
        updated.textContent = `Updated ${this.formatDate(repo.updated_at)}`;
        meta.appendChild(updated);

        card.appendChild(header);
        card.appendChild(description);
        card.appendChild(meta);

        return card;
    }

    renderError() {
        this.container.innerHTML = `
            <div class="repos-error">
                <p>Unable to load repositories. Please visit my <a href="https://github.com/${this.username}" target="_blank" rel="noopener">GitHub profile</a> directly.</p>
            </div>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    getLanguageColor(language) {
        // GitHub language colors
        const colors = {
            'JavaScript': '#f1e05a',
            'TypeScript': '#3178c6',
            'Python': '#3572A5',
            'Java': '#b07219',
            'C++': '#f34b7d',
            'C#': '#178600',
            'Ruby': '#701516',
            'Go': '#00ADD8',
            'Rust': '#dea584',
            'PHP': '#4F5D95',
            'Swift': '#F05138',
            'Kotlin': '#A97BFF',
            'Dart': '#00B4AB',
            'Shell': '#89e051',
            'HTML': '#e34c26',
            'CSS': '#563d7c',
            'Vue': '#41b883',
            'React': '#61dafb'
        };
        return colors[language] || '#8b949e';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new GitHubReposFetcher('BryanChasko').init();
    });
} else {
    new GitHubReposFetcher('BryanChasko').init();
}
