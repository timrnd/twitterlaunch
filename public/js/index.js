var socket = io('http://localhost:3000');
var twtReady = false;
var rocketFuelGauge;

twttr.ready(function () {
	twtReady = true;
	showStatus("Twitter Ready");
});

function showStatus(message) {
	$("#msg").text(message).fadeIn('slow');
}

$( "#btnStart" ).click(function() {
	var launchAt = $("#txtLaunchAt").val();
	var track = $("#txtHashtags").val();
	$(".twitter-form").fadeOut(function() {
		createGauge(0,launchAt);
		socket.emit('startStreaming', { launchAt: launchAt, track: track });
	});
});

$( "#btnStop" ).click(function() {
	socket.emit('stopStreaming', { });
});

socket.on('tweet', function(data){
	if (twtReady) {
		showStatus(data.tweetCount + " / " + data.launchAt);
		var element = document.createElement("div");
		twttr.widgets.createTweet(data.tweetId, element);
		$('#tweets').prepend(element);
		rocketFuelGauge.redraw(data.tweetCount);
	}

});

socket.on('statusMsg', function(data){
	if(data.message == "BLAST OFF!!!") {
		setTimeout(function() {
			var gif = $("<img>");
			gif.attr("src", "http://i.giphy.com/3oEduIUO0ANsI76XbG.gif")
			gif.addClass('blast-off');
			$("body").append(gif);
			setTimeout(function(){
				$(".blast-off").remove();
			}, 8000);
		}, 1500);
	}
	showStatus(data.message);
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
