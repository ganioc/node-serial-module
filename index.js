'use strict';

var _ = require('underscore');
var SerialPort = require('serialport');

var UART_PORT = '/dev/tty.usbserial';
var UART_BAUDRATE = 9600;
var MAX_LENGTH = 36;

var buffer = new Buffer(MAX_LENGTH);
var indexBuffer = 0;

var STATE_IDLE = 0;
var STATE_FRAME = 1;
//var STATE_END = 2;

var state = STATE_IDLE;

(function(arg){

    console.log(arg +  ' port app started ');

    console.log('--------------------');
    
    var port = new SerialPort(
	UART_PORT,
	{
	    baudrate: UART_BAUDRATE,
	    parser: SerialPort.parsers.raw
	}
    );

    function getFrame(){
	//console.log('indexBuffer:' + indexBuffer);
	port.emit('frame', new Buffer.from(buffer).slice(0, indexBuffer));
	indexBuffer = 0;
    }

    function analyzeByte( b){
	//console.log('state:'+ state);
	
	switch(state){
	case STATE_IDLE:
	    if( b == 0x01 ){
		state = STATE_FRAME;
	    }
	    break;
	case STATE_FRAME:
	    if( b == 0xff){
		// end of a frame
		getFrame();
		state = STATE_IDLE;

	    }else if(indexBuffer >= MAX_LENGTH ){
		    getFrame();
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
    }
    
    function analyzeFrame( data){
	data.forEach(function(m){
	    analyzeByte(m);
	});
    }
   
    function sendFrame(pt, str){
	var buf = new Buffer(str.length + 2);
	var inBuf = new Buffer(str);
	
	buf[0] = 0x01;
	
	inBuf.copy(buf, 1, 0, inBuf.length);

	buf[str.length + 1] = 0xff;
	
	pt.write(buf, function(err){
	    if(err){
		return console.log('Error on write: ', err.message);		
	    }else{
		console.log(new Date());
		console.log('message written');
		return 0;
	    }

	});	
    }
    
    port.on('open', function(){
	console.log( 'Port opened');

	setInterval(function(){
	    sendFrame(port, 'abcdefghij');
	    
	}, 1500);
	
    });

    port.on('error', function(err){
	console.log('Error: ', err.message);
    });

    port.on('close', function(){
	console.log('port closed');
    });

    port.on('data', function(data){
	//console.log(data.toString());
	analyzeFrame(data);
	
    });

    port.on('frame', function(frame){
	console.log('\n' + new Date());
	console.log('Received frame:');
	console.log(frame.length + ':' + frame.toString());
	//console.log(frame.toString());
	
    });
    
})('hello');

