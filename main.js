var util = require('util');

var Twitterlogger = require('./twitterlogger')
  , config = require('./config');

var tg = new Twitterlogger(config, '@inflatethecow');

util.log('Twitterlogger: Running...');

setInterval(function(){
	tg.updateTweets();
}, 10000);

tg.on('updated', function(sinceId, maxId, lastTweets){
	util.log('The MaxId is: ' + maxId);
	util.log('The sinceId is: ' + sinceId);
	util.log('Size of the last received tweets : '+ lastTweets.length);
	for (var i = 0; i < lastTweets.length; i++){
		util.log('ID: ' + lastTweets[i].id + ' Tweet: ' + lastTweets[i].text);
	}
	tg.log(lastTweets);
});


//tg.getLastTweetIds(function(lastTweetIDs){
//	console.log(lastTweetIDs);
//})