var vm = require('vm'),
    fs = require('fs'),
    path = require('path'),
    config = require('./config'),
    bundleName = 'index',
    pathToBundle = path.resolve('src/bundles/project.bundles', bundleName),
    bemtreePath = path.join(pathToBundle, bundleName + '.bemtree.js'),
    bemhtmlPath = path.join(pathToBundle, bundleName + '.bemhtml.js'),
    BEMTREE = require(bemtreePath).BEMTREE,
    BEMHTML = require(bemhtmlPath).BEMHTML,

    isDev = process.env.NODE_ENV === 'development',
    useCache = !isDev,
    cacheTTL = config.cacheTTL,
    cache = {};

function render(req, res, data, context) {
    var query = req.query,
        user = req.user,
        cacheKey = req.url + (context ? JSON.stringify(context) : '') + (user ? JSON.stringify(user) : ''),
        cached = cache[cacheKey];

    if (useCache && cached && (new Date() - cached.timestamp < cacheTTL)) {
        return res.send(cached.html);
    }

    if (isDev && query.json) return res.send('<pre>' + JSON.stringify(data, null, 4) + '</pre>');

    var bemtreeCtx = {
        block: 'root',
        context: context,
        // extend with data needed for all routes
        data: Object.assign({}, {
            url: req._parsedUrl
        }, data)
    };

    try {
        if (isDev) {
            bemtreeCtx.global = global;
            vm.runInNewContext(fs.readFileSync(bemtreePath), bemtreeCtx);
            BEMTREE = bemtreeCtx.BEMTREE;
        }

        var bemjson = BEMTREE.apply(bemtreeCtx);
    } catch(err) {
        console.error('BEMTREE error', err.stack);
        console.trace('server stack');
        return res.sendStatus(500);
    }

    if (isDev && query.bemjson) return res.send('<pre>' + JSON.stringify(bemjson, null, 4) + '</pre>');

    try {
        if (isDev) {
            bemjson.global = global;
            vm.runInNewContext(fs.readFileSync(bemhtmlPath), bemjson);
            BEMHTML = bemjson.BEMHTML;
        }

        var html = BEMHTML.apply(bemjson);
    } catch(err) {
        console.error('BEMHTML error', err.stack);
        return res.sendStatus(500);
    }

    useCache && (cache[cacheKey] = {
        timestamp: new Date(),
        html: html
    });

    res.send(html);
}

function dropCache() {
    cache = {};
}

module.exports = {
    render: render,
    dropCache: dropCache
};
