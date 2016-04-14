var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var SessionStore = require('express-mysql-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var privateRoutes=require('./routes/private');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(session());

app.use(express.static(path.join(__dirname, 'public')));

var options = {
  host: 'localhost',
  port: 3306,
  user: 'art',
  password: '96830217',
  database: 'test'
};

var connection = mysql.createConnection(options);
var sessionStore = new SessionStore({}/* session store options */, connection);

app.use(session({
  key: 'some_key',
  secret: 'some_secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 3600000}
}));

app.use('/', routes);
//app.use('/users', users);
app.use('/private', privateRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


app.listen(3000, function () {
  console.log('App listening on port 3000!');
});





module.exports = app;
