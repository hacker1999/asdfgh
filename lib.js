(function () {
    var cache = {};

    gid = function (id) {
        return cache[id] ? cache[id] : (cache[id] = document.getElementById(id));
    };
})();

function parseURL(str) {       
    var link = document.createElement('a');
    link.href = str;
    var obj = {};
    var keys = 'protocol host hostname port pathname search hash href'.split(' ');
    var i = keys.length;
    var k;
    while (i--) {
        k = keys[i];
        obj[k] = link[k];
    }
    return obj;
}

function template(str, data) {
    return str.replace(/{([\w.]*)}/g, function (_, m) {
        var keys = m.split('.');
        var val = data;
        for (var i = 0; i < keys.length; ++i) {
            if (val[keys[i]] == null) {
                return '';
            }
            val = val[keys[i]];
        }
        return val;
    });
}

QueryString = new (function () {
    var self = this;

    self.parse = function (str, sep, eq) {
        sep = sep || '&';
        eq = eq || '=';
        var hash = {};
        var parts = str.split(sep);
        var part;
        var pos;
        var key;
        var value;
        var eqlen = eq.length;
        for (var i = 0, len = parts.length; i < len; ++i) {
            part = parts[i];
            if (!part) {
                continue;
            }
            pos = part.indexOf(eq);
            if (pos == -1) {
                key = part;
                value = '';
            }
            else {
                key = part.substr(0, pos);
                value = decodeURIComponent(part.substr(pos + eqlen, part.length));
            }
            hash[key] = value;
        } 
        return hash;
    };

    self.stringify = function (hash, sep, eq) {
        sep = sep || '&';
        eq = eq || '=';
        var parts = [];
        for (var i in hash) {
            parts.push(hash[i] ? i + eq + encodeURIComponent(hash[i]) : i); 
        }
        return parts.join(sep);
    }
})();

FileSaver = new (function () {
    var self = this;

    self.handleURL = function (url, name) {
        name = name || 'file';
        var link = document.createElement('a');
        link.href = url; 
        link.setAttribute('download', name);
        link.style.display = 'none';  
        document.body.appendChild(link);
        link.onclick = function () {
            document.body.removeChild(link);
        };
        link.click();
    };

    self.handleBlob = function (blob, name) {
        var url = URL.createObjectURL(blob);
        self.handleURL(url, name);
    };

    self.handleText = function (txt, name) {
        var blob = new Blob([txt]);
        self.handleBlob(blob, name);
    };
})();