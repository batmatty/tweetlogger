var util = require('util');

var loggerfactory = require('./loggerfactory')
  , config = require('./config');

var loggers = [];

util.log('Twitterlogger: Running...');

util.log('Creating tweetgetters for : ' +config.usernames);

for (i = 0; i<config.usernames.length; i++){
	
	loggers.push(loggerfactory(config, config.usernames[i]));

	if (loggers[i]){

		loggers[i].on('initialised', function(){
			util.log(this.username + ': Initialised from database!');
			this.getTweets();
		});

		loggers[i].on('tweetsDownloaded', function(tweets){
			util.log(this.username +': The MaxId is: ' + this.maxId);
			util.log(this.username +': '+tweets.length+' tweets downloaded from twitter.');
			this.log(tweets);
		});

		loggers[i].on('tweetslogged', function(result){
			util.log(this.username + ': '+result.affectedRows+' rows saved to the database. ');
			this.getTweets();
		});

		loggers[i].on('endOfTweets', function(logger){
			var index = loggers.indexOf(logger);
			if (index > -1) {
    			loggers.splice(index, 1);
			}
			util.log(logger.username + ' : '+ logger.tweetsLogged + ' tweets logged in total.');
			if (loggers.length === 0){
				util.log('All tweetgetters complete!');
				this.closeDb();
			}
		})
	}
}