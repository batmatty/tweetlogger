var Twitterlogger = require('./twitterlogger')
	, config = require('./config')
	, moment = require('moment');

var tg = new Twitterlogger(config, '@inflatethecow');

tg.checkRateLimit(function(limit, left, reset){
	console.log('limit: ' + limit);
	console.log('left : ' + left);
	console.log('reset : ' + reset);
	console.log('reset / left : ' + reset/left);
});


