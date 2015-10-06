var dgram = require('dgram');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var constants = require('./constants');

module.exports = FinsClient;

function FinsClient (port,host,options) {
  if(!(this instanceof FinsClient)) return new FinsClient(port,host,options);
    EventEmitter.call(this);
    FinsClient.init.call(this,port,host,options);
};

inherits(FinsClient,EventEmitter);



_compareArrays = function(a,b) {
    if(a.length !== b.length)
        return false;
    for(var i = a.length; i--;) {
        if(a[i] !== b[i])
            return false;
    }
    return true;
};


/* Credit to http://tech.karbassi.com/2009/12/17/pure-javascript-flatten-array/ */
_mergeArrays = function(array) {
    var flat = [];
    for (var i = 0, l = array.length; i < l; i++){
        var type = Object.prototype.toString.call(array[i]).split(' ').pop().split(']').shift().toLowerCase();
        if (type) { flat = flat.concat(/^(array|collection|arguments|object)$/.test(type) ? _mergeArrays(array[i]) : array[i]); }
    }
    return flat;
};


_keyFromValue = function(dict,value) {
    var key = Object.keys(dict)
    .filter(function(key){
        return dict[key] === value
    }
    )[0];

    return key;
};

  

_padHex = function (width,number) {
    return("0"*width + number.toString(16).substr(-width));
};



_wordsToBytes = function(words) {
    var bytes = [];
    if(!words.length) {
        bytes.push((words & 0xff00) >> 8);
        bytes.push((words & 0x00ff));
    } else {
        for(var i in words) {
            bytes.push((words[i] & 0xff00) >> 8);
            bytes.push((words[i] & 0x00ff));
        }
    }
    return bytes;

};


_translateMemoryAddress = function(memoryAddress) {
    var re = /(.)([0-9]*):?([0-9]*)/; 
    var matches = memoryAddress.match(re);
    var decodedMemory = {
        'MemoryArea':matches[1],
        'Address':matches[2],
        'Bit':matches[3]
    };

    var temp = [];
    var byteEncodedMemory = [];

    if(!constants.MemoryAreas[decodedMemory['MemoryArea']]) {
        temp.push([0x82]);
    } else {
         temp.push([constants.MemoryAreas[decodedMemory['MemoryArea']]]);
    }

     temp.push(_wordsToBytes([decodedMemory['Address']]));
     temp.push([0x00]);
     byteEncodedMemory = _mergeArrays(temp);

    return byteEncodedMemory;

  
};

_incrementSID = function(sid) {
    return (sid % 254) + 1;
};

_buildHeader = function(header) {
    var builtHeader =  [
        header.ICF,
        header.RSV,
        header.GCT,
        header.DNA,
        header.DA1,
        header.DA2,
        header.SNA,
        header.SA1,
        header.SA2,
        header.SID 
    ];
    return builtHeader;

};

_buildPacket = function(raw) {
    var packet = [];
    packet = _mergeArrays(raw);
    return packet;
};

_getResponseType = function(buf) {
    
    var response = [];
    response.push(buf[10]);
    response.push(buf[11]);
    return response;
};

_processDefault = function(buf,rinfo) {
    var sid = buf[9];
    var command = (buf.slice(10,12)).toString("hex");
    var response = (buf.slice(12,14)).toString("hex");
    return {remotehost:rinfo.address,sid:sid,command:command,response:response};

};

_processStatusRead = function(buf,rinfo) {
    var sid = buf[9];
    var command = (buf.slice(10,12)).toString("hex");
    var response = (buf.slice(12,14)).toString("hex");
    var status = buf[14];
    var mode = buf[15];
    var fatalErrorData = {};
    var nonFatalErrorData = {};    
    for(var i in constants.FatalErrorData) {
        if((buf.readInt16BE(17) & constants.FatalErrorData[i]) !=0 )
            fatalErrorData.push(i);
    }

    for(var i in constants.nonFatalErrorData) {
        if((buf.readInt16BE(18) & constants.nonFatalErrorData[i]) !=0 )
            nonFatalErrorData.push(i);
    };
    var statusCodes = constants.Status;
    var runModes = constants.Modes;


    return {
        remotehost:rinfo.address,
        sid:sid,
        command:command,
        response:response,
        status:_keyFromValue(statusCodes,status),
        mode:_keyFromValue(runModes,mode),
        fatalErrorData : fatalErrorData || null,
        nonFatalErrorData : nonFatalErrorData || null
    };
};

_processMemoryAreaRead = function(buf,rinfo) {
    var data = [];
    var sid = buf[9];
    var command = (buf.slice(10,12)).toString("hex");
    var response = (buf.slice(12,14)).toString("hex");
    var values = (buf.slice(14,buf.length));
    for(var i = 0; i < values.length; i+=2) {
        data.push(values.readInt16BE(i));
    }
    return {remotehost:rinfo.address,sid:sid,command:command,response:response,values:data};
};


