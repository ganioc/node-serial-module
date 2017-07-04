/**
 * @fileOverview
 * @name server.js
 * @author Yang Jun <yangjun@nanchao.org>
 * @license MIT license
 */

'use strict';

var _ = require('underscore');
var Serial = require('./serial.js');

var UART_PORT = '/dev/tty.usbserial';
var UART_BAUDRATE = 9600;

(function(arg){

    console.log(arg +  ' port app started ');

    console.log('--------------------');
    
    var port = new Serial(
	UART_PORT,
	UART_BAUDRATE
    );


    // function sendFeedback(pt,  type, id, content){
    // 	var buf = new Buffer(LENGTH_TYPE + LENGTH_ID + content.length);
    // 	if(!Buffer.isBuffer(type)){
    // 	    type = new Buffer(type);
    // 	}
    // 	if(!Buffer.isBuffer(id)){
    // 	    id = new Buffer(id);
    // 	}
    // 	if(!Buffer.isBuffer(content)){
    // 	    content = new Buffer(content);
    // 	}

    // 	type.copy(buf, 0, 0, LENGTH_TYPE);
    // 	id.copy(buf, LENGTH_TYPE, 0, LENGTH_ID);
    // 	content.copy(buf, LENGTH_TYPE + LENGTH_ID,
    // 		     0, content.length);
    // 	sendFrame(pt, buf);
    // }

    port.on('open', function(){
	console.log( 'Port opened');
    });

    port.on('error', function(err){
	console.log('Error: ', err.message);
    });

    port.on('close', function(){
	console.log('port closed');
    });

    port.on('frame_ping', function(objFrame){
	console.log('Rcved frame_ping');
	console.log(objFrame);
    });
    
})('hello');

