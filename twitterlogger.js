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

    // Number of tweets returned by the api on each call
    this.COUNT = 100; 

    // Mode the tweetlogger is running in
    this.mode = 'init';

    //Twitterlogger Class variables   
    this.twit = new Twit(config.access_config);
    
    // Username of this tweetlogger
    this.username = username;
  	
    // Twitter api parameters
    this.maxId = null; // reset on first data from the api
    this.sinceId = null;

    // UNUSED AT PRESENT!
    this.resetTime = 0;
    
    // Counter for the number of tweets that have been logged and the number of apicalls
    this.tweetsLogged = 0;
    this.apiCalls = 0;
    
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
        
        if (self.mode === 'init'){
            query = 'SELECT tweet_id from ' + self.username + ' ORDER BY tweet_id ASC LIMIT 1'; // Get tweets in asending order
            connection.query(query, function(err, result){
                if (err)  throw err;
                if (result.length === 0){  // There is nothing in the database and we are in "init" mode
                    self.maxId = null; // Set maxId to null
                    self.sinceId = null; // Set sinceId to null
                } else { // If there are tweets already in the database
                    self.maxId = twitterutils.decStrNum(result[0].tweet_id); // Set maxId to the oldest tweet in the database
                    self.sinceId = null; // Set sinceId to null
                }
                connection.release();
                util.log(self.username + ': Tweetlogger initialised in '+self.mode+' mode!');
                self.emit('initialised');
            });
        } else if (self.mode === 'log'){
            query = 'SELECT tweet_id from ' + self.username + ' ORDER BY tweet_id DESC LIMIT 1'; // Get tweets in descending order
            connection.query(query, function(err, result){
                if (err)  throw err;
                if (result.length === 0){  // There is nothing in the database and we are in log mode
                    util.log(self.username + ': Database has not been initialised for logging. Please initialise the database for this user!');
                    process.exit();
                } else { // If there are tweets already in the database
                    self.sinceId = result[0].tweet_id; // Set sinceId to the latest tweet_id in the database
                    self.maxId = null; // Set maxId to null
                }
                connection.release();
                util.log(self.username + ': Tweetlogger initialised in '+self.mode+' mode!');
                self.emit('initialised');
            });
        } else {
            util.log(self.mode + ' is not a recognised mode. Please use a recognised mode: init or log');
            process.exit();
        }    
    });
}


/**
 *  Downloads tweets from the twitter api
 */

Twitterlogger.prototype.getTweets = function () {
	var self = this;
	var  params = {
          'screen_name' : self.username, 
          'trim_user' : false,
          'count' : self.COUNT
        };
  if (self.mode === 'init'){
      if (self.maxId !== null){
          params.max_id = self.maxId;
      }
  }      
	if (self.mode === 'log'){
      params.since_id = self.sinceId;
      if (self.maxId !== null){
          params.max_id = self.maxId;
      }
  }
 	this.twit.get('statuses/user_timeline', params, function(err, reply) {
      	self.apiCalls++;
        if(err) { 
      		console.log('TWITTER MODULE ERROR: ' + err);
      		return; 
      	}
        self.tweetsLogged += reply.length;
      	if (reply.length !== 0){  // Check if the reply is empty, i.e. there are no tweets
      		self.maxId = twitterutils.decStrNum(reply[reply.length-1].id_str); // javascript can't handle large number - use string	
      	  util.log(self.username +': The MaxId is: ' + self.maxId);
          util.log(self.username +': '+reply.length+' tweets downloaded from twitter.');
          self.emit("tweetsDownloaded", reply);
        } else {
          util.log(self.username + ': No more tweets to download.');
          util.log(self.username + ' : '+ self.tweetsLogged + ' tweets logged in total.');
          util.log(self.username + ' : Total API Calls : ' + self.apiCalls);
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
            tempArr.push(fdate.format("YYYY-MM-DD HH:mm:ss")); // Check that the dates correspond!! 
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
                if (result.warningCount > 0){
                    connection.query("SHOW WARNINGS;", function(err, result2){
                        console.log(result2);
                    })
                }
                connection.release();
                util.log(self.username + ': '+result.affectedRows+' rows saved to the database. ');
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
 *  Downloads the rate limit stats from the twitter api
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
        util.log("API CALLS REMAING : " +left);
	  });
} 

module.exports = Twitterlogger;