var util = require('util');

var loggerfactory = require('./loggerfactory')
  , config = require('./config');

var loggers = [];

util.log('Twitterlogger: Running...');

util.log('Creating Tweetloggers for : ' +config.usernames);

for (i = 0; i<config.usernames.length; i++){
	
	loggers.push(loggerfactory(config, config.usernames[i]));

	if (loggers[i]){

		loggers[i].on('initialised', function(){
			this.getTweets();
		});

		loggers[i].on('tweetsDownloaded', function(tweets){
			this.log(tweets);
			this.checkRateLimit();
		});

		loggers[i].on('tweetslogged', function(result){
			this.getTweets();
		});

		loggers[i].on('endOfTweets', function(logger){
			var index = loggers.indexOf(logger);
			if (index > -1) {
    			loggers.splice(index, 1);
			}
			if (loggers.length === 0){
				util.log('All tweetgetters complete!');
				this.closeDb();
			}
		})
	}
}