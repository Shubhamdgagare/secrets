//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// L5 = adding require package
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// L5 = setting session
app.use(session({
  // here using .env file SECRET key
  secret : process.env.SECRET,
  resave : false,
  saveUninitialized : true
}));

// L5 = initializing passport and using session
app.use(passport.initialize());
app.use(passport.session());

// Setting database connection
mongoose.connect("mongodb://127.0.0.1:27017/userDB", {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

//L5 = adding mongoose plugin
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

// L5 = passport local configuration
passport.use(User.createStrategy());
// creating cookie and storing use info for session
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// get methods
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

// L5 = adding /secret app.get page
app.get("/secrets", function(req, res){
  if(req.isAuthenticated()){
      res.render("secrets");
  }else{
    res.redirect("/login");
  }
});

// L5 = logout route setting
app.get("/logout", function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// post request

app.post("/register", function(req, res) {
  // L5 = setting register port
  User.register({username : req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req, res) {

  const user = new User ({
    username : req.body.username,
    password : req.body.password
  });

  // L5 = setting login passport
  req.login(user, function(err){
    if(err){
      console.log(err);
      res.redirect("/login");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  })
});

app.listen(3000, function() {
  console.log("Server is live on port 3000");
});
