var serviceManager = require('./windows-service-manager');

/*
 * serviceManager.queryServices(function(err, services) { console.log(err ||
 * services); });
 * 
 * serviceManager.queryService('puppet', function(err, service) {
 * console.log(err || service); });
 */

serviceManager.stopService('puppet', 2, false, function(err, service) {
	console.log(err || service);
	serviceManager.startService('puppet', 2, function(err, service) {
		console.log(err || service);
	});
});
