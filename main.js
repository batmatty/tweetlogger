var util = require('util');

var loggerfactory = require('./loggerfactory')
  , config = require('./config');

var loggers = [];

util.log('Twitterlogger: Running...');

for (i = 0; i<config.usernames.length; i++){
	
	loggers.push(loggerfactory(config, config.usernames[i]));

	if (loggers[i]){
		loggers[i].on('maxIdInitialised', function(){
			util.log(this.username + ': maxId Initialised from database!');
			this.maxIdInit = true;
		});

		loggers[i].on('updated', function(lastTweets){
			util.log(this.username +': The MaxId is: ' + this.maxId);
			util.log(this.username +': Size of the last received tweets : '+ lastTweets.length);
			this.log(lastTweets);
		});
	}

	setInterval(function(logger){
		if(logger.maxIdInit){
			logger.updateTweets();
		}
	}, 10000, loggers[i]);
}