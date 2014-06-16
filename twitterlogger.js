/**
 * Twitterlogger is a utility which downloads all the tweets from
 * a given users timeline and saves them to a SQL database.  
 */

/**
 * Require statements
 */

var Twit = require('twit')
  , util = require('util')
  , mysql = require('mysql')
  , moment = require('moment')
  , twitterutils = require('./twitterutils')
  , config = require('./config')
  , EventEmitter = require('events').EventEmitter;

/**
 * Database connection information 
 */

var pool = mysql.createPool(config.db_config);

/**
 * Twitterlogger Constructer 
 */

function Twitterlogger (username) { 

    //Constants

    //Change count to change the number of results returned
    //from the Twitter API.
    this.COUNT = 200; 

    //Twitterlogger Class variables   
    this.twit = new Twit(config.access_config);
    this.username = username;
  	this.maxId = null; // reset on first data from the api
    this.resetTime = 0;
    this.tweetsLogged = 0;

    //Initialisation variable to 
    this.maxIdInit = false;
    
    //Initialise the tweetgetter
    this.init();
};

/**
 * Make the Twitterlogger class inherit from the EventEmitter Class
 */

util.inherits(Twitterlogger, EventEmitter);

/**
 * Initialisation function - Initlialises the maxId parameter used in the twitter api call. 
 */

Twitterlogger.prototype.init = function(){
    var self = this;
    
    pool.getConnection(function(err, connection){
        if (err) throw err;
        
        query = 'SELECT tweet_id from ' + self.username + ' ORDER BY tweet_id ASC LIMIT 1';
        
        connection.query(query, function(err, result){
            if (err){
                console.log('MYSQL ERROR in .init function: ' + err);
            } else if (result.length !== 0) {
                self.maxId = twitterutils.decStrNum(result[0].tweet_id);
            } else {
                self.maxId = null;
            }
            connection.release();
            self.emit('initialised');
        });
    })
}

/**
 *  Downloads tweets from the twitter api
 */

Twitterlogger.prototype.getTweets = function () {
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
 	this.twit.get('statuses/user_timeline', params, function(err, reply) {
      	if(err) { 
      		console.log('TWITTER MODULE ERROR: ' + err);
      		return; 
      	}
        self.tweetsLogged += reply.length;
      	if (reply.length !== 0){  // Check if the reply is empty, i.e. there are no tweets
      		self.maxId = twitterutils.decStrNum(reply[reply.length-1].id_str); // javascript can't handle large number - use string	
      	  self.emit("tweetsDownloaded", reply);
        } else {
          util.log(self.username + ': No more tweets to download.');
          self.emit('endOfTweets', self);
        }
	});
}

/**
 *  Saves the downloaded batch of tweets to the database
 */

Twitterlogger.prototype.log = function(tweets){
    var self = this;
    values = [];
    if (tweets !== null){
        for (var i = 0; i < tweets.length; i++){
            var tempArr = [];
            var fdate = moment.utc(tweets[i].created_at, 'ddd MMM DD HH:mm:ss Z YYYY');
            tempArr.push(tweets[i].id_str);
            tempArr.push(tweets[i].user.screen_name);
            tempArr.push(fdate.format());
            tempArr.push(tweets[i].text);
            values.push(tempArr);
        } 
        pool.getConnection(function(err, connection){
            if (err) throw err;
        
            var sql = "INSERT INTO "+self.username+" (tweet_id, username, date, tweet) VALUES ?";
            connection.query(sql, [values], function(err, result) {
                if (err){
                    console.log('MYSQL ERROR in .log: ' + err);  
                }
                connection.release();
                self.emit('tweetslogged', result)
            });
        });
    }
}

/**
 *  Close the database connection
 */

Twitterlogger.prototype.closeDb = function(){
  pool.end(function(){
    util.log('Database pool closed!');
  });
}

/**
 *  Donwloads the rate limit stats from the twitter api
 */

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
        self.resetTime = Math.abs(moment().diff(moment.unix(reset)));
	  });
} 

module.exports = Twitterlogger;