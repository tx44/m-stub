var fs = require('fs');
var path = require('path');
var vm = require('vm');

var config = require('./config');
var bundleName = 'index';
var pathToBundle = path.resolve('src/bundles/project.bundles', bundleName);
var bemtreePath = path.join(pathToBundle, bundleName + '.bemtree.js');
var bemhtmlPath = path.join(pathToBundle, bundleName + '.bemhtml.js');
var BEMTREE = require(bemtreePath).BEMTREE;
var BEMHTML = require(bemhtmlPath).BEMHTML;

var isDev = process.env.NODE_ENV === 'development';
var useCache = !isDev;
var cacheTTL = config.cacheTTL;
var cache = {};

function render(req, res, data, context) {
    var query = req.query;
    var user = req.user;
    var cacheKey = req.url + (context ? JSON.stringify(context) : '') + (user ? JSON.stringify(user) : '');
    var cached = cache[cacheKey];

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
