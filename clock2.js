#! /usr/bin/env node

var i2c = require('i2c-bus');
var i2cBus = i2c.openSync(1);
var oled = require('oled-i2c-bus');
var font = require('oled-font-5x7');
var os = require('os');
var cpuInfo = require('./lib/cpu');
var raspInfo = require('raspberry-info');
var asyncq = require('async-q');

cpuInfo();
 
var opts = {
  width: 128,
  height: 64
};

var loop = null;

function exitHandler () {
	clearInterval(loop);
	loop = null;
	oled.clearDisplay();
	oled.update();
}

[
	'exit',
	'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
	'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
].forEach(e => process.on(e, exitHandler));

var oled = new oled(i2cBus, opts);

function pad (n) {
	n = n.toString();
	
	if (n.length < 2) {
		n = '0' + n;
	}
	
	return n;
}

var prevM;
oled.clearDisplay();
oled.dimDisplay(false);
var prevIP;
function counter (max) {
	var c = -1;
	return function () {
		c = (c+1) % max;
		
		return c == 0;
	}
}

var updateStats = counter(3);
var checkIP = counter(11);

loop = setInterval(function(){
	var t = new Date();
	
	var h = t.getHours();
	var m = t.getMinutes();
	var s = t.getSeconds();
	
	var a = h > 12 ? 'pm' : 'am';
	var hh = h%12;
	
	if (hh == 0) hh = 12;

	if (m !== prevM) {
		prevM = m;	
		oled.setCursor(0,0);
		oled.writeString(font,3,`${pad(hh)}:${pad(m)}`,1,true);
		oled.setCursor(96,15);
		oled.writeString(font,1,`${a}`,1,true);
	}
	oled.setCursor(84,0);
	oled.writeString(font,2,`:${pad(s)}`,1,true);

	if (checkIP()) {
		var ip = os.networkInterfaces().wlan0[0].address;
		
		if (ip != prevIP) {
			oled.clearDisplay();
			prevM = null;
			prevIP = ip;
			if (ip.length > 21) {
				ip = ip.substr(0,18) + '..';
			}
			var len = ip.length;
			var xpos = Math.round((10.5-(len/2))*6)+1;
			oled.setCursor(xpos,28);
			oled.writeString(font,1,ip,1,true);
		}
	}

	if (updateStats()) {	
		asyncq.parallel({
			cpu: cpuInfo,
			memTotal: raspInfo.getMemoryTotal,
			memAvailable: raspInfo.getMemoryAvailable,
			cpuTemp: raspInfo.getCPUTemperature,
			gpuTemp: raspInfo.getGPUTemperature
		})	
		.then(info => {
			if (loop == null) return;
		
			var cpu = info.cpu;
			var mA = parseFloat(info.memAvailable)/1024;
			var mT = parseFloat(info.memTotal)/1024;
			var mU = (mT-mA)/mT;
			var cpuT = parseFloat(info.cpuTemp).toFixed(1);
			var gpuT = parseFloat(info.gpuTemp).toFixed(1);
		
			if (!isNaN(cpu.percentUsed)) {
				oled.setCursor(25,38);
				oled.writeString(font,1,
					`cpu temp:${cpuT}`,
				1,true);
	
				oled.setCursor(25,47);
				oled.writeString(font,1,
					`gpu temp:${gpuT}`,
				1,true);
	
				oled.setCursor(8,57);
				oled.writeString(font,1,
					`cpu:${cpu.percentUsed.toFixed(1)}%`,
				1,true);
				oled.setCursor(68,57);
				oled.writeString(font,1,
					`ram:${(mU*100).toFixed(1)}%`,
				1,true);
			}
			
			oled.update();
		});
	}
	else {
		cpuInfo().then(cpu => {
			if (!isNaN(cpu.percentUsed)) {
				oled.setCursor(8,57);
				oled.writeString(font,1,
					`cpu:${cpu.percentUsed.toFixed(1)}%`,
				1,true);
			}
			
			oled.update();
		});
	}
},1000);
