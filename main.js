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

		loggers[i].on('endOfTweets', function(logger){
			var index = loggers.indexOf(logger);
			if (index > -1) {
    			loggers.splice(index, 1);
			}
			util.log('Logged all tweets for ' + logger.username);
			util.log('Number of tweets logged for '+logger.username+': '+logger.tweetsLogged);
			logger.closeDb();
		})
	}

	timerId = setInterval(function(loggers){
		if (loggers.length === 0){
			clearInterval(timerId);
		}
		for (j = 0; j < loggers.length; j++){
			if(loggers[j].maxIdInit){
				loggers[j].updateTweets();
				loggers[j].checkRateLimit();
			}
		}

	}, 10000, loggers);
}