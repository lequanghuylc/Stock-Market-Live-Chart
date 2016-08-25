var express = require("express");
var http = require("http");
var app = express();
var server = http.createServer(app).listen(8080);
var io = require("socket.io")(server);
var request = require('request');

app.use(express.static(__dirname + '/views'));
app.get("/getstock/:symbols", function(req,res){
    var today = new Date();
	var year = today.getFullYear();
	var month = today.getMonth() +1 ;
	var yesterday = today.getDate() -1;
	var stringToday = year + '-' + month + '-' + yesterday;
	var stringTodayLastYear = (year-1) + '-' + month + '-' + yesterday;
	request('https://www.quandl.com/api/v3/datasets/WIKI/'+req.params.symbols.toUpperCase()+'.json?api_key=tPFVCm-gpx2HuDusM82E&start_date='+stringTodayLastYear+'&end_date='+stringToday,    function (error, response, body) {
		if (!error && response.statusCode == 200) {
    		var data = JSON.parse(body);
    		var newData = data.dataset.data.map(function(val, index){
                var date = new Date(val[0]);
                return [date.getTime(), val[1]];
            });
            res.send(newData);
		}
		if(response.statusCode == 404){
		    res.send("not found");
		}    
    });
});


app.get("/checksymbol/:symbols", function(req,res){
    request('https://www.quandl.com/api/v3/datasets/WIKI/'+req.params.symbols.toUpperCase()+'.json?api_key=tPFVCm-gpx2HuDusM82E&start_date=2016-08-24&end_date=2016-08-24', function(error, response, body){
        if(response.statusCode == 404){
		    res.end("not found");
		} else {
		    res.send({
		        name: JSON.parse(body).dataset.name,
		        symbol: JSON.parse(body).dataset.dataset_code
		    });
		}
    });
});


io.on("connection", function(socket) {

    socket.on("chat", function(message) {
    	socket.broadcast.emit("message", message);
    });

});

console.log("Starting Socket App - https://stockmarketchart-quanghuyf.c9users.io:8080");
