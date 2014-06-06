var util = require('util');

var Twitterlogger = require('./twitterlogger')
  , config = require('./config');

var tg = new Twitterlogger(config, '@inflatethecow');

util.log('Twitterlogger: Running...');

setInterval(function(){
	if(tg.maxIdInit){
		tg.updateTweets();
	}
}, 10000);

tg.on('maxIdInitialised', function(){
	util.log('maxId Initialised from database!');
	tg.maxIdInit = true;
});

tg.on('updated', function(lastTweets){
	util.log('The MaxId is: ' + this.maxId);
	util.log('Size of the last received tweets : '+ lastTweets.length);
	for (i = 0; i< lastTweets.length; i++){
		console.log('Last received tweets : '+ lastTweets[i].text);
	}
	tg.log(lastTweets);
});


//tg.getLastTweetIds(function(lastTweetIDs){
//	console.log(lastTweetIDs);
//})