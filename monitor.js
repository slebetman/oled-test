#! /usr/bin/env node

var i2c = require('i2c-bus');
var i2cBus = i2c.openSync(1);
var oled = require('oled-i2c-bus');
var font = require('oled-font-5x7');
var raspInfo = require('raspberry-info');
var asyncq = require('async-q');
var cpuInfo = require('./lib/cpu');
 
var opts = {
  width: 128,
  height: 64
};
 
var oled = new oled(i2cBus, opts);

setInterval(function(){

	asyncq.parallel({
		cpuTemp: raspInfo.getCPUTemperature,
		gpuTemp: raspInfo.getGPUTemperature,
		memFree: raspInfo.getMemoryFree,
		memAvailable: raspInfo.getMemoryAvailable,
		memTotal: raspInfo.getMemoryTotal,
		cpu: cpuInfo
	})
	.then(info => {
		var cpuT = parseFloat(info.cpuTemp).toFixed(1);
		var gpuT = parseFloat(info.gpuTemp).toFixed(1);
		var mF = parseFloat(info.memFree)/1024;
		var mA = parseFloat(info.memAvailable)/1024;
		var mT = parseFloat(info.memTotal)/1024;
		var mU = (mT-mA)/mT;
		
		oled.clearDisplay();
		
		oled.setCursor(0,0);
		oled.writeString(font,1,`CPU Temp = ${cpuT}`,1,true);
		
		oled.setCursor(0,13);
		oled.writeString(font,1,`GPU Temp = ${gpuT}`,1,true);
		
		oled.setCursor(0,26);
		oled.writeString(font,1,`Mem Use  = ${(mU*100).toFixed(1)}%`,1,true);
		
		oled.setCursor(0,39);
		oled.writeString(font,1,`CPU Use  = ${info.cpu.percentUsed.toFixed(1)}%`,1,true);
		
		oled.update();
	});
},1000);