// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var Twit = require('twit');
var io = require('socket.io')(server);
var request = require('request');
var config = require('./config');
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

//Twitter
var T = new Twit(config.twitter);



var tweetCount = 0;

io.on('connection', function (socket) {
  var stream;
  socket.on('startStreaming', function (data) {
    socket.emit('statusMsg', {message: "Track: " + data.track + " Launch at: " + data.launchAt, type: "info" });
    
    //Reset Tweet Count
    tweetCount = 0;
    
    //Start Twitter Stream
    stream = T.stream('statuses/filter', { track: data.track });
    
    stream.on('tweet', function (tweet) {
      tweetCount++;
      socket.emit('tweet', {tweetId: tweet.id_str, tweetCount: tweetCount, launchAt: data.launchAt});
            
      if (tweetCount >= data.launchAt){
        stream.stop();
        socket.emit('statusMsg',  {message: "BLAST OFF!!!", type: "success" });
        launchRocket(socket);
      }
    });
    
    stream.on('limit', function (message) {
      socket.emit('statusMsg', {message: "Stream limited: " + message, type: "error" });
    });
    stream.on('disconnect', function (message) {
      socket.emit('statusMsg', {message: "Stream disconnected: " + message, type: "error" });
    });
    stream.on('warning', function (message) {
      socket.emit('statusMsg', {message: "Stream warning: " + message, type: "v" });
    });
    stream.on('disconnect', function (message) {
      socket.emit('statusMsg', {message: "Stream disconnected: " + message, type: "error" });
    });
  });
  
  socket.on('stopStreaming', function (data) {
    socket.emit('statusMsg', {message: "Stopping Stream", type: "info" });
    stream.stop();
    socket.emit('statusMsg', {message: "Stream Stopped", type: "info" });
  }); 
});

function launchRocket(socket) {
   
   if (config.particle.enabled) 
   {
    request.post(
        {
            url: 'https://api.particle.io/v1/devices/'+ config.particle.device_id +'/cycleRelay?access_token='+ config.particle.access_token
            , form: { args: 'r1,500' }
        } , function (err, httpResponse, body) {
            if (httpResponse.statusCode === 200) {
               socket.emit('statusMsg', {message: "Rocket Launched", type: "success" });
            } else {
                socket.emit('statusMsg', {message: "Rocket Error", type: "error" });
            }
        });
   }
}


 





