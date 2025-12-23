function handler(event) {
    var request = event.request;
    var uri = request.uri.toLowerCase();
    
    // Redirect /help to /services
    if (uri === '/help' || uri === '/help/') {
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                'location': { value: '/services' }
            }
        };
    }
    
    // URL rewriting for SPA routing
    if (!uri.includes('.') && !uri.endsWith('/')) {
        request.uri = uri + '/index.html';
    }
    else if (uri.endsWith('/') && !uri.endsWith('/index.html')) {
        request.uri = uri + 'index.html';
    }
    
    return request;
}