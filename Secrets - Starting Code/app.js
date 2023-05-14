//jshint esversion:6
main().catch(err => console.log(err))
async function main() {
    const express = require("express");
    const bodyParser = require("body-parser");
    const ejs = require("ejs")
    const _ = require("lodash");
    const app = express();
    app.set("view engine","ejs");
    app.use(bodyParser.urlencoded({ extended: true}));
    app.use(express.static("public"));
    const mongoose = require("mongoose");


    await mongoose.connect('mongodb://127.0.0.1:27017/wiikiDB');
    const articleSchema = {
        title: String,
        content:String
    }

    const Article = mongoose.model("Article", articleSchema);

   
    // chainned method of route using express

    app.route("/articles")
    .get( async function(req, res){
        
            //Fetching all the article
            const query = await Article.find();
            res.send(query)
            //res.render("home",{ myhomeStartingContent: homeStartingContent, posts: query });
        }

    )

    .post(async function(req, res){
        // console.log(req.body.title);
        // console.log(req.body.content);

        const newArticle = new Article({
            title: req.body.title,
            content: req.body.content
        })
        newArticle.save();
    })

    .delete(async function(req, res){
        await Article.deleteMany();
        console.log("Successfully deleted all the articles!!")
    });

    app.route("/articles/:articleTitle")
    .get(async function(req, res){

        const query = await Article.findOne({ title: req.params.articleTitle }).exec();
        if(query){
            res.send(query);
        }
        else{
            res.send("No data found")
        }
    })
    
    // completely replace with tis new record 
    .put(async function(req, res){
          const query = await Article.updateOne({ title: req.params.articleTitle},
               { title: req.body.title, content: req.body.content })
               if(query){
                console.log("Updtaed successfully")
            }
            else{
                res.send("Updation failed")
            }
              
    })
    .patch(async function(req, res){
        const query = await Article.updateOne(
            {title: req.params.articleTitle},
            {$set: req.body})
            if(query){
                console.log(req.body)
                console.log(req.params.articleTitle)
                console.log("Updtaed successfully")
            }
            else{
                res.send("Updation failed")
            }
    })
    .delete(async function(req, res){
        await Article.deleteOne({ title: req.params.articleTitle }); 
        console.log("Successfully deelted")
    });

    //TODO
    app.listen(3000, function(){
        console.log("Server started on port 3000");
    })

}