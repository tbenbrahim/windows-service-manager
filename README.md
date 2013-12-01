## Windows Service Manager
A node module to query, start and stop Windows services. Uses the `sc` and `taskkill` programs which is present 
on every version of Windows since Windows XP.

## Usage

### Service objects
The functions return service objects containing the following fields:

* `name`: the service name
* `description`: the optional service description, may not be present
* `state`: an integer state code with the following possible values
	* 1: STOPPED
	* 2: STOP PENDING
	* 3: START PENDING
	* 4: STARTED
	* 5: CONTINUE PENDING
	* 6: PAUSE PENDING
	* 7: PAUSED
* `stateDescription`: the textual description of the state as shown above
* `pid`: the process identifier for the service, if it is running

### Query all services
`queryServices` asynchronously returns an array of service objects, for all services installed on the system.

**Parameters:**

* `callback`: a callback function  `function(error, service)`:
	* `error`: error that occured or null if no error
	* `service`: an array of service objects for all installed services.

**Example:**

    var serviceManager = require('./windows-service-manager');
    
    serviceManager.queryServices(function(error, services) {
        console.log(error || services);
    });

### Query a single service
`queryService` asynchronously returns an service object for the service with the specified name.

**Parameters:**

* `name`: the name of the service to query.
* `callback`: a callback function  `function(error, service)`:
	* `error`: error that occured or null if no error
	* `service`: a service object for the service named `name`.

**Example:**

    var serviceManager = require('./windows-service-manager');
    
    serviceManager.queryService('puppet' ,function(error, services) {
        console.log(error || services);
    });

### Start a service
`startService` asynchronously starts a service with the specified `name`. If the service is already started, no error is returned. 

**Parameters:**

* `name`: the name of the service to start.
* `timeoutSeconds`: number of seconds to poll before returning. If 0, no polling is done. If a non-zero value, service status is 
polled. If the service has not started before the timeout expires, the callback error will be the string 'timeout'.
* `callback`: a callback function  `function(error, service)`:
	* `error`: error that occured or null if no error
	* `service`: a service object for the service named `name`.

**Example:**

    var serviceManager = require('./windows-service-manager');
    
    serviceManager.startService('puppet', 5, function(error, services) {
        console.log(error || services);
    });

### Stop a service
`stopService` asynchronously stops a service with the specified `name`. If the service is already stopped, no error is returned. 

**Parameters:**

* `name`: the name of the service to stop.
* `timeoutSeconds`: number of seconds to poll before returning. If 0, no polling is done. If a non-zero value, service status is 
polled. If the service has not stopped before the timeout expires, the callback error will be the string 'timeout'.
* `forceKill`: boolean that specifies whether the service process should be killed if the service has not stopped within a non zero timeout interval.
* `callback`: a callback function  `function(error, service)`:
	* `error`: error that occured or null if no error
	* `service`: a service object for the service named `name`.

**Example:**

    var serviceManager = require('./windows-service-manager');
    
    serviceManager.stopService('puppet', 20, true, function(error, services) {
        console.log(error || services);
    });

