var crawler = new (function Crawler () {
    this.parseUrl = function (str) {       
        var link = document.createElement('a');
        link.href = str;
        var o = {};
        var keys = 'protocol host hostname port pathname search hash href'.split(' ');
        var i = keys.length;
        var k, v;
        while (i--) {
            k = keys[i];
            v = link[k];
            o[k] = v;
        }
        return o;
    };

    /**
     * --//--
     *
     * @param {Object} options
     * @param {String} options.startUrl URL с которого начинаем обход сайта
     * @param {RegExp} options.filterUrlRegex дополнительный фильтр
     * @param {Function} options.onMatch = function (url, content) { ... }
     * @param {Function} options.onEnd = function (urls) { ... }
     */
    this.run = function (options) {
        options = options || {};
        var self = this;
        var urls = [];
        var counter = 0;
        var obj = self.parseUrl(options.startUrl ? options.startUrl.replace(/#.*/, '') : '/');
        (function process(cur) {
            var xhr = new XMLHttpRequest;
            xhr.open('GET', cur.href);
            var isHtml;
            xhr.onreadystatechange = function () {
                if (this.readyState == 2) {
                    isHtml = this.getResponseHeader('content-type').split(';')[0] == 'text/html';
                    // принудительно отменяет получение тела ответа
                    if (!isHtml) {
                        this.abort();
                    }
                }
                else if (this.readyState == 4) {
                    if (isHtml && this.status == 200) {
                        var onMatch = options.onMatch;
                        if (typeof onMatch == 'function') {
                            try {
                                onMatch(cur.href, this.response);
                            }
                            catch (err) {}
                        }                     
                        var re = /<a(?!rea)[^>]+href=('|")(.*?)\1/gi;
                        var match;
                        var url;
                        var next;
                        while (match = re.exec(this.response)) {
                            url = match[2];
                            url = url.trim();
                            url = url.replace(/#.*/, '');
                            // console.log(url);
                            if (!/^https?:[\\/]{2}/.test(url)) {
                                if (/^\w+:/.test(url)) {
                                    continue;
                                }
                                if (!/^[\\/]/.test(url)) {
                                    url = cur.pathname.replace(/[^/]+$/, '') + url;
                                }
                            }
                            next = self.parseUrl(url);
                            if (next.hostname == location.hostname) {
                                if (urls.indexOf(next.href) == -1) {
                                    if (options.filterUrlRegex) {
                                        if (!options.filterUrlRegex.test(next.href)) {
                                            continue;
                                        }
                                    }
                                    process(next);
                                }
                            }
                        }                      
                    }
                    if (--counter < 1) {
                        var onEnd = options.onEnd;
                        if (typeof onEnd == 'function') {
                            onEnd(urls);
                        }
                    }
                }
            };
            // xhr.onerror = function (err) { console.log(err); };
            xhr.send();
            urls.push(cur.href);
            ++counter;
        })(obj);
    };
})();
/* 
console.log('--start');
crawler.run({
    // startUrl: '/posts',
    // filterUrlRegex: /$/,
    onMatch: function (url, content) { 
        var match = content.match(/<title>(.*)<\/title>/i);
        var title = match ? match[1] : '';
        console.log(title + ' => ' + url); 
    }, 
    onEnd: function() { 
        console.log('--end'); 
    }
});
*/