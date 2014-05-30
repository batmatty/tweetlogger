/*
 * Twitterlogger is a utilty which monitors and logs the tweets from a 
 * selected list of followers and produces a csv file of all the 
 * tweets and the times -> UPDATE THIS!!
 * 
 */

var Twit = require('twit')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter;

/*
 * Twitterlogger Constructer 
 */

var Twitterlogger = function(config, username) { 
	this.twit = new Twit(config.access_config);
  	this.username = username.slice(1, username.length);
  	this.sinceId = 12345; //reset on first data from the api
  	this.maxId = 12345; // reset on first data from the api
  	this.lastTweets = [];
  	this.requestCount = 0;
  	this.untilDate = new Date(2013, 01, 01);
};

/*
 * Make the Twitterlogger class inherit from the EventEmitter Class
 */

util.inherits(Twitterlogger, EventEmitter);


/*
 *  Updates latest list of tweets
 */

Twitterlogger.prototype.updateTweets = function () {
	var self = this;
	var params = {};

	if(this.requestCount === 0){
		params = {
			'screen_name' : self.username, 
			'trim_user' : true,
			'count' : 2	//change this in the production version
		};
	} else {
		params = {
			'screen_name' : self.username,
			'since_id' : self.sinceId, 
			'max_id' : self.maxId,
			'trim_user' : true,
			'count' : 2	//change this in the production version
		};
	}
 	this.twit.get('statuses/user_timeline', params, function(err, reply) {
      	if(err) { 
      		console.log(err);
      		return; 
      	}
      	self.requestCount += 1; 
      	if (reply.length !== 0){  // if reply is empty, there are no new tweets
      		self.maxId = reply[0].id;
      		self.sinceId = reply[reply.length-1].id;	
      		self.lastTweets = reply;
      	}
      	self.emit("updated", self.sinceId, self.maxId, self.lastTweets)
	});

}

Twitterlogger.prototype.checkRateLimit = function(callback){
	this.twit.get('application/rate_limit_status', {}, function(err, reply) {
      	if(err) {return callback(err)}
    	callback(reply);
	});
}

module.exports = Twitterlogger;