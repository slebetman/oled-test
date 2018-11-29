#! /usr/bin/env node

var i2c = require('i2c-bus');
var i2cBus = i2c.openSync(1);
var oled = require('oled-i2c-bus');
var font = require('oled-font-5x7');
 
var opts = {
  width: 128,
  height: 64
};
 
var oled = new oled(i2cBus, opts);

oled.clearDisplay();

//oled.setCursor(0,0);
//oled.writeString(font,1,"Hello Dave..",1,true);

oled.update();