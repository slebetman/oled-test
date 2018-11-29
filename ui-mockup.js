#! /usr/bin/env node

var i2c = require('i2c-bus');
var i2c_OLED = i2c.openSync(1);
var font = require('./fixedfont');

process.on('exit',() => i2c_OLED.closeSync());

function i2c_OLED_send_cmd (c, arr) {
	var control = 0x80; // some use 0X00 other examples use 0X80. I tried both 
	var address = 0x3c;
	
	if (arr === undefined) {
		arr = [];
	}
	
	arr.unshift(c);
	arr.unshift(control);
	
	var buf = Buffer.from(arr);
	
	i2c_OLED.i2cWriteSync(address, buf.length, buf);
}

function i2c_OLED_send_data (arr) {
	var control = 0x40;
	var address = 0x3c;

	arr.unshift(control);
	
	var buf = Buffer.from(arr);

	i2c_OLED.i2cWriteSync(address, buf.length, buf);
}

function i2c_OLED_init () {
	i2c_OLED_send_cmd(0xAE); // Set display OFF		
 
	i2c_OLED_send_cmd(0xD5); // Set Display Clock Divide Ratio / OSC Frequency
	i2c_OLED_send_cmd(0x80); // Display Clock Divide Ratio / OSC Frequency 
 
	i2c_OLED_send_cmd(0xA8); // Set Multiplex Ratio
	i2c_OLED_send_cmd(0x3F); // Multiplex Ratio for 128x64 (64-1)
 
	i2c_OLED_send_cmd(0xD3); // Set Display Offset
	i2c_OLED_send_cmd(0x00); // Display Offset
 
	i2c_OLED_send_cmd(0x40); // Set Display Start Line
 
	i2c_OLED_send_cmd(0x8D); // Set Charge Pump
	i2c_OLED_send_cmd(0x14); // Charge Pump (0x10 External, 0x14 Internal DC/DC)

 	i2c_OLED_send_cmd(0x20);
 	i2c_OLED_send_cmd(0x00);
 	
	i2c_OLED_send_cmd(0xA1); // Set Segment Re-Map
	i2c_OLED_send_cmd(0xC8); // Set Com Output Scan Direction
 
	i2c_OLED_send_cmd(0xDA); // Set COM Hardware Configuration
	i2c_OLED_send_cmd(0x12);
 
	i2c_OLED_send_cmd(0x81); // Set Contrast
	i2c_OLED_send_cmd(0x8F); // Contrast
 
	i2c_OLED_send_cmd(0xD9); // Set Pre-Charge Period
	i2c_OLED_send_cmd(0xF1); // Set Pre-Charge Period (0x22 External, 0xF1 Internal)
 
	i2c_OLED_send_cmd(0xDB); // Set VCOMH Deselect Level
	i2c_OLED_send_cmd(0x40); // VCOMH Deselect Level
 
	i2c_OLED_send_cmd(0xA4); // Set all pixels OFF
	i2c_OLED_send_cmd(0xA6); // Set display not inverted
	i2c_OLED_send_cmd(0xAF); // Set display On	
}

function gotoByPage (x, page) {
	i2c_OLED_send_cmd(0x00 | (x & 0x0f)); // set x coordinates
	i2c_OLED_send_cmd(0x10 | ((x >> 4) & 0x0f)); // set x coordinates
	i2c_OLED_send_cmd(0xb0 | page);   // set y coordinates
}

function clear () {
	i2c_OLED_send_cmd(0x20,[0x02]);  // set page addressing mode
	
	for (var i=0;i<8;i++) {
		// console.log(i);
		gotoByPage(0,i);
		i2c_OLED_send_data('0'.repeat(64).split(''));
		i2c_OLED_send_data('0'.repeat(64).split(''));
	}
	gotoByPage(0,0);
}

function reverseBits (n) {
	// console.log(n);
	var tmp = 0;
	
	tmp |= (n << 7) & 0x80;
	tmp |= (n << 5) & 0x40;
	tmp |= (n << 3) & 0x20;
	tmp |= (n << 1) & 0x10;
	
	tmp |= (n >> 1) & 0x08;
	tmp |= (n >> 3) & 0x04;
	tmp |= (n >> 5) & 0x02;
	tmp |= (n >> 7) & 0x01;
	// console.log(tmp);
	return tmp;
}

function getFont (ascii) {
	var idx = ascii.charCodeAt() - 32;
	if (idx < 0 || idx > 95) {
		idx = 0;
	}
	idx *=5;
	
	var pixels = font.slice(idx, idx+5);
	var ret = [];
	var p;
	
	for (var i=0; i<5; i++) {
		p = pixels[i];
		if (p == 0xff) break;
		ret.push(p);
	}
	ret.push(0x00);
	// ret.push(0x00);
	
	return ret;
}

function string2pixels (txt, invert) {
	var pixels = [];
	var f;
	
	txt = txt.split('');
	
	for (var i=0; i<txt.length; i++) {
		f = getFont(txt[i]);
		
		if (invert) f = f.map(p => p^0xff);
		
		pixels.push.apply(pixels,f);
	}
	
	// console.log(pixels.length);
	
	return pixels;
}

function invertLine (pixels) {
	for (var x=pixels.length;x<128;x++) pixels.push(0xff);
	return pixels;
}

i2c_OLED_init();
clear();

