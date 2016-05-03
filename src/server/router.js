var express = require('express');
var router = express.Router();

var config = require('./config');
var Render = require('./render');
var render = Render.render;
var dropCache = Render.dropCache;

router.get('/', function(req, res, next) {
    render(req, res, {
        page : {
            view: 'index',
            title: 'Index Page'
        }
    });
});

router.get('/context', function(req, res) {
    render(req, res, { page : { bundle: 'index', test: 'test' } }, {
        block: 'test',
        content: 'block'
    });
});

router.get('*', function(req, res) {
    render(req, res, {
        page : {
            view: 'error',
            title: 'Error Page',
            settings: config.settings
        }
    });
});

module.exports = router;
