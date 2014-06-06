/*
 * Twitterlogger is a utilty which monitors and logs the tweets from a 
 * selected list of followers and produces a csv file of all the 
 * tweets and the times -> UPDATE THIS!!
 * 
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
 *
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

    this.COUNT = 200; //Change this to tune performance

    //Twitterlogger Class variables    

    this.twit = new Twit(config.access_config);
    this.username = username.slice(1, username.length);
  	this.maxId = null; // reset on first data from the api
  	this.untilDate = new Date(2013, 01, 01);
    this.maxIdInit = false;
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
      		console.log('NODE TWITTER MODULE ERROR: ' + err);
      		return; 
      	}
      	if (reply.length !== 0){  // Check if the reply is empty, i.e. there are no tweets
      		self.maxId = twitterutils.decStrNum(reply[reply.length-1].id_str); // javascript can't handle large number - use string	
      	}
      	self.emit("updated", reply);
	});

}

Twitterlogger.prototype.checkRateLimit = function(callback){
	this.twit.get('application/rate_limit_status', {}, function(err, reply) {
      	if(err) {return callback(err)}
    	callback(reply);
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
            //console.log('Result: ' +  result);
            //console.log('log Error: ' + err);
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
          //console.log('getMaxId RESULT :' + result[0].tweet_id);
          //console.log('getMaxId ERROR : '+ err);
        } else {
          self.maxId = null;
        }
        self.emit('maxIdInitialised');
    });
  
}

module.exports = Twitterlogger;