//jshint esversion:6
main().catch(err => console.log(err))
async function main() {
    require('dotenv').config()
    const express = require("express");
    const bodyParser = require("body-parser");
    const ejs = require("ejs")
    const _ = require("lodash");
    //const md5 = require("md5"); HASH technique
    //const encrypt = require("mongoose-encryption");
    // const bcrypt = require('bcrypt');
    // const saltRounds = 5;
    // session
    const session = require('express-session')
    const passport = require('passport')
    const passportLocalMongoose = require("passport-local-mongoose")
    const GoogleStrategy = require('passport-google-oauth20').Strategy;
    const findOrCreate = require("mongoose-findorcreate");
    


    const app = express();
    console.log(process.env.API_KEY)
    app.set("view engine","ejs");
    app.use(bodyParser.urlencoded({ extended: true}));
    app.use(express.static("public"));
    const mongoose = require("mongoose");
    app.use(session({
        secret: "Our Little Secret",
        resave: false,
        saveUninitialized: false
    }))
    app.use(passport.initialize());
    app.use(passport.session());

    await mongoose.connect('mongodb://127.0.0.1:27017/userDB');
    const userScheme = new mongoose.Schema ({
        email: String,
        password: String,
        googleId: String,
        secret: String
    });
    userScheme.plugin(passportLocalMongoose);
    userScheme.plugin(findOrCreate);
    // mongoose-encryption
    // userScheme.plugin(encrypt, { secret: process.env.SECRET,  encryptedFields: ['password']});

    const User = mongoose.model("User", userScheme);
    // CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
    passport.use(User.createStrategy());

    //local const passportLocalMongoose = require("passport-local-mongoose")
    // passport.serializeUser(User.serializeUser());
    // passport.deserializeUser(User.deserializeUser());

    //generalized serialization

    passport.serializeUser(function(user, cb) {
        process.nextTick(function() {
          return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
          });
        });
      });
      
      passport.deserializeUser(function(user, cb) {
        process.nextTick(function() {
          return cb(null, user);
        });
      });


    //0Auth code
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

    app.get("/",function(req, res){
        res.render("Home");
    })

  
    app.get('/auth/google',
        passport.authenticate('google', { scope: ['profile'] }));//email and userid requested here
        
    app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });


    app.get("/secrets",async function(req, res){
        const query = await User.find({"secret":{$ne: null}});
        if(query){
            res.render("secrets", {usersWithSecrets: query})
            console.log(query);
        }
        else
        {
            console.log("not available")
        }
    })

    app.get("/submit", function(req, res){
        if(req.isAuthenticated()){
            res.render("submit")
        }else{
            res.redirect("/login");
        }
    })

    app.post("/submit",async function(req, res){
        const submittedSecret = req.body.secret;
        console.log(req.user.id)
        const query = await User.findById(req.user.id);
        if(query){
            query.secret = submittedSecret;    
            query.save();
            console.log(query)
            res.redirect("/secrets")
        }
        else{
            console.log("not available")
        }


    })

    app.get("/register",function(req, res){
        res.render("register");
    })

    app.get("/logout",function(req, res){
        req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
    })

    app.post("/register",function(req, res){
        //session
        User.register({username: req.body.username}, req.body.password, function(err, user){
            if(err){
                console.log(err);
                res.redirect("/register");
            }else{
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets")
                })
            }
        })
        //****************** */
        // // Salt bcrypt
        // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        //     const newUser  = new User({
        //         email : req.body.username,
        //         // password: md5(req.body.password)
        //         password: hash
        //     });
        //     const status = newUser.save(); 
        //     res.render("secrets")
        // });

       
    })
    
    app.get("/login",function(req, res){
       
        res.render("login");
    })
    
     app.post("/login",async function(req, res){

    //bcrypt
    //     const username = req.body.username;
    //     const password = req.body.password;

    //     console.log(username);
    //     console.log(password);

    //     const query = await User.findOne({ email: username }).exec();
        
    //     if(query){
    //         console.log(query.password)
    //         // Load hash from your password DB.
    //     bcrypt.compare(password, query.password, function(err, result) {
    //         console.log("I am inside")
    //         console.log(result)
    //         if(result === true){
    //             res.render("secrets");
    //         }
    //     });
                
    //     }
    //******************************
    //level5 security session and cookies
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        req.login(user, function(err) {
            if (err) { 
                console.log(err);
            }else{
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");
                });
            }
           
          });
    })
    app.listen(3000,function(){
        console.log("Chandrakala Serever started!!")
    })
}