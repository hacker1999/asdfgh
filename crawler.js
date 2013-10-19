/**
 * --//--
 *
 * @param {Object} options
 * @param {String} options.startUrl url с которого начинаем обход сайта
 * @param {Function} options.filterUrl = function (url) { ... } дополнительный фильтр
 * @param {Function} options.onMatch = function (url, content) { ... }
 * @param {Function} options.onEnd = function (urls) { ... }
 */
function grabInternalUrls(options) {
    options = options || {};
    var visitedUrls = [];
    var urlCounter = 0;

    function parseUrl(url) {
        var obj = {};
        var link = document.createElement('a');
        link.href = url;
        var keys = 'protocol host hostname port pathname search hash href'.split(' ');
        var key;
        for (var i = 0; i < keys.length; ++i) {
            key = keys[i];
            obj[key] = link[key];
        }
        return obj;
    }

    var url = options.startUrl == null ? '/' : options.startUrl;
    url = url.replace(/#.*/, '');
    var urlObj = parseUrl(url);
    if (!/^https?:$/.test(urlObj.protocol)) {
        throw 'Протокол не поддерживается';
    }
    if (urlObj.hostname != location.hostname) {
        throw 'URL относится к другому Интернет-ресурсу';
    } 
    (function process(curUrl) {
        var xhr = new XMLHttpRequest;
        xhr.open('GET', curUrl.href);
        xhr.onload = function () {
            if (this.status == 200 && this.getResponseHeader('content-type').substr(0, 9) == 'text/html') {
                var onMatch = options.onMatch;
                if (typeof onMatch == 'function') {
                    onMatch(curUrl.href, this.response);
                }          
                var re = /<a[^>]+href\s*=\s*(?:'([^']+)|"([^"]+)|([^\s>]+))/gi;
                var matches;
                var matchedUrl;
                var nextUrl;
                while (matches = re.exec(this.response)) {                 
                    if (matches[3]) {
                        matchedUrl = matches[3];
                    }
                    else if (matches[2]) {
                        matchedUrl = matches[2];
                    }
                    else if (matches[1]) {
                        matchedUrl = matches[1];
                    }
                    matchedUrl = matchedUrl.replace(/#.*/, '');
                    matchedUrl = matchedUrl.trim(matchedUrl);
                    if (!/^https?:[\\/]{2}/.test(matchedUrl)) {
                        if (/^\w+:/.test(matchedUrl)) {
                            continue;
                        }
                        if (!/^[\\/]/.test(matchedUrl)) {
                            matchedUrl = curUrl.pathname + matchedUrl;
                        }
                    }
                    nextUrl = parseUrl(matchedUrl);
                    if (nextUrl.hostname == location.hostname) { 
                        if (visitedUrls.indexOf(nextUrl.href) == -1) {
                            if (typeof options.filterUrl == 'function') {
                                if (!options.filterUrl(nextUrl.href)) {
                                    continue;
                                }
                            }
                            process(nextUrl);
                        }
                    }
                }
            }
            --urlCounter;
            if (urlCounter == 0) {
                var onEnd = options.onEnd;
                if (typeof onEnd == 'function') {
                    onEnd(visitedUrls);
                }
            }       
        };
        xhr.send();
        visitedUrls.push(curUrl.href);       
        ++urlCounter;
    })(urlObj);
}


grabInternalUrls({
    filterUrl: function (url) {
        // ограничимся первым уровнем
        return /^https?:\/\/[^/]+\/[^/?]+$/.test(url);
    },
    onMatch: function (url, content) { 
        // console.log(url); 
    },
    onEnd: function (urls) {
        console.log(urls);
    }
});