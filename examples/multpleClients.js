var fins = require('../lib/index');

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
