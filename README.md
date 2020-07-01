node-omron-fins
===============
### Overview
This is an implementation of the [OMRON FINS protocol](https://www.google.com/search?q=omrin+fins&oq=omrin+fins&aqs=chrome..69i57j0l5.945j0j7&sourceid=chrome&es_sm=93&ie=UTF-8#q=omron+fins&spell=1) using Node.js. This library allows for rapid development of network based services that need to communicate with FINS capable devices. Utilizing the awesome asynchronous abilities of Node.js communication with large numbers of devices is very fast. UDP was chosen as the first variant of the protocol to be implemented because of its extremely low overhead and performance advantages. Although UDP is connectionless this library makes use of software based timeouts and transaction identifiers to allow for better reliability. 


### Supported Commands:

* Memory area read
* Multiple memory area read
* Memory area write
* Memory area fill
* Memory area transfer
* Controller status read
* Run
* Stop



### Prerequisites
* [Install Node.js](http://howtonode.org/how-to-install-nodejs) (Contains installation instructions for Windows, Linux and Mac)
* [Install Wireshark](http://www.wireshark.org/download.html) (This will allow you to see monitor FINS communication)



### Install
As an example we will be making a directory for our example code and installing the module there:
```sh
mkdir helloFins
cd helloFins
npm install git://github.com/patrick--/node-omron-fins.git
```

### Usage
Requiring the library:
```js
var fins = require('omron-fins');
```


Create a `FinsClient` object and pass it:
*  `port`
* `ip`
* `options` array with timeout value in ms. (default timeout is 2 seconds) 
```js
var options = {timeout:10000};
var client = fins.FinsClient(9600,'127.0.0.1');
```

Add a reply listener. Response object content will vary depending on the command issued. However all responses are guaranteed to contain the following information:


* `.sid` - Transaction identifier. Use this to track specific command/ response pairs.
* `.command` - The issued command code.
* `.response` - The response code returned after attempting to issue a command.
* `.remotehost` - The IP address the response was sent from.

```js
client.on('reply',msg){
	console.log('SID: ', msg.sid);
	console.log('Command Code: ', msg.command);
	console.log('Response Code: ', msg.response);
	console.log('Remote Host: ', msg.remotehost);
});
```




Finally, call any of the supported commands! 




##### .read(address, regsToRead, callback)
Memory Area Read Command 
* `address` - Memory area and the numerical start address
* `regsToRead` - Number of registers to read
* `callback` - Optional callback method 

```js
 /* Reads 10 registers starting from register 00000 in the DM Memory Area */
.read('D00000',10);

/* Same as above with callback */
client.read('D00000',10,function(err,bytes) {
	console.log("Bytes: ", bytes);
});
```

##### .readMultiple(address(es))
Multiple Memory Area Read Command 
* `address` - Memory area and the numerical start address

```js
 /* Reads multiple registers from different memory areas, you can mix and match words and bit reads. 
    Does not currently support callback  */
.readMultiple('D100','H10','CB80:03','H22');

```

##### .write(address, dataToBeWritten, callback)
Memory Area Write Command
* `address` - Memory area and the numerical start address
* `dataToBeWritten` - An array of values or single value
* `callback` - Optional callback method 
```js
/* Writes single value of 1337 into DM register 00000 */
.write('D00000',1337)

/* Writes 1 to bit 3 of HB register 50 */
.write('HB50:03',1)

/* Writes the values 12,34,56 into DM registers 00000 00001 000002 */
.write('D00000',[12,34,56]);

/* Same as above with callback */
.write('D00000',[12,34,56],function(err,bytes) {
	console.log("Bytes: ", bytes);
});

/* Writes 1 to bits 3,4 & 5 of HB register 50 */
.write('HB50:03',[1,1,1])

```

##### .transfer(soureceAddress, destAddress, regsToBeWritten, callback)
Memory Area Transfer Command
* `sourceAddress` - Memory area and the numerical start address of the source
* `destAddress` - Memory area and the numerical start address of the destination
* `regsToBeWritten` - Number of registers to write
* `callback` - Optional callback method
```js

/* Transfers 10 consecutive DM registers from 50 to 100 */
.fill('D50','D100',10);


/* Sames as above with callback */
.fill('D50','D100',10,function(err,bytes) {
	console.log("Bytes: ", bytes); 
});


```
##### .fill(address, dataToBeWritten, regsToBeWritten, callback)
Memory Area Fill Command
* `address` - Memory area and the numerical start address
* `dataToBeWritten` - Two bytes of data to be filled
* `regsToBeWritten` - Number of registers to write
* `callback` - Optional callback method
```js

/* Writes 1337 in 10 consecutive DM registers from 00100 to 00110 */
.fill('D00100',1337,10);


/* Sames as above with callback */
.fill('D00100',1337,10,function(err,bytes) {
	console.log("Bytes: ", bytes); 
});


```


##### .run(callback)
RUN
* `callback` Optional callback
```js
/* Puts into Monitor mode */
.run(function(err,bytes) {

});


```

##### .stop(callback)
STOP
* `callback` Optional callback

```js

/* Stops program excution by putting into Program mode */
.stop(function(err,bytes) {

});

.stop();
```



======


### Basic Example
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
  	console.log("Transaction SID: ", msg.sid)
	console.log("Replying to issued command of: ", msg.command);
	console.log("Response code of: ", msg.code);
	console.log("Data returned: ", msg.values);
});


//Read 10 registers starting at DM register 00000
client.read('D00000',10);


```


### Multiple Clients  
Example of instantiating multiple objects to allow for asynchronous communications. Because this code doesn't wait for a response from any client before sending/receiving packets it is incredibly fast. In this example we attempt to read a memory area from a list of remote hosts. Each command will either return with a response or timeout. Every transaction will be recorded to the `responses` array with the `ip` as a key and the `msg.values` as the associated value. If a timeout occurs the value for that transaction will be set to null. Once the size of the responses array is equal to the number of units we tried to communicate with we know we have gotten a response or timeout from every unit


```js
var fins = require('omron-fins');
var debug = true;
var clients = [];
var responses = [];

/* List of remote hosts can be generated from local or remote resource */
var remoteHosts = ['127.0.0.1','127.0.0.2','127.0.0.3'];

/ * Data is ready to be processed (sent to API,DB,etc) */
var finished = function(responses) {
	console.log("All responses and or timeouts received");
	console.log(responses);

};

var pollUnits = function() {

    /* We use number of hosts to compare to the length of the response array */
	var numberOfRemoteHosts = remoteHosts.length;
    var options = {timeout:10000};
	for (var i in remoteHosts) {

	        / * Add key value entry into responses array */
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

### Logging Data & Troubleshooting
Once you have Wirshark installed it is very simple to analyze your OMRON FINS traffic:

Simply select your network interface and then hit "Start"
![Interface](http://i.imgur.com/9K8u9pB.png "Select interface and hit start")

Once in Wireshark change your filter to "omron"
![Filter](http://i.imgur.com/j3GxeJn.png "Change filter")

Now you can examine each FINS packet individually
![Filter](http://i.imgur.com/3Wjpbqf.png "Examine Packet")

