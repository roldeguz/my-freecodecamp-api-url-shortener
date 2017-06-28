// server.js
// roldeguz
// 23-June-2017
// freecodecamp API projects: url shortener microservice

// init project
var express = require('express');
var app = express();
// dotenv
var dotenv = require('dotenv');
dotenv.config();
// mongo db
var mongo = require("mongodb").MongoClient;
var mongoUrl = process.env.MONGOLAB_URI;
var appUrl = process.env.APP_URL;

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// route when there's a parameter passed for redirect
app.get("/:id", function (request, response) {
  mongo.connect(mongoUrl, function(error, db) {
    if (error) 
      throw error;
    
    var coll = db.collection('url-shortener');
    coll.findOne({"short_url": appUrl + request.params.id}, function(error, result) {
      if (error) 
        throw error;  
            
      if (result) {
        response.redirect(result.original_url);
      } else {  
        result = {"Error": "The URL does not exist."};
        response.send(JSON.stringify(result));
      }
    });
  });  
});

// route when there's a parameter passed for create
app.get("/new/:url*", function (request, response) {
  var url = request.url.slice(5);
  var result = {};
    
  if (validateURL(url)) {
    mongo.connect(mongoUrl, function(error, db) {
      var coll = db.collection('url-shortener');
      coll.find().toArray((err, data) => {
        if (error) 
          throw error;
        
        var urls = data.map((obj) => {
          return obj.short_url;
        });
        
        var newUrlLink;
        do {
          var num = Math.floor(100000 + Math.random() * 900000);
          newUrlLink = appUrl + num.toString().substring(0, 5);
        } while (urls.indexOf(newUrlLink) != -1)
        
        result = {"original_url": url, "short_url": newUrlLink};
        coll.insert(result, function(error, data) {
          response.send(JSON.stringify(result));
          db.close();
        });
      });      
    });
  } else {
    result = {"Error": "Wrong URL format."};
    response.send(JSON.stringify(result));
  }
});

// url validation function
function validateURL(url) {
  // Checks to see if it is an actual url
  // Regex from https://gist.github.com/dperini/729294
  var regex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
  return regex.test(url);
}

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});