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
	console.log('Received frame:');
	console.log(frame.length + ':' + frame.toString());

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
    var buf = new Buffer(LENGTH_TYPE + LENGTH_ID + content.length);
    
    i++;

    if(i > 0xffff){
	i = 0;
    }
    
    buf.write(type, 0, LENGTH_TYPE);
    buf.writeUInt16BE(i, LENGTH_ID);
    buf.write(content, LENGTH_ID + LENGTH_TYPE, content.length);
    return buf;    
    
};

Serial.prototype.sendType = function(type, content){
    this.sendFrame(this.createContent(type, content));
};

Serial.prototype.sendFrame = function( str){
    var buf = new Buffer(str.length + 2);
    var inBuf = new Buffer(str);

    console.log('Sent:' + str);
    
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
    if(frame.length < LENGTH_TYPE + LENGTH_ID){
	return console.log('Too short type');
    }

    var type = new Buffer(frame).slice(0, LENGTH_TYPE).toString();
    var id = new Buffer(frame).slice(LENGTH_TYPE,LENGTH_ID);
    var content = new Buffer(frame).slice(LENGTH_ID + LENGTH_TYPE, frame.length - LENGTH_ID - LENGTH_TYPE);

    console.log('type is:' + type);
    
    switch(type){
    case TYPE_PING:
	//sendFeedback(port, TYPE_FEEDBACK ,id, content);
	this.emit('frame_ping',
		  {
		      id:id,
		      content:content
		  });
	break;
    case TYPE_CUST:
	this.emit('frame_cust',
		  {
		      id:id,
		      content:content
		  });
	break;
    case TYPE_FEEDBACK:
	this.emit('frame_feedback',
		  {
		      id:id,
		      content:content
		  });
    default:
	console.log('Unrecognized type');
	break;
    }
    
    return 0;    

};

Serial.prototype.sendPing = function(){
    this.sendType( TYPE_PING, 'hello' );
};

module.exports = Serial;

