/**
 * Factory Class for returing twitterlogger objects 
 */

/**
 * Class  
 */

var Twitterlogger = require('./twitterlogger')
  , mysql = require('mysql')
  , config = require('./config');

/**
 * Factory function that returns a twitter logger for each user
 */

var loggerFactory = function(config, username) { 
    return (new Twitterlogger(username)); 
}; 

module.exports = loggerFactory;