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
 var stream;


var tweetCount = 0;

io.on('connection', function (socket) {
  socket.on('startStreaming', function (data) {   
        socket.emit('statusMsg', {message: "Rocket will launch after " + data.launchAt + " tweets", type: "info" });
        socket.emit('statusMsg', {message: "Starting tweet tracking for '" + data.track + "'", type: "info" });
                 
    //Reset Tweet Count
    tweetCount = 0;
    
    //Start Twitter Stream
    stream = T.stream('statuses/filter', { track: data.track });
    
    stream.on('tweet', function (tweet) {
      tweetCount++;
      socket.emit('tweet', {tweetId: tweet.id_str, tweetCount: tweetCount, launchAt: data.launchAt});
            
      if (tweetCount >= data.launchAt){
        socket.emit('statusMsg', {message: "Tweet threshold met", type: "info" });
        stream.stop();
        socket.emit('statusMsg', {message: "Preparing to launch rocket", type: "info" });
        launchRocket(socket);
      }
    });
    
    stream.on('limit', function (message) {
      socket.emit('statusMsg', {message: "Twitter Stream limited: " + message, type: "error" });
    });
    stream.on('disconnect', function (message) {
      socket.emit('statusMsg', {message: "Twitter Stream disconnected: " + message, type: "error" });
    });
    stream.on('warning', function (message) {
      socket.emit('statusMsg', {message: "Twitter Stream warning: " + message, type: "error" });
    });
    stream.on('disconnect', function (message) {
      socket.emit('statusMsg', {message: "Twitter Stream disconnected: " + message, type: "error" });
    });
  });
  
  socket.on('stopStreaming', function (data) {
    socket.emit('statusMsg', {message: "Aborting Twitter Stream", type: "info" });
    stream.stop();
    socket.emit('statusMsg', {message: "Twitter Stream Aborted", type: "info" });
  }); 
  
   socket.on('systemtest', function (data) {
    socket.emit('statusMsg', {message: "Socket.io connection successful", type: "info" });
    socket.emit('statusMsg', {message: "Testing twitter connection ...", type: "info" });
    T.get('account/verify_credentials', { }, function(err, data, response) {
      socket.emit('statusMsg', {message: "Twitter authenticated as @" + data.screen_name, type: "info" });
    });
    socket.emit('statusMsg', {message: "Testing rocket connection ...", type: "info" });
    isRocketOnline(socket);
  }); 
});

function launchRocket(socket) {
   
   if (config.particle.enabled) 
   {
    socket.emit('statusMsg', {message: "Connecting to rocket ... ", type: "info" });
    request.post(
        {
            url: 'https://api.particle.io/v1/devices/'+ config.particle.device_id +'/cycleRelay?access_token='+ config.particle.access_token
            , form: { args: 'r1,5000' }
        } , function (err, httpResponse, body) {
            if (httpResponse.statusCode === 200) {
               socket.emit('statusMsg', {message: "Rocket Launched", type: "success" });
            } else {
                socket.emit('statusMsg', {message: "Error communicating with rocket", type: "error" });
            }
        });
   }
}

function isRocketOnline(socket) {
   
   if (config.particle.enabled) 
   {
    request.get(
        {
            url: 'https://api.particle.io/v1/devices/'+ config.particle.device_id +'/isConnected?access_token='+ config.particle.access_token
        } , function (err, httpResponse, body) {
            if (httpResponse.statusCode === 200) {
               socket.emit('statusMsg', {message: "Connection to rocket successful", type: "success" });
            } else {
                socket.emit('statusMsg', {message: "Failure to connect to rocket", type: "error" });
            }
        });
   }
}



 





