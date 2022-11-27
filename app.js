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
// L6 = passport google Oauth==============================================Step1
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// L6 = adding require for findOrCreate====================================Step3
const findOrCreate = require('mongoose-findorcreate');


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

// L6 = adding googleId in userScema in mongoosedb=========================Step8
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId:String,
  secret: String
});

//L5 = adding mongoose plugin
userSchema.plugin(passportLocalMongoose);
// L6 = adding findOrCreate plugin for mongoosedb Schema===================Step4
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// L5 = passport local configuration
passport.use(User.createStrategy());
// creating cookie and storing use info for session
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// L6 = updating serialize and desrialize from passport ===================Step7
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

// L6 = Google Strategy ===================================================Step2
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// get methods
app.get("/", function(req, res) {
  res.render("home");
});

// L6 = adding /auth/google get request for google authenticatation========Step5
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);
// L6 = redirecting to secret page after seccessful google registration====Step6
app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets page.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

// L6 = showing all secrets on page and updating page
app.get("/secrets", function(req, res){
  User.find({"secret" : {$ne : null}}, function(err, foundUsers){
    if(err){
      console.log(err);
    }else{
      if(foundUsers){
        res.render("secrets", {userWithSecrets : foundUsers})
      }
    }
  });
});

// L6 = adding /submit app.get route=======================================step9
app.get("/submit", function(req,res){
  if(req.isAuthenticated()){
      res.render("submit");
  }else{
    res.redirect("/login");
  }
});

// L6 = submiting user secret in database with userid on app.post rout====step10
app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;

  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        // submitting found user secret option in userSchema with user submittedSecret
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets")
        });
      }
    }
  });
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
