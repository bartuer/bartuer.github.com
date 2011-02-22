var http = require('http');

var sent_body = '';
var server = http.createServer(function (req, res) {
                                 req.setEncoding('utf8');
                                 req.addListener('data', function(chunk) {
                                                   var uploaded = JSON.parse(chunk);
                                                   console.log(uploaded.months.length);
                                                   sent_body += chunk;
                                                 });
                                 req.addListener('end', function() {
                                                   res.writeHead(200, {'Content-Type': 'text/plain'});
                                                   res.write('your upload:' + sent_body + '\n');
                                                   res.end();
                                                 });

                               }).listen(8124, "127.0.0.1");

console.log('Server at 8124');