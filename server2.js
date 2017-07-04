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
	// console.log(objFrame.id);
	// console.log(objFrame.content);

	port.sendPingFB(objFrame.id, objFrame.content);
    });
    
})('hello');

