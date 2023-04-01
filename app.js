//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
//const bcrypt = require("bcrypt");
//const saltRounds = 10;
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");

const app = express();

//console.log(process.env.API_KEY);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: "stanBTS.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// set up MongoDB
mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// User Schema model
const User = mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res) {
  res.render("home");
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));
// app.get("/auth/google", function(req, res){
//   passport.authenticate("google", {scope: ['profile']});
// });

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", function(req, res) {

  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });

  // // if user is logged in
  // if (req.isAuthenticated()) {
  //   res.render("secrets");
  // } else {
  //   res.redirect("/login");
  // }
});

app.get("/submit", function(req, res) {

  // if user is logged in
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;

  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });

});

app.get("/logout", function(req, res){
  req.logout(function(err){
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });

});

app.post("/register", (req, res) => {

  //console.log(req.body.username);
  //console.log(req.body.password);

  User.register({username: req.body.username }, req.body.password, function(err, user){

    if(!err) {

      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });

    } else {
      console.log(err);
      res.redirect("/register");
    }
  })

});


//////////////bcrypt////////////////////
// // create user after creating hash
// bcrypt.hash(req.body.password, saltRounds, function(err, hash){
//   const newUser = new User({
//     email: req.body.username,
//     password: hash
//     //password: md5(req.body.password)
//   });
//
//   newUser.save(function(err){
//     if(err) {
//       console.log(err);
//     } else {
//       res.render("secrets");
//     }
//   });
// });


app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

  //////////////bcrypt////////////////////
  // const username = req.body.username;
  // const password = req.body.password;
  // //const password = md5(req.body.password);
  //
  // User.findOne({email: username}, function(err, foundUser){
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     if (foundUser) {
  //
  //       bcrypt.compare(password, foundUser.password, function(err, results){
  //         if (results === true) {
  //           res.render("secrets");
  //         }
  //       });
  //       //if (foundUser.password === password) {
  //         //res.render("secrets");
  //       }
  //     }
  //   //}
  // });
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
