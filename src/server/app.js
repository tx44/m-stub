var bodyParser = require('body-parser');
var compression = require('compression');
var enb = require('enb/lib/server/middleware/enb');
var express = require('express');
var morgan = require('morgan');
var path = require('path');

var config = require('./config');
var router = require('./router');

var app = express();
var server = require('http').createServer(app);
var isProd = process.env.YENV === 'production';
if (!isProd) app.use(morgan('dev'));

app.disable('x-powered-by');
app.enable('trust proxy');

app.set('handle', process.env.PORT || config.defaultPort);
app.use('/', express.static(path.resolve(__dirname, '../../public')));

app.use(compression());
app.use(bodyParser.urlencoded({
    extended : false,
    limit : 1024 * 1000
}));

if (!isProd) app.use(enb());
app.use(router);

server.listen(app.get('handle'), function() {
    console.log('Express server listening on port ' + app.get('handle'));
});
