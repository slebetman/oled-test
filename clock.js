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

process.on('exit', () => {
	oled.clearDisplay();
	oled.update();
});
 
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
oled.update();
var prevIP;

setInterval(function(){
	var t = new Date();
	
	var h = t.getHours();
	var m = t.getMinutes();
	var s = t.getSeconds();
	
	var a = h > 12 ? 'pm' : 'am';
	var hh = h%12;
	
	var ip = os.networkInterfaces().wlan0[0].address;
	
	if (hh == 0) hh = 12;

	if (ip != prevIP) {
		oled.clearDisplay();
		prevM = null;
		prevIP = ip;
		if (ip.length > 21) {
			ip = ip.substr(0,18) + '..';
		}
		var len = ip.length;
		var xpos = Math.round((10.5-(len/2))*6)+1;
		oled.setCursor(xpos,46);
		oled.writeString(font,1,ip,1,true);
	}		
	if (m !== prevM) {
		prevM = m;	
		oled.setCursor(0,10);
		oled.writeString(font,4,`${pad(hh)}:${pad(m)}`,1,true);
		oled.setCursor(108,25);
		oled.writeString(font,2,`${a}`,1,true);
	}
	oled.setCursor(108,10);
	oled.writeString(font,2,`${pad(s)}`,1,true);

	asyncq.parallel({
		cpu: cpuInfo,
		memTotal: raspInfo.getMemoryTotal,
		memAvailable: raspInfo.getMemoryAvailable
	})	
	.then(info => {
		var cpu = info.cpu;
		var mA = parseFloat(info.memAvailable)/1024;
		var mT = parseFloat(info.memTotal)/1024;
		var mU = (mT-mA)/mT;
	
		if (!isNaN(cpu.percentUsed)) {
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
},1000);
