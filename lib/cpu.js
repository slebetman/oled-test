var fs = require('fs');

var history = [];
var AVERAGE_WINDOW = 3;

function calculateCPUPercentage (info) {
	history.push(info);
	while (history.length > AVERAGE_WINDOW) {
		history.shift();
	}
	
	var fractions = [];
	if (history.length == 1) {
		fractions.push(history[0].active/history[0].total);
	}
	else {
		for (var i=1; i<history.length; i++) {
			fractions.push(
				(history[i].active - history[i-1].active) /
				(history[i].total  - history[i-1].total)
			);	
		}
	}
	return fractions.reduce((a,b)=>a+b) / fractions.length * 100;
};

function getCPUInfo () {
	var currentCPUInfo = {};
	
	return new Promise((ok,fail) => {
		fs.readFile('/proc/stat', 'utf8', function(err, data){
			if(err){
				fail(err);
				return;
			}
			var lines = data.split('\n');
			var cpuTimes = lines[0].match(/[0-9]+/gi);
			currentCPUInfo.total = 0;
			// We'll count both idle and iowait as idle time
			currentCPUInfo.idle = parseInt(cpuTimes[3]) + parseInt(cpuTimes[4]);
			for (var i = 0; i < cpuTimes.length; i++){
				currentCPUInfo.total += parseInt(cpuTimes[i]);
			}
			currentCPUInfo.active = currentCPUInfo.total - currentCPUInfo.idle
			currentCPUInfo.percentUsed = calculateCPUPercentage(currentCPUInfo);
			
			ok(currentCPUInfo);
		});
	});
};

module.exports = getCPUInfo;
