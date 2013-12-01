/**
 * A nodejs module to  query, start and stop windows services
 * @author Tony BenBrahim <tony.benbrahim at gmail.com>
 */

if (require('os').platform().indexOf('win32') === -1) {
	throw "windows-service-manager is for Microsoft Windows only.";
}

var exec = require('child_process').exec;

var getValue = function(line) {
	var i = line.indexOf(':');
	return i === -1 ? null : line.substr(i + 1).trim();
};

var splitValue = function(line) {
	var i = line.indexOf(' ');
	return i === -1 ? [ null, null ] : [ line.substr(0, i).trim(), line.substr(i + 1).trim() ];
};

var Enumerator = function(items) {
	this.items = items;
	this.index = 0;
};

Enumerator.prototype.hasNext = function() {
	return this.index < this.items.length;
};

Enumerator.prototype.next = function() {
	var result = this.items[this.index];
	this.index += 1;
	return result;
};

var parseNextEntry = function(linesEnum) {
	var entry;
	while (linesEnum.hasNext()) {
		var line = linesEnum.next();
		if (line.indexOf('SERVICE_NAME') === 0) {
			entry = {
				"name" : getValue(line)
			};
		} else if (line.indexOf('DISPLAY_NAME') === 0) {
			entry.displayName = getValue(line);
		} else if (line.indexOf('        STATE') === 0) {
			var states = splitValue(getValue(line));
			entry.state = parseInt(states[0], 10);
			entry.stateDescription = states[1];
		} else if (line.indexOf('        PID') === 0) {
			entry.pid = parseInt(getValue(line), 10);
			break;
		}
	}
	return entry;
};


exports.queryServices = function(callback) {
	exec('sc queryex', function(error, stdout, stderr) {
		if (error) {
			callback(error, null);
		} else {
			var linesEnum = new Enumerator(stdout.split("\n"));
			var entries = [];
			while (linesEnum.hasNext()) {
				var entry = parseNextEntry(linesEnum);
				if (entry) {
					entries.push(entry);
				}
			}
			callback(null, entries);
		}
	});
};

exports.queryService = function(name, callback) {
	exec('sc queryex "' + name + '"', function(error, stdout, stderr) {
		if (error) {
			callback(error, null);
		} else {
			var linesEnum = new Enumerator(stdout.split("\n"));
			var entry = parseNextEntry(linesEnum);
			callback(null, entry);
		}
	});
};

exports.waitForState = function(service, state, timeoutSeconds, callback) {
	var repeatId = setInterval(function() {
		exports.queryService(service.name, function(error, service) {
			if (error) {
				clearTimeout(timeoutId);
				clearInterval(repeatId);
				callback(error, null);
			} else if (service.state === state) {
				clearTimeout(timeoutId);
				clearInterval(repeatId);
				callback(null, service);
			}
		});
	}, 200);
	var timeoutId = setTimeout(function() {
		callback('timeout', service);
	}, timeoutSeconds * 1000);
};

var switchToState = function(name, state, timeoutSeconds, callback) {
	exports.queryService(name, function(error, service) {
		if (error) {
			callback(error, null);
		} else if (service.state === state) {
			callback(null, service);
		} else {
			exec('sc ' + (state === 1 ? 'stop' : 'start') + ' "' + name + '"', function(error, stdout, stderr) {
				if (error) {
					callback(error, null);
				} else if (timeoutSeconds !== 0) {
					exports.waitForState(service, state, timeoutSeconds, callback);
				}
			});
		}
	});
};

exports.stopService = function(name, timeoutSeconds, kill, callback) {
	switchToState(name, 1, timeoutSeconds, !kill ? callback : function(error, service) {
		if (error === 'timeout') {
			exec('taskkill /F /PID ' + service.pid, function(error, stdout, stderr) {
				if (error) {
					callback(error, null);
				} else {
					exports.queryService(service.name, function(error, service) {
						callback(error || service.status !== 1 ? "Unable to kill" : null, service);
					});
				}
			});
		} else {
			callback(error, service);
		}
	});
};

exports.startService = function(name, timeoutSeconds, callback) {
	switchToState(name, 4, timeoutSeconds, callback);
};