var pages = [
	function () {
		gotoByPage(0,0);
		i2c_OLED_send_data(invertLine(string2pixels(' Toy car',true)));
		
		gotoByPage(0,1);
		i2c_OLED_send_data(invertLine(string2pixels(' CHANNEL1',true)));
		
		gotoByPage(6,3);
		i2c_OLED_send_data(string2pixels('Input:'));
		i2c_OLED_send_data(string2pixels(' Joystick V ',true));
		
		gotoByPage(6,4);
		i2c_OLED_send_data(string2pixels('Enabled: yes '));
		
		gotoByPage(6,5);
		i2c_OLED_send_data(string2pixels('Scale: 100% '));
		
		gotoByPage(6,6);
		i2c_OLED_send_data(string2pixels('Expo: off'));
	},
	function () {
		gotoByPage(0,0);
		i2c_OLED_send_data(invertLine(string2pixels(' Toy car',true)));
		
		gotoByPage(0,1);
		i2c_OLED_send_data(invertLine(string2pixels(' CHANNEL1',true)));
		
		gotoByPage(6,3);
		i2c_OLED_send_data(string2pixels('Input:'));
		i2c_OLED_send_data(string2pixels(' Joystick H ',true));
		
		gotoByPage(6,4);
		i2c_OLED_send_data(string2pixels('Enabled: yes '));
		
		gotoByPage(6,5);
		i2c_OLED_send_data(string2pixels('Scale: 100% '));
		
		gotoByPage(6,6);
		i2c_OLED_send_data(string2pixels('Expo: off'));
	},
	function () {
		gotoByPage(0,0);
		i2c_OLED_send_data(invertLine(string2pixels(' Toy car',true)));
		
		gotoByPage(0,1);
		i2c_OLED_send_data(invertLine(string2pixels(' CHANNEL1',true)));
		
		gotoByPage(6,3);
		i2c_OLED_send_data(string2pixels('Input:'));
		i2c_OLED_send_data(string2pixels(' Joystick H '));
		
		gotoByPage(6,4);
		i2c_OLED_send_data(string2pixels('Enabled:'));
		i2c_OLED_send_data(string2pixels(' yes ',true));
		
		gotoByPage(6,5);
		i2c_OLED_send_data(string2pixels('Scale: 100% '));
		
		gotoByPage(6,6);
		i2c_OLED_send_data(string2pixels('Expo: off'));
	},
	function () {
		gotoByPage(0,0);
		i2c_OLED_send_data(invertLine(string2pixels(' Toy car',true)));
		
		gotoByPage(0,1);
		i2c_OLED_send_data(invertLine(string2pixels(' CHANNEL1',true)));
		
		gotoByPage(6,3);
		i2c_OLED_send_data(string2pixels('Input:'));
		i2c_OLED_send_data(string2pixels(' Joystick H '));
		
		gotoByPage(6,4);
		i2c_OLED_send_data(string2pixels('Enabled: yes '));
		
		gotoByPage(6,5);
		i2c_OLED_send_data(string2pixels('Scale:'));
		i2c_OLED_send_data(string2pixels(' 100% ',true));
		
		gotoByPage(6,6);
		i2c_OLED_send_data(string2pixels('Expo: off'));
	},
	function () {
		gotoByPage(0,0);
		i2c_OLED_send_data(invertLine(string2pixels(' Toy car',true)));
		
		gotoByPage(0,1);
		i2c_OLED_send_data(invertLine(string2pixels(' CHANNEL1',true)));
		
		gotoByPage(6,3);
		i2c_OLED_send_data(string2pixels('Input:'));
		i2c_OLED_send_data(string2pixels(' Joystick H '));
		
		gotoByPage(6,4);
		i2c_OLED_send_data(string2pixels('Enabled: yes '));
		
		gotoByPage(6,5);
		i2c_OLED_send_data(string2pixels('Scale:'));
		i2c_OLED_send_data(string2pixels(' 100% '));
		
		gotoByPage(6,6);
		i2c_OLED_send_data(string2pixels('Expo:'));
		i2c_OLED_send_data(string2pixels(' off ',true));
	},
	function () {
		gotoByPage(0,0);
		i2c_OLED_send_data(invertLine(string2pixels(' Toy car',true)));
		
		gotoByPage(0,1);
		i2c_OLED_send_data(invertLine(string2pixels(' CHANNEL1',true)));
		
		gotoByPage(6,3);
		i2c_OLED_send_data(string2pixels('Input:'));
		i2c_OLED_send_data(string2pixels(' Joystick H '));
		
		gotoByPage(6,4);
		i2c_OLED_send_data(string2pixels('Enabled: yes '));
		
		gotoByPage(6,5);
		i2c_OLED_send_data(string2pixels('Scale:'));
		i2c_OLED_send_data(string2pixels(' 100% ',true));
		
		gotoByPage(6,6);
		i2c_OLED_send_data(string2pixels('Expo: off '));
	},
	function () {
		gotoByPage(0,0);
		i2c_OLED_send_data(invertLine(string2pixels(' Toy car',true)));
		
		gotoByPage(0,1);
		i2c_OLED_send_data(invertLine(string2pixels(' CHANNEL1',true)));
		
		gotoByPage(6,3);
		i2c_OLED_send_data(string2pixels('Input:'));
		i2c_OLED_send_data(string2pixels(' Joystick H '));
		
		gotoByPage(6,4);
		i2c_OLED_send_data(string2pixels('Enabled:'));
		i2c_OLED_send_data(string2pixels(' yes ',true));
		
		gotoByPage(6,5);
		i2c_OLED_send_data(string2pixels('Scale: 100% '));
		
		gotoByPage(6,6);
		i2c_OLED_send_data(string2pixels('Expo: off'));
	},
];

pages[0]();
var currentPage = 0;

setInterval(function(){
	pages[currentPage]();
	currentPage++;
	currentPage = currentPage % pages.length;
},1000);
