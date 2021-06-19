const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/i.html')
});
app.get('/tm', (req, res) => {
  res.sendFile(__dirname + '/views/tm.html')
});
app.get('/rhpm', (req, res) => {
  res.sendFile(__dirname + '/views/rhpm.html')
});
app.get('/usm', (req, res) => {
  res.sendFile(__dirname + '/views/usm.html')
});
app.get('/et', (req, res) => {
  res.sendFile(__dirname + '/views/et.html')
});
app.get('/fmm', (req, res) => {
  res.sendFile(__dirname + '/views/fmm.html')
});

// Timestamp Microservice
app.get("/tm/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/tm/api/", function (req, res) {
  now = new Date();
  res.json({
    unix: now.getTime(),
    utc: now.toUTCString()});
});

app.get("/tm/api/:date_string", function (req, res) {
  console.log(req.params.date_string);
  var dateString = req.params.date_string;
  var date;
  console.log(typeof dateString);
  
  if(!isNaN(dateString)){// check if date's type is number
    date = new Date(parseInt(dateString));
  }
  else{
    date = new Date(dateString);
  }

  if(date == "Invalid Date"){
    res.json({error:"Invalid Date"});  
  }
  else{
    res.json({
      unix: date.getTime(),
      utc: date.toUTCString()});
  }
  
});

// Request Header Parser Microservice
app.get("/rhpm/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/rhpm/api/whoami", function (req, res) {
  res.json({
    "ipaddress": req.ip,
    "language": req.get('Accept-Language'),
    "software": req.get('User-Agent')
  });
});

//URL Shortener Microservice
const dns = require('dns');
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const urls = [];
var i = 0;

app.post('/usm/api/shorturl', function(req, res) {
  var url = req.body.url;
  console.log(url);
  url_check = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
  console.log(url_check);
  dns.lookup(url_check, function (err, address, family) {
    console.log(err);
    console.log('address: %j family: IPv%s', address, family);

    if(err){
      res.json({ error:'invalid url'});
    }
    else{
      i++;
      urls.push({
        original_url:url,
        short_url:i
      });

      res.json({ 
        original_url:url,
        short_url:i
      });
    }
  });
});

app.get('/usm/api/shorturl/:id', function(req, res) {
  var id = req.params.id;
  console.log(urls);
  console.log(id,typeof(id));
  const result = urls.find(url => url.short_url === parseInt(id));
  console.log(result);
  return res.redirect(result.original_url);
});

// Exercise Tracker
const users = [];
const exercises = [];
var i = 0;

const getId = (id) => users.find(user => user._id === id).username;
const getExe = (id) => exercises.filter(e => e._id === id);

app.post('/et/api/users', (req, res) => {
  const n = req.body.username;
  console.log(n);
  i++;
  const newUser = {
    username:n,
    _id:i.toString()
  }
  users.push(newUser);

  res.json(newUser);
});

app.get('/et/api/users', (req, res) => {
  res.json(users);
});

app.post('/et/api/users/:_id/exercises', (req, res) => {
  const uId = req.params._id;
  const desc = req.body.description;
  const dur = req.body.duration;
  const dat = req.body.date;
  console.log(uId, desc, dur, dat);

  const checkDur = dur <=0 ? res.json("duration invalid") : dur >= 60 ? 60 : dur;
  const checkDate = dat === '' ? new Date() : new Date(dat);

  const newExercise = {
    _id:uId,
    username:getId(uId),
    description:desc,
    duration:parseInt(checkDur),
    date:checkDate.toDateString()
  }

  exercises.push(newExercise);

  res.json(newExercise);
});

app.get("/et/api/users/:_id/logs", function (req, res) {
  const uId = req.params._id; 
  const logs = getExe(uId);
  let cleanlogs = logs.map(item => ({description : item["description"], duration : item["duration"], date: item["date"]}));
  console.log(cleanlogs);

  const {from, to, limit} = req.query;
  console.log(from, to, limit);
  let fromD = new Date(from);
  let toD = new Date(to);
  console.log(fromD, toD);

  if(fromD == "Invalid Date"){
    fromD = undefined;
  }

  if(toD == "Invalid Date"){
    toD = undefined;
  }

  if(limit){
    cleanlogs = cleanlogs.slice(0, +limit);
  }

  if(from){
    cleanlogs = cleanlogs.filter(e => new Date(e.date) > fromD);
    fromD.toDateString();
  }

  if(to){
    cleanlogs = cleanlogs.filter(e => new Date(e.date) < toD);
    toD.toDateString();
  }

  res.json({
    _id:uId,
    username:getId(uId),
    from:fromD,
    to:toD,
    count:cleanlogs.length,
    log:cleanlogs
  });
});

// File Metadata Microservice
let multer = require('multer');

app.post('/fmm/api/fileanalyse', multer().single('upfile'), function (req, res) {
  console.log(req.file);
  res.json({
    name:req.file.originalname,
    type:req.file.mimetype,
    size:req.file.size
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
  console.log('http://localhost:' + listener.address().port)
})
