/*
 * Tweetget configuration generator
 * 
 * This utility generates the configuration for the tweetget application
 * 
 */

// Required Modules
var fs = require('fs'),
    readline = require('readline'),
    stream = require('stream');

// Constants
var CONFIGFILE = './config.txt'

var config = {
	'access_config' : {
       'consumer_key' : '',
	   'consumer_secret' : '',
	   'access_token' : '',
	   'access_token_secret' : ''
    },
    'usernames' : [],
    'hashtags' : []
}

var instream = fs.createReadStream(CONFIGFILE);
var outstream = new stream;
outstream.readable = true;
outstream.writable = true;

var rl = readline.createInterface({
    input: instream,
    output: outstream,
    terminal: false
});

rl.on('line', function(line) {
	while (line.indexOf(' ') !== -1){  //Probably a better way to remove the white space?
		line  = line.replace(' ', '');
	}
    if (line[0] !==  undefined){
        switch (line[0].trim())
        {
        	case ('*'): 
        		break;
        	case ('$'): 
        		switch (line.slice(1, line.indexOf('=')).toUpperCase())
        		{
        			case ('CONSUMER_KEY'):
        				config.access_config.consumer_key = line.slice(line.indexOf('=')+1, line.length);
        				break;
        			case ('CONSUMER_SECRET'):
        				config.access_config.consumer_secret = line.slice(line.indexOf('=')+1, line.length);
        				break;
        			case ('ACCESS_TOKEN'):
        				config.access_config.access_token = line.slice(line.indexOf('=')+1, line.length);
        				break;
        			case ('ACCESS_TOKEN_SECRET'):
        				config.access_config.access_token_secret = line.slice(line.indexOf('=')+1, line.length);
        				break;
        		}
        		break;
        	case ('@'): config.usernames.push(line.slice(0, line.length));
        				break;
        	case ('#'): config.hashtags.push(line.slice(0, line.length));
        				break;
        }
    }
});

rl.on('close', function(){
    console.log('Finished reading ' + CONFIGFILE);
    var configstr = 'module.exports = ' + JSON.stringify(config);
    fs.writeFile('config.js', configstr, function (err) {
        if (err) throw err;
        console.log('config.js created!');
    });
    rl.close();
})