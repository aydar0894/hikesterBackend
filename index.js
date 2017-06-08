

var firebase = require("firebase");
var config = {
    apiKey: "AIzaSyBEyXqD8a6x9ltIzhEADgn0AjUvjvcDU54",
    authDomain: "hikester-81bcd.firebaseapp.com",
    databaseURL: "https://hikester-81bcd.firebaseio.com",
    storageBucket: "bucket.appspot.com"
  };
firebase.initializeApp(config);

var database = firebase.database().ref();

var pgp = require('pg-promise')();
var express = require('express');
var app = express();

var db = pgp("postgres://lis:qbasik007@localhost:5432/Hikester");

//------------Test-----------

// var listnerParam = database.child('AnalisysQueue');
// listnerParam.on('child_added', function(snap){
//   db.one("insert into testfacebook(data) values('"+ snap.val() +"')");
// });

//--------------------------


//-------listners--------------

// --newEvent--
var events = database.child("Events");
events.on('child_added', function(snap){
  var queryParams = snap.val();
  var tags = queryParams.tags;

  tags.forEach(function(tag){
    db.one("insert into event_tags values('"+ queryParams.event_id + "', '" + tag.name + "')");
  });
  db.one("insert into events(creator_id, event_name, start_date, finish_date, event_description, lattitude, longitude, people_count, start_time, fb_id) values('"+ queryParams.creator_id +"', " 
    + "'"+ queryParams.name +"', " + "'"+ queryParams.date + "', " + "'"+ queryParams.date + "', " 
    + "'"+ queryParams.description + "', " 
    + "'"+ queryParams.lattitude + "', "  
    + "'"+ queryParams.longitude + "', " 
    + "'"+ queryParams.people_count + "', "
    + "'"+ queryParams.time + "', "
    + "'"+ queryParams.event_id +"')");
});
//-------------

//-------eventSearch--------
var search = database.child("search");
var tagTitles = {}
search.on('child_added', function(snap){
  var key = snap.key;
  console.log(key);
  tagTitles = snap.val();
  

 db.any("select distinct fb_id from events join"
          + "(select distinct event_fb_id as fb from event_tags where tag_name='"+ tagTitles[0] +"' or tag_name='"+ tagTitles[1] +"') e1 on fb_id=fb")
 .then(function(data){
  console.log(data);
  var push = search.child(key);
  push.set(data);

  });
});

//--------------------------


//---------------------------

//----------------------routes---------
app.get('/', function (req, res) {
 db.any("select * from users")
 .then(function(data){
 	res.send(
  	data
  );
 })
  
});

app.get('/addUser', function (req, res) {
	var name = req.query.user;
	var pass = req.query.pass;
	console.log(name);
    db.one("insert into users(login, password) values("+"'"+name+"'"+","+"'"+pass+"'" +');');
    res.send("Done!");
});

app.get('/search', function (req, res){
	var location = req.query.location;
	var tags = req.query.tag;
	var tempTable = req.query.tempTable;	
    db.any("select description, name from events where location=" + "'" + location + "'")
    .then(function(data){
    	findAndReturn(data, tempTable);	
    });
    
    res.send("Done!");
});

app.get('/addEvent', function (req, res) {
	var name = req.query.name;
	var id = req.query.id;
	var location = req.query.location;
	var description = req.query.descr;	
    db.one("insert into events(id, name, description, location) values("+"'"+id+"',"+"'"+name+"'"+","+"'"+description+"',"+"'"+location+"'" +');');
    newEvent(id,name,description);
    res.send("Done!");
});


app.get('/testNotif', function (req,res){
  var type = req.query.type;
  result = notify(type);
  res.send("Done!");
});

//-------------------

app.listen(3002, function () {
  console.log('Example app listening on port 3002!');
}) 
  

function findAndReturn(queryResult, tempTable){

var tempRef = firebase.database().ref(tempTable + "/");
console.log(queryResult);
tempRef.update(queryResult)

}

function newEvent(id, uName, descr) {
 
  var x = "'"+id+"'";
  var eventData = {
  	x: {
  		name: uName,
    	description: descr
      }     
  };  

 var eventRef = firebase.database().ref("Events/");

 eventRef.update(
 eventData
 );

} 
function notify(type){
  var query = ""
  db.any("select uid from userprefs where " + type + " > 40")
  .then(function(data){
   console.log(data);

   var notifsRef = firebase.database().ref("TestNotifs/");

   notifsRef.push(
   data
   );
   return
  });
  
  
 }