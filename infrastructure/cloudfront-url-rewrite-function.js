function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // If the URI doesn't end with a file extension and doesn't end with /
    if (!uri.includes('.') && !uri.endsWith('/')) {
        // Append /index.html for directory-style requests
        request.uri = uri + '/index.html';
    }
    // If it ends with / but not /index.html, append index.html
    else if (uri.endsWith('/') && !uri.endsWith('/index.html')) {
        request.uri = uri + 'index.html';
    }
    
    return request;
}