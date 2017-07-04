/**
 * @fileOverview
 * @name client.js
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

    port.on('open', function(){
	console.log( 'Port opened');
	
	setInterval(function(){
	    port.sendPing();
	},2000);
    });

    port.on('error', function(err){
	console.log('Error: ', err.message);
    });

    port.on('close', function(){
	console.log('port closed');
    });

    port.on('frame_feedback', function(objFrame){
	console.log('Rcved frame_feedback');
	console.log(objFrame);
    });
    
})('hello');

