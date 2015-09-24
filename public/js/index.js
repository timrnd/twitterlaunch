var socket = io('http://localhost:3000');
var twtReady = false;
var rocketFuelGauge;

twttr.ready(function () {
	twtReady = true;
	$("#msg").text("Twitter Ready");
});

$( "#btnStart" ).click(function() {
	var launchAt = $("#txtLaunchAt").val();
	var track = $("#txtHashtags").val();
	createGauge(0,launchAt);
	
	socket.emit('startStreaming', { launchAt: launchAt, track: track });
});

$( "#btnStop" ).click(function() {
	socket.emit('stopStreaming', { });
});
		
socket.on('tweet', function(data){
	if (twtReady) {
		$("#msg").text(data.tweetCount + " / " + data.launchAt);
		var element = document.createElement("li");
		twttr.widgets.createTweet(data.tweetId, element);
		$('#tweets').prepend(element);
		rocketFuelGauge.redraw(data.tweetCount);
	}
	
});

socket.on('statusMsg', function(data){
	$("#msg").text(data.message);
});

function createGauge(min, max)
{
	var config = 
	{
		size: 300,
		label: "Rocket Fuel",
		min: min,
		max: max,
		minorTicks: 5
	}
	
	var range = config.max - config.min;
	config.yellowZones = [{ from: config.min + range*0.75, to: config.min + range*0.9 }];
	config.redZones = [{ from: config.min + range*0.9, to: config.max }];
	
	rocketFuelGauge = new Gauge("rocketFuelGaugeContainer", config);
	rocketFuelGauge.render();
}
