/**
 * Module dependencies
 */

 var mysql = require('mysql')
   , config = require('./config');

/**
 * Initlialise Client
 */

delete config.db_config.database;
var db = mysql.createConnection(config.db_config);

/**
* Create database.
*/
console.log('Deleting any existing database...')

db.query('DROP DATABASE tweetget')

console.log('Creating the tweetget database...');

db.query('CREATE DATABASE IF NOT EXISTS tweetget');
db.query('USE tweetget');


/**
* Create tables for each user.
*/

for(i = 0; i < config.usernames.length; i++){
   	
   	db.query('DROP TABLE IF EXISTS ' + config.usernames[i]);

	db.query('CREATE TABLE '+config.usernames[i]+' (' +
			'tweet_id BIGINT NOT NULL,' +
			'username VARCHAR(100) NULL,' +
			'date DATETIME NULL,' +
			'tweet VARCHAR(140) NULL,' +
			'hashtags VARCHAR(100) NULL,' +
			'PRIMARY KEY (tweet_id))');
}

/**
* Close client.
*/
console.log("Finished!")
db.end();