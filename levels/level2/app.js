//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// Level 2 security
const encrypt = require("mongoose-encryption");

// essential  setting
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended : true
}));

// Setting database
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser : true});

// L2
const userSchema = new mongoose.Schema({
  email : String,
  password : String
});

// L2
// secret variable going into .env file
// const secret = "Thisisourlittlesecret.";
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User",userSchema);

// get methods
app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

// post request

app.post("/register", function(req, res){
  //const email =  req.body.username;
  //const  password = req.body.password

  const newUser = new User({
    email : req.body.username,
    password : req.body.password
  });
  // L1
  newUser.save(function(err){
    if(!err){
      res.render("secrets");
    }else{
      console.log(err);
    }
  });
});

app.post("/login",  function(req,res){
  const username = req.body.username;
  const  password= req.body.password;
  // l1
  User.findOne({email :username},  function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        if(foundUser.password === password){
          res.render("secrets");
        }
      }
    }
  });
});

app.listen(3000, function(){
  console.log("Server is live on port 3000");
});
