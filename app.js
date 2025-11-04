//import core dependencies
const express = require('express'); //framework to build APIs
const {MongoClient,ObjectId} = require('mongodb'); //database
const { use } = require('react');
//initalise the app
const app= express();
const PORT=3000;

//middleware
app.use(express.json());

//Database connection
const uri = "mongodb+srv://td499_db_user:Vanshika1111@coursework.achdmcb.mongodb.net/";
let db;
let lessonCollection;
let userCollection;

//connect to mongodb
async function connectToDatabase(){
    try{
        const client = new MongoClient(uri);
        await client.connect();
        //output message to indicate if it has been conneted
        console.log("Connected to database");

        db=client.db("LessonDatabase");
        lessonCollection=db.collection("lessonData");
        userCollection=db.collection("userData");
    } catch(err){
        console.error("error connecting to Mongodb",err);
        process.exit(1); //stop server if the database connection has failed
    }
}

//call database connection function
connectToDatabase();


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});

//user signup route
app.post("/signup",async(req,res)=>{
    try{
        //extract data
        const {name,email,password} = req.body;

        //check if they are empty
        if(!name || !email || !password){
            return res.json({
                success:false,
                message: "All fields are required"
            });
        }

        //check if the password has minimum 6 characters
        if(password.length < 6){
            return res.json({
                success:false,
                message:"Password length must be atleast 6 characters long"
            });
        }

        //check if email already exists
        const existingUser = await userCollection.findOne({email:email.toLowerCase()});
        if(existingUser){
            return res.json({
                success:false,
                message:"User with this email already exists"
            });
        }

        //create a new user
        const newUser ={
            name: name.trim(),
            email:email.toLowerCase().trim(),
            password:password,
        };

        //insert user in database
        const result = await userCollection.insertOne(newUser);

        //return success message
        res.json({
            success:true,
            message:"User created successfully",
            user:{
                id: result.insertedId,
                name: newUser.name,
                email: newUser.email
            }
        })
    }catch(error){
        console.error("Signup error:",error);
    }
});