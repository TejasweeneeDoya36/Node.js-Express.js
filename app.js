//import core dependencies
const express = require('express'); //framework to build APIs
const {MongoClient,ObjectId} = require('mongodb'); //database
const { use } = require('react');
const path = require('path');
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

//user signup route
app.post("/signup",async(req,res)=>{
    try{
        //extract data
        const {name,email,password} = req.body;

        //check if they are empty
        if(!name || !email || !password){
            return res.status(400).json({
                success:false,
                message: "All fields are required"
            });
        }

        //check if the password has minimum 6 characters
        if(password.length < 6){
            return res.status(400).json({
                success:false,
                message:"Password length must be atleast 6 characters long"
            });
        }

        //check if email already exists
        const existingUser = await userCollection.findOne({email:email.toLowerCase()});
        if(existingUser){
            return res.status(400).json({
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
        res.status(200).json({
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

//user login route
app.post("/api/login", async(req,res)=>{
    try{
        const {email,password} = req.body;

        //if empty
        if (!email || !password){
            return res.status(400).json({
                success:false,
                message:"Email and password are required"
            });
        }

        //find user by email
        const user = await userCollection.findOne({email:email.toLowerCase()});

        //invalid credentials
        if(!user || user.password !== password){
            return res.status(401).json({
                success:false,
                message:"Invalid email or password"
            });
        }

        //update user last login timestamp
        await userCollection.updateOne(
            {_id:user._id},
            {$set:{lastLogin: new Date()}}
        );

        //send success message
        res.status(200).json({
            success:true,
            message:"Login successful",
            user:{
                id:user._id,
                name: user.name,
                email:user.email
            }
        });
    }catch(error){
        console.error("Login error:",error);
        res.status(500).json({
                success:false,
                message:"Internal server error"
        });
    }
});

//serve login page as default 
app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,"../Vue.js/loginHTML.html"));
});

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});