_processReply = function(buf,rinfo) {
    var commands = constants.Commands;
    var responseType = (_getResponseType(buf)).join(' ');
    
    switch(responseType) {
       
        case commands.CONTROLLER_STATUS_READ.join(' ') : 
            return _processStatusRead(buf,rinfo);
            break;

        case commands.MEMORY_AREA_READ.join(' '):
            return _processMemoryAreaRead(buf,rinfo);
            break;

        default:
            return _processDefault(buf,rinfo);

    };

};
_decodePacket = function(buf,rinfo) {
    var data = [];
    var command = (buf.slice(10,12)).toString("hex");
    var code = (buf.slice(12,14)).toString("hex");
    var values = (buf.slice(14,buf.length));
    for(var i = 0; i < values.length; i+=2) {
        data.push(values.readInt16BE(i));
    }
    return {remotehost:rinfo.address,command:command,code:code,values:data};
};


FinsClient.init = function (port,host,options) {
    var self = this;
    var defaultHost = constants.DefaultHostValues;
    var defaultOptions = constants.DefaultOptions;
    this.port = port || defaultHost.port;
    this.host = host || defaultHost.host;
    this.timeout = (options && options.timeout) || defaultOptions.timeout;
    this.socket = dgram.createSocket('udp4');
    this.responded = false;
    this.header = constants.DefaultFinsHeader;

    function receive (buf,rinfo) {
      self.responded = true;
      var msg = _processReply(buf,rinfo);
      self.emit('reply',msg);
    }

    function listening() {
        self.emit('open');
    }

    function close() {
        self.emit('close');
    }

    function error(err) {
        self.emit('error',err);
    }

    this.socket.on('message',receive);
    this.socket.on('listening',listening);
    this.socket.on('close',close);
    this.socket.on('error',error);

    if(this.timeout){
        setTimeout(function cb_setTimeout() {
            if(self.responded == false){
                self.emit('timeout',self.host);
            }
        },self.timeout);
    }
};


FinsClient.prototype.read = function(address,regsToRead,callback) {
    var self = this;
    self.header.SID = _incrementSID(self.header.SID);
    var header = _buildHeader(self.header);
    var address = _translateMemoryAddress(address);
    var regsToRead = _wordsToBytes(regsToRead);
    var command = constants.Commands.MEMORY_AREA_READ;
    var commandData = [address,regsToRead];
    var packet = _buildPacket([header,command,commandData]);
    var buffer = new Buffer(packet);
    this.socket.send(buffer,0,buffer.length,self.port,self.host,callback);
};

FinsClient.prototype.write = function(address,dataToBeWritten,callback) {
    var self = this;
    self.header.SID = _incrementSID(self.header.SID);
    var header = _buildHeader(self.header);
    var address = _translateMemoryAddress(address);
    var regsToWrite = _wordsToBytes((dataToBeWritten.length || 1));
    var command = constants.Commands.MEMORY_AREA_WRITE;
    var dataToBeWritten = _wordsToBytes(dataToBeWritten);
    var commandData = [address,regsToWrite,dataToBeWritten];
    var packet = _buildPacket([header,command,commandData]);
    var buffer = new Buffer(packet);
    this.socket.send(buffer,0,buffer.length,self.port,self.host,callback);
};

FinsClient.prototype.fill = function(address,dataToBeWritten,regsToWrite,callback) {
    var self = this;
    self.header.SID = _incrementSID(self.header.SID);
    var header = _buildHeader(self.header);
    var address = _translateMemoryAddress(address);
    var regsToWrite = _wordsToBytes(regsToWrite);
    var command = constants.Commands.MEMORY_AREA_FILL;
    var dataToBeWritten = _wordsToBytes(dataToBeWritten);
    var commandData = [address,regsToWrite,dataToBeWritten];
    var packet = _buildPacket([header,command,commandData]);
    var buffer = new Buffer(packet);
    this.socket.send(buffer,0,buffer.length,self.port,self.host,callback);
};

FinsClient.prototype.run = function(callback) {
    var self = this;
    self.header.SID = _incrementSID(self.header.SID);
    var header = _buildHeader(self.header);
    var command = constants.Commands.RUN;
    var packet = _buildPacket([header,command]);
    var buffer = new Buffer(packet);
    this.socket.send(buffer,0,buffer.length,self.port,self.host,callback);
};

FinsClient.prototype.stop = function(callback) {
    var self = this;
    self.header.SID = _incrementSID(self.header.SID);
    var header = _buildHeader(self.header);
    var command = constants.Commands.STOP;
    var packet = _buildPacket([header,command]);
    var buffer = new Buffer(packet);
    this.socket.send(buffer,0,buffer.length,self.port,self.host,callback);
};


FinsClient.prototype.status = function(callback) {
    var self = this;
    self.header.SID = _incrementSID(self.header.SID);
    var header = _buildHeader(self.header);
    var command = constants.Commands.CONTROLLER_STATUS_READ;
    var packet = _buildPacket([header,command]);
    var buffer = new Buffer(packet);
    this.socket.send(buffer,0,buffer.length,self.port,self.host,callback);


};


FinsClient.prototype.close = function(){
    this.socket.close();
};


