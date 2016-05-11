var static = require('node-static');

var clientCacheHours = 24;
var file = new static.Server('./public', { 
	cache: clientCacheHours * 60 * 60,
	gzip: true
});
 
require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(80);
