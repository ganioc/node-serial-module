/**
 * @fileOverview
 * @name serial.js
 * @author Yang Jun <yangjun@nanchao.org>
 * @license MIT license

0x01
(ascii)
type:{PNG|CUS}
id:{ 2 bytes }
0xffff

 */
'use strict';

var EventEmitter = require('events');
var util = require('util');
var _ = require('underscore');
var SerialPort = require('serialport');

var LENGTH_ID = 2;
var LENGTH_TYPE = 3;

var TYPE_PING = 'PNG';
var TYPE_FEEDBACK = 'FDB';
var TYPE_CUST = 'CUT';
var SYMBOL_END = 0xff;
var SYMBOL_START = 0x01;

var MAX_LENGTH = 72;

var buffer = new Buffer(MAX_LENGTH);
var indexBuffer = 0;

var STATE_IDLE = 0;
var STATE_FRAME = 1;

var state = STATE_IDLE;

var i = 0; // message id, sequence

function Serial(portPath, baudRate){
    EventEmitter.call(this);
    var that = this;

    this._port = new SerialPort(
        portPath,
        {
            baudrate: baudRate,
            parser: SerialPort.parsers.raw
        }
    );

    this._port.on('open', function(){
        //log_print( ' opened');
        that.emit('open');
    });

    this._port.on('error', function(err){
        //log_print('Error: ', err.message);
        that.emit('error', err);
    });

    this._port.on('close', function(){
        //log_print(' closed');
        that.emit('close');
    });

    this._port.on('data', function(data){
        that.analyzeFrame(data);
    });

    this._port.on('frame', function(frame){
	console.log('\n' + new Date());
	console.log('Received frame:[' + frame.length + ']');
	console.log(frame);
	
	that.parse_type(frame);
	
    });
}
util.inherits(Serial, EventEmitter);

Serial.prototype.analyzeFrame = function(data){
    var that = this;
    data.forEach(function(m){
	that.analyzeByte( m);
    });
};

Serial.prototype.analyzeByte = function(b){
    var that = this;
    
    switch(state){
    case STATE_IDLE:
	if( b == 0x01 ){
	    state = STATE_FRAME;
	}
	break;
    case STATE_FRAME:
	if( b == 0xff || indexBuffer >= MAX_LENGTH ){
	    // end of a frame
	    that.getFrame();
	    state = STATE_IDLE;

	}else{
	    buffer[indexBuffer] = b;
	    indexBuffer++;
	}
	break;
    default:
	console.log('unrecognized state');
	break;
    }
};

Serial.prototype.getFrame = function(){
    this._port.emit('frame', new Buffer.from(buffer).slice(0, indexBuffer));
    indexBuffer = 0;    
};

Serial.prototype.createContent = function(type, content){
    i++;

    if(i > 0xffff){
	    i = 0;
    }
    
    return this.createContentBasic(type, i, content);    
    
};

Serial.prototype.createContentBasic = function(type,id, content){
    var buf = new Buffer(LENGTH_TYPE + LENGTH_ID + content.length);

    if(Buffer.isBuffer(id)){
	console.log('id length is:' + id.length);
	id = id.readUInt16BE(0);
    }

    if(Buffer.isBuffer(content)){
	content = content.toString();
    }
    
    buf.write(type, 0, LENGTH_TYPE);
    buf.writeUInt16BE(id, LENGTH_TYPE);
    buf.write(content, LENGTH_ID + LENGTH_TYPE, content.length);
    return buf;        
};

Serial.prototype.sendType = function(type, content){
    this.sendFrame(this.createContent(type, content));
};

Serial.prototype.sendFrame = function( str){
    var buf = new Buffer(str.length + 2);
    var inBuf = new Buffer(str);

    console.log('Sent:' + '[' + str.length + ']');
    console.log(inBuf);
    
    buf[0] = SYMBOL_START;
    
    inBuf.copy(buf, 1, 0, inBuf.length);

    buf[str.length + 1] = SYMBOL_END;
    
    this._port.write(buf, function(err){
	if(err){
	    return console.log('Error on write: ', err.message);		
	}else{
	    console.log(new Date());
	    console.log('message written');
	    return 0;
	}
    });	
};

Serial.prototype.parse_type = function( frame){
    //console.log('in parse_type()');
    
    if(frame.length < LENGTH_TYPE + LENGTH_ID){
	return console.log('Too short type');
    }
    var tempBuf = new Buffer(frame);
    
    var type = tempBuf.slice(0, LENGTH_TYPE).toString();
    //console.log(type);
    var newId = frame.readUInt16BE(3);
    //console.log('newId is:' + newId);

    var tempBuf2 = new Buffer(frame);
    //console.log(tempBuf2);
    var newContent = tempBuf2.slice(LENGTH_ID + LENGTH_TYPE, frame.length).toString();
    //console.log(newContent);

    var obj = {};
    obj.id = newId;
    obj.content = newContent;
    
    switch(type){

    case TYPE_PING:
	//sendFeedback(port, TYPE_FEEDBACK ,id, content);
	this.emit('frame_ping',
		 obj);
	break;
    case TYPE_CUST:
	this.emit('frame_cust',
		 obj);
	break;
    case TYPE_FEEDBACK:
	this.emit('frame_feedback',
		 obj);
    default:
	console.log('Unrecognized type');
	break;
    }
    
    return 0;    

};

Serial.prototype.sendPing = function(){
    console.log('');

    this.sendType( TYPE_PING, 'hello' );
};

Serial.prototype.sendPingFB = function( id, content){
    console.log('');

    this.sendFeedback( TYPE_FEEDBACK, id , content);
};

Serial.prototype.sendFeedback = function(type, id, content){

    this.sendFrame(this.createContentBasic(type, id, content));
};

module.exports = Serial;

