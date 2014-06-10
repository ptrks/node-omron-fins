node-omron-fins
===============
###Overview
This is an implementation of the [OMRON FINS protocol](https://www.google.com/search?q=omrin+fins&oq=omrin+fins&aqs=chrome..69i57j0l5.945j0j7&sourceid=chrome&es_sm=93&ie=UTF-8#q=omron+fins&spell=1) using Node.js. This library allows for rapid development of network based services that need to communicate with FINS capable devices. Utilizing the awesome asynchronous abilities of Node.js communication with large numbers of devices is very fast. UDP was chosen as the first variant of the protocol to be implemented because of its extremely low overhead and performance advantages. Although UDP is connectionless this library makes use of software based timeouts and transaction identifiers to allow for better reliability. 


This initial release has limited features:

* UDP is only supported
* Memory Area Read is currently the only available command
* Limited to reading from the DM (0x82) area
 
These limitations will shrink considerably with the next release. 

###Prerequisites
* [Install Node.js](http://howtonode.org/how-to-install-nodejs) (Contains installation instructions for Windows, Linux and Mac)
* [Install Wireshark](http://www.wireshark.org/download.html) (This will allow you to see monitor FINS communication)



###Install
As an example we will be making a directory for our example code and installing the module there:
```sh
mkdir helloFins
cd helloFins
npm install git://github.com/patrick/node-omron-fins   
```


###Logging Data & Troubleshooting
Once you have Wirshark installed it is very simple to analyze your OMRON FINS traffic:

Simply select your network interface and then hit "Start"
![Interface](http://i.imgur.com/9K8u9pB.png "Select interface and hit start")

Once in Wireshark change your filter to "omron"
![Filter](http://i.imgur.com/j3GxeJn.png "Change filter")

Now you can examine each FINS packet individually
![Filter](http://i.imgur.com/3Wjpbqf.png "Examine Packet")



###Basic Usage
Bare bones example that will show you how to read data from a single client.

```js
var fins = require('omron-fins');

// Connecting to remote FINS client on port 9600 with default timeout value.
var client = fins.FinsClient(9600,'127.0.0.1');

// Setting up our error listener
client.on('error',function(error) {
  console.log("Error: ", error);
});

// Setting up the response listener
// Showing properties of a response
client.on('reply',function(msg) {
  console.log("Reply from: ", msg.remotehost);
	console.log("Replying to issued command of: ", msg.command);
	console.log("Response code of: ", msg.code);
	console.log("Data returned: ", msg.values);
});


//Read 10 registers starting at DM register 00000
client.read('D00000',10);


```


###Multiple Clients  
Example of instantiating multiple objects to allow for asynchronous communications. Because this code doesn't wait for a response from any client before sending/receiving packets it is incredibly fast.


```js
var fins = require('omron-fins');

var debug = true;

/* Hold our FinsClient objects */
var clients = [];

/* Hold both successful and failed communication attempts */
var responses = [];

/* 
	List of remote hosts
	More than likely will be generated from external source
*/

var remoteHosts = ['127.0.0.1','127.0.0.2','127.0.0.3'];


/*
	This method will be executed once we know all communications 
	have either timed out or responded accordingly. This is where
	data will be processed (database,api,etc)

*/

var finished = function(responses) {
	console.log("All responses and or timeouts received");
	console.log(responses);

};

var pollUnits = function() {

    /* We use number of hosts to compare to the length of the response array */
	var numberOfRemoteHosts = remoteHosts.length;
    var options = {timeout:10000};
	for (var i in remoteHosts) {

		/*
			Add each client to the FinsClient object array
			Each FinsClient object using default timeout and currently iterated IP
		*/
		clients[i] = fins.FinsClient(9600,remoteHosts[i],options);

		clients[i].on('reply',function(msg) {
			/* Add key value pair of [ipAddress] = values from read */
			responses[msg.remotehost] = msg.values;
			/* Check to see size of response array is equal to number of hosts */
			if(Object.keys(responses).length == numberOfRemoteHosts){
				finished(responses);
			}
			if(debug)
				console.log("Got reply from: ", msg.remotehost);
		});

		/* If timeout occurs log response for that IP as null */
		clients[i].on('timeout',function(host) {
			responses[host] = null;
			if(Object.keys(responses).length == numberOfRemoteHosts){
				finished(responses);
			};
			if(debug)
				console.log("Got timeout from: ", host);
		});

		clients[i].on('error',function(error) {
			console.log("Error: ", error)

		});

		/* Read 10 registers starting at DM location 00000 */
		clients[i].read('D00000',10);

	};
};



console.log("Starting.....");
pollUnits();

```


