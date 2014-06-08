/*
 * Twitterlogger is a utility which downloads all the tweets from
 * a given users timeline and saves them to a SQL database.  
 */

/*
 * Require statements
 */

var Twit = require('twit')
  , util = require('util')
  , mysql = require('mysql')
  , moment = require('moment')
  , twitterutils = require('./twitterutils')
  , EventEmitter = require('events').EventEmitter;

/*
 * Database connection information 
 */

var connection = mysql.createConnection({
        host     : 'localhost',
        database : 'test',
        user     : 'matt',
        supportBigNumbers : true,
        bigNumberStrings : true, 
        password : ''
    });

/*
 * Twitterlogger Constructer 
 */

var Twitterlogger = function(config, username) { 

    //Constants

    //Change count to change the number of results returned
    //from the Twitter API.
    this.COUNT = 200; 

    //Twitterlogger Class variables    
    this.twit = new Twit(config.access_config);
    this.username = username.slice(1, username.length);
  	this.maxId = null; // reset on first data from the api
  	this.untilDate = new Date(2013, 01, 01);
    this.maxIdInit = false;
    this.callRate = 5000;
    
    //Initiliase the max_id variable for the API call.
    this.setMaxId()
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

	if(this.maxId === null){
    params = {
			'screen_name' : self.username, 
			'trim_user' : false,
			'count' : self.COUNT
		};
	} else {
		params = {
			'screen_name' : self.username,
			'max_id' : self.maxId,
			'trim_user' : false,
			'count' : self.COUNT
		};
	}
  console.log(params);
 	this.twit.get('statuses/user_timeline', params, function(err, reply) {
      	if(err) { 
      		console.log('TWITTER MODULE ERROR: ' + err);
      		return; 
      	}
      	if (reply.length !== 0){  // Check if the reply is empty, i.e. there are no tweets
      		self.maxId = twitterutils.decStrNum(reply[reply.length-1].id_str); // javascript can't handle large number - use string	
      	}
      	self.emit("updated", reply);
	});

}

Twitterlogger.prototype.checkRateLimit = function(){
    var self = this;
    params = {
      'resources' : 'statuses'
    };
    this.twit.get('application/rate_limit_status', params, function(err, reply) {
        if(err) {
            console.log('TWITTER MODULE ERROR in .checkRateLimit : ' + err);  
        };
        limit = reply.resources.statuses['/statuses/user_timeline'].limit;
        left = reply.resources.statuses['/statuses/user_timeline'].remaining;
        reset = reply.resources.statuses['/statuses/user_timeline'].reset;
    	  //resetTime is the time from now to the next rate reset in milliseconds
        resetTime = moment().diff(moment.unix(reset));
        self.callRate = Math.abs(resetTime/left);
        console.log('left :' + left);
        console.log('resetTime : ' + resetTime);
	  });
} 

Twitterlogger.prototype.log = function(tweets){
    if (tweets !== null){
      for(var i = 0; i < tweets.length; i++){
        var tweet  = tweets[i];
        var fdate = moment.utc(tweet.created_at, 'ddd MMM DD HH:mm:ss Z YYYY');
        var query = 'INSERT INTO tweets ' +
                    '(tweet_id, username, date, tweet)' +
                    ' VALUES (' + tweet.id_str + ', ' 
                                + connection.escape(tweet.user.name) + ','
                                + '\'' + fdate.format() + '\','
                                + connection.escape(tweet.text) + ')';
        connection.query(query, function(err, result) {
            if (err){
                console.log('MYSQL ERROR in .log: ' + err);  
            }
        });
      }
    }
}

Twitterlogger.prototype.setMaxId = function(){
    var self = this;
    query = 'SELECT tweet_id from tweets ORDER BY tweet_id ASC LIMIT 1';
    connection.query(query, function(err, result){
        if (result.length !== 0){
            self.maxId = twitterutils.decStrNum(result[0].tweet_id);
        } else if (err) {
            console.log('MYSQL ERROR in .setMaxID: ' + err);
        } else {
          self.maxId = null;
        }
        self.emit('maxIdInitialised');
    });
  
}

module.exports = Twitterlogger;