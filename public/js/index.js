var currentServer = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;

var socket = io(currentServer);
var twtReady = false;
var rocketFuelGauge;

$(function() {
	createGauge(0,1);
});



twttr.ready(function () {
	twtReady = true;
});

$( "#btnTest" ).click(function() {
	$("#consolelog").empty();
	$("#consolelog").append("<div>Twitter widget loaded</div>");
	socket.emit('systemtest', { });
});

$( "#btnStart" ).click(function() {
	var launchAt = $("#txtLaunchAt").val();
	var track = $("#txtHashtags").val();
	toggleClasses();
	$("#consolelog").empty();
	$("#rocketFuelGaugeContainer").empty();
	$("#tweets").empty();
	createGauge(0,launchAt);
	socket.emit('startStreaming', { launchAt: launchAt, track: track });
});

$( "#btnStop" ).click(function() {
	toggleClasses();
	socket.emit('stopStreaming', { });
});

socket.on('tweet', function(data){
	if (twtReady) {
		var element = document.createElement("div");
		twttr.widgets.createTweet(data.tweetId, element);
		$('#tweets').prepend(element);
		rocketFuelGauge.redraw(data.tweetCount);
	}

});

socket.on('statusMsg', function(data){
	$("#consolelog").append("<div>" + data.message + "</div>");
});

function toggleClasses() {
	$( "#btnStart" ).toggleClass("hidden");
	$( "#btnStop" ).toggleClass("hidden");
}

function createGauge(min, max)
{
	var config =
	{
		size: 225,
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
