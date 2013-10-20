function template(str, data) {
    return str.replace(/{([\w.]*)}/g, function () {
        var keys = arguments[1].split('.');
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