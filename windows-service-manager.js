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
	return i === -1 ? [ null, null ] : [ line.substr(0, i).trim(),
			line.substr(i + 1).trim() ];
};

var LineStream = function(input) {
	var lines = input;
	var index = 0;

	this.hasNext = function() {
		return index < lines.length;
	};

	this.next = function() {
		return lines[index++];
	};
};

var parseNextEntry = function(lineStream) {
	var entry;
	while (lineStream.hasNext()) {
		var line = lineStream.next();
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
	var child = exec('sc queryex', function(error, stdout, stderr) {
		if (error) {
			callback(error, null);
		} else {
			var lineStream = new LineStream(stdout.split("\n"));
			var entries = [];
			while (lineStream.hasNext()) {
				var entry = parseNextEntry(lineStream);
				if (entry) {
					entries.push(entry);
				}
			}
			callback(null, entries);
		}
	});
};

exports.queryService = function(name, callback) {
	var child = exec('sc queryex "' + name + '"', function(error, stdout,
			stderr) {
		if (error) {
			callback(error, null);
		} else {
			var lineStream = new LineStream(stdout.split("\n"));
			var entry = parseNextEntry(lineStream);
			callback(null, entry);
		}
	});
};

exports.waitForState = function(service, state, timeoutSeconds, callback) {
	var repeatId = setInterval(function() {
		exports.queryService(name, function(error, service) {
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
			var child = exec('sc ' + (state === 1 ? 'stop' : 'start') + ' "'
					+ name + '"',
					function(error, stdout, stderr) {
						if (error) {
							callback(error, null);
						} else if (timeoutSeconds !== 0) {
							exports.waitForState(service, state, timeoutSeconds,
									callback);
						}
					});
		}
	});
};

exports.stopService = function(name, timeoutSeconds, kill, callback) {
	switchToState(name, 1, timeoutSeconds, !kill ? callback : function(error,
			service) {
		if (error === 'timeout') {

		} else {
			callback(error, service);
		}
	});
};

exports.startService = function(name, timeoutSeconds, callback) {
	switchToState(name, 4, timeoutSeconds, callback);
};
