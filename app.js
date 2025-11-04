//import core dependencies
const express = require('express'); //framework to build APIs
const {MongoClient,ObjectId} = require('mongodb'); //database
//initalise the app
const app= express();
const PORT=3000;

//middleware
app.use(express.json());

//Database connection
const uri = "mongodb+srv://td499_db_user:Vanshika1111@coursework.achdmcb.mongodb.net/";
let db;
let lessonCollection;

//connect to mongodb
async function connectToDatabase(){
    try{
        const client = new MongoClient(uri);
        await client.connect();
        //output message to indicate if it has been conneted
        console.log("Connected to database");

        db=client.db("LessonDatabase");
        lessonCollection=db.collection("lessonData");
    } catch(err){
        console.error("error connecting to Mongodb",err);
    }
}

//call database connection function
connectToDatabase();


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});
