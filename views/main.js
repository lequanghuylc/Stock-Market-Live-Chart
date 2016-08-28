$(function () {
	var today = new Date();
	var year = today.getFullYear();
	var month = today.getMonth() +1 ;
	var yesterday = today.getDate() -1;
	var stringToday = year + '-' + month + '-' + yesterday;
	var stringTodayLastYear = (year-1) + '-' + month + '-' + yesterday;
    var names = ['FB', 'GOOG', 'MSFT', 'AAPL'];
    
    //web socket
    var socket = io("https://stocklive-fcc.herokuapp.com/:8080");
    
    socket.on("disconnect", function() {
    	console.log("Disconnected");
    });
    
    socket.on("connect", function() {
    	console.log("Connected to StockMarket Chart");
    });
    
    socket.on("message", function(message) {
    	var input = message.indexOf("remove") === -1 ? message : message.substring(7);
    	var compareArr = JSON.parse($("#compare").text());
    	if(message.indexOf("remove") === -1){
    	    if(compareArr.indexOf(input) > -1){
                console.log("Already in the chart, don't need to add");
            } else {
                $("#loading").toggle();
                compareArr.push(input);
                generateChart(compareArr, function(){
                    $("#loading").toggle();
                });
            }
    	} else {
    	    if(compareArr.indexOf(input) === -1){
                console.log("Already remove");
            } else {
                $("#loading").toggle();
                compareArr = compareArr.slice(0,compareArr.indexOf(input)).concat(compareArr.slice(compareArr.indexOf(input)+1, compareArr.length));
                generateChart(compareArr, function(){
                    $("#loading").toggle();
                });
            }
    	}
    	
    	
    });
    
    
    
    /**
     * Create the chart when all data is loaded
     * @returns {undefined}
     */
    function createChart(array) {

        $('#firstrow').highcharts('StockChart', {
            chart: {
            backgroundColor:'rgba(255, 255, 255, 0.1)'
        },
            rangeSelector: {
                selected: 5
            },
			rangeSelector : {
				enabled: false
			},
			navigator: {
				enabled: false
			},
            yAxis: {
                labels: {
                    formatter: function () {
                        return (this.value > 0 ? ' + ' : '') + this.value + '%';
                    }
                },
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: 'silver'
                }]
            },

            plotOptions: {
                series: {
                    compare: 'percent'
                }
            },

            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
                valueDecimals: 2
            },

            series: array
        });
    }
    
    
    function getCompanyName(symbolArr){
        $("#companyname").empty();
        symbolArr.forEach(function(val, index){
           $.get("/checksymbol/"+val, function(data){
              $("#companyname").append("<h3><button class='btn btn-danger' data-symbol='"+data.symbol.toUpperCase()+"'>X</button> "+data.name+"</h3>"); 
           }); 
        });
        $("#companyname").append("<h3 id='compare' style='display:none;'>"+JSON.stringify(symbolArr)+"</h3>");
    }
    function generateChart(array, callback){
        var seriesOptions = [],  seriesCounter = 0;
        $.each(array, function (i, name) {
    
            $.getJSON('/getstock/'+name,    function (data) {
                seriesOptions[i] = {
                    name: name,
                    data: data
                };
                
                seriesCounter += 1;
                if (seriesCounter === array.length) {
                    createChart(seriesOptions);
                    getCompanyName(array);
                    $("#guide").text("Enter a valid symbol of company to show stocks in the chart");
                    callback();
                }
            });
        });
    }
    generateChart(['FB', 'GOOG', 'MSFT', 'AAPL'], function(){
        // initial run when open the page
    });
    
    $(".container").on("click", ".btn-danger", function(){
        $("#loading").toggle();
        var symbol = $(this).data("symbol");
        socket.emit("chat", "remove " +symbol);
        var compareArr = JSON.parse($("#compare").text());
        compareArr = compareArr.slice(0,compareArr.indexOf(symbol)).concat(compareArr.slice(compareArr.indexOf(symbol)+1, compareArr.length));
        generateChart(compareArr, function(){
            $("#loading").toggle();
        });
    });
    
    $("form").submit(function(){
        var input = $("input").val();
        var compareArr = JSON.parse($("#compare").text());
        if(compareArr.indexOf(input) > -1){
            alert("Already in the chart, don't need to add");
        } else {
            $.get("/checksymbol/"+input, function(data){
                if(typeof data === "string"){
                    alert("Symbol's not valid. Input another");
                } else {
                    socket.emit("chat", input);
                    $("#loading").toggle();
                    compareArr.push(input);
                    generateChart(compareArr, function(){
                        $("#loading").toggle();
                    });
                }
            });
        }
        $("input").val("");
    });
});