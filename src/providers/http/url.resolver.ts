const splitReg = new RegExp('^' +
    '(?:' +
    '([^:/?#.]+)' +  // scheme - ignore special characters
    // used by other URL parts such as :,
    // ?, /, #, and .
    ':)?' +
    '(?://' +
    '(?:([^/?#]*)@)?' +                  // userInfo
    '([\\w\\d\\-\\u0100-\\uffff.%]*)' +  // domain - restrict to letters,
    // digits, dashes, dots, percent
    // escapes, and unicode characters.
    '(?::([0-9]+))?' +                   // port
    ')?' +
    '([^?#]+)?' +        // path
    '(?:\\?([^#]*))?' +  // query
    '(?:#(.*))?' +       // fragment
    '$');

export type UrlInfo = {
    scheme?: string;
    userInfo?: string;
    domain?: string;
    port?: string | number;
    path?: string;
    query?: string;
    fragment?: string;
}

export function urlParser(url: string): UrlInfo {
    let match = url.match(splitReg) || [];
    return {scheme: match[1], userInfo: match[2], domain: match[3], port: match[4], path: match[5], query: match[6], fragment: match[7]};
}

export function buildUrl(scheme?: string, userInfo?: string, domain?: string, port?: string | number, path?: string, queryData?: string, fragment?: string) {
    let out: string[] = [];

    if (scheme) {
        out.push(scheme + ':');
    }

    if (domain) {
        out.push('//');
        if (userInfo) {
            out.push(userInfo + '@');
        }
        out.push(domain);
        if (port) {
            out.push(':' + port);
        }
    }

    if (path) {
        out.push(path);
    }

    if (queryData) {
        out.push('?' + queryData);
    }

    if (fragment) {
        out.push('#' + fragment);
    }

    return out.join('');
}

export function queryStrParser(queryStr: string): { [key: string]: string | string[] } {
    let queryData = {};

    if (queryStr == null) {
        return queryData;
    }

    for (let part of queryStr.split('&')) {
        let row = part.split('=', 2);
        let key = decodeURIComponent(row[0]);
        let value = row[1] ? decodeURIComponent(row[1]) : '';

        if (key in queryData) {
            if (Array.isArray(queryData[key])) {
                queryData[key].push(value);
            } else {
                queryData[key] = [queryData[key], value];
            }
        } else {
            queryData[key] = value;
        }
    }

    return queryData;
}

export function buildQueryStr(queryData: { [key: string]: string | string[] }) {
    let out: string[] = [];

    for (let key in queryData) {
        let value = queryData[key];
        key = encodeURIComponent(key);
        if (Array.isArray(value)) {
            value.forEach((item) => out.push(key + '=' + encodeURIComponent(item)));
        } else {
            out.push(key + '=' + encodeURIComponent(value));
        }
    }
    return out.join('&');
}
