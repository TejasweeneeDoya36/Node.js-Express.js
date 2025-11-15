//import core dependencies
const express = require('express'); //framework to build APIs
const {MongoClient,ObjectId} = require('mongodb'); //database
const path = require('path'); //path utilities for file and directory paths
const cors = require('cors'); // cross-origin resource sharing middleware
//initalise the app
const app= express();
const PORT= process.env.PORT || 3000; //server port number

//middleware setup
app.use(express.json());
app.use(cors({
    origin:[
        "https://tejasweeneedoya36.github.io",
        "https://node-js-express-js-7li6.onrender.com"
    ],
    methods:["GET","POST","PUT","DELETE"],
    allowedHeaders:["Content-Type","Authorization"]
}));

app.options('*', cors()); // Enable preflight


//logger middleware (logs request method, url, timestamp, and IP address)
app.use((req,res,next)=>{
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
});

//static files middleware (serve images from lessonImages directory)
app.use('/images',express.static(path.join(__dirname,'../Frontend/lessonImages')));

//404 handler for images
app.use('/images',(req,res,next)=>{
    res.status(404).json({
        success:false,
        message:"Image not found"
    });
});

//Database connection
const uri = "mongodb+srv://td499_db_user:Vanshika1111@coursework.achdmcb.mongodb.net/";
let db;
let lessonCollection; // collection for lesson data
let userCollection; // collection for user data
let orderCollection; // collection for order data

//connect to mongodb
async function connectToDatabase(){
    try{
        const client = new MongoClient(uri);
        await client.connect(); //connect to the database
        //output message to indicate if it has been connected
        console.log("Connected to database");

        // initialize collections and database
        db=client.db("LessonDatabase");
        lessonCollection=db.collection("LessonData");
        userCollection=db.collection("userData");
        orderCollection = db.collection("orderData");
    } catch(err){
        console.error("error connecting to Mongodb",err);
        process.exit(1); //stop server if the database connection has failed
    }
}

//call database connection function
connectToDatabase();

//user signup route (handles new user registrations)
app.post("/api/signup",async(req,res)=>{
    try{
        //extract data
        const {name,email,password,confirmPassword} = req.body;

        //check if they are empty
        if(!name || !email || !password || !confirmPassword){
            return res.status(400).json({
                success:false,
                message: "All fields are required"
            });
        }
        //check if passwords match
        if (password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message: "Passwords do not match"
            })
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
    }catch(error){ //catch any errors
        console.error("Signup error:",error);
        res.status(500).json({
            success:false,
            message:"Internal server error"
        });
    }
});

//user login route (handles user authentication)
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
    }catch(error){ //catch any errors
        console.error("Login error:",error);
        res.status(500).json({
                success:false,
                message:"Internal server error"
        });
    }
});

//fetch total number of registered users
app.get("/api/user-count", async(req,res)=>{
    try{
        //count all users in the collection
        const count = await userCollection.countDocuments();

        res.status(200).json({
            success: true,
            count:count
        });
    } catch(error){ //catch any errors
        console.error("Error fetching user count:",error);

        res.status(500).json({
            success:false,
            count:0
        });
    }
});

//fetch all lessons
app.get("/api/lessons", async(req,res)=>{
    try{
        //fetch all lessons from the collection and convert to array
        const lessons = await lessonCollection.find({}).toArray();
        res.status(200).json({
            success:true,
            lessons:lessons
        });
    }catch(error){ //catch any errors
        console.error("Error fetching lessons",error);
        res.status(400).json({
            success:false,
            message:"Failed to lessons"
        });
    }
});

//search lessons (enable text-like search across multiple fields)
app.get("/api/search", async(req,res) =>{
    try{
        //get search query from request and normalize it
        const query = req.query.q? req.query.q.trim().toLowerCase(): "";

        if(!query){
            // if no query is provided,return all lessons
            const allLessons = await lessonCollection.find({}).toArray();

            return res.json({
                success:true,
                lessons:allLessons
            });
        }

        //text-like search across multiple fields
        const filteredLessons = await lessonCollection.find({
            $or:[
                {subject:{$regex:query, $options: 'i'}},// search subject field
                {location:{$regex:query, $options: 'i'}}, // search location field
                {price:{$regex:query, $options: 'i'}},// search price field
                {spaces:{$regex:query, $options: 'i'}},// search spaces field
            ]
        }).toArray();

        res.json({
            success:true,
            lessons:filteredLessons
        })
    } catch(error){ //catch any errors
        console.error("error during search:",error);
        res.json({
            success:false,
            message: "Search failed"
        });
    }
});
// post route to save new order to order collection
app.post("/api/orders", async(req,res) =>{
    try{
        const {name, phone, lessons, dateOfOrder, totalPrice} = req.body;

        //check if empty
        if(!name || !phone|| !Array.isArray(lessons) || lessons.length === 0){
            return res.json({
                success: false,
                message: "Missing required order fields"
            });
        }

        //construct new order document
        const newOrder= {
            name: name.trim(),
            phone: phone.trim(),
            lessons: lessons.map(l => ({
                id: l.id,
                subject: l.subject,
                quantity: l.quantity
            })),
            dateOfOrder: dateOfOrder || new Date().toISOString(),
            totalPrice: totalPrice
        }

        //insert into database
        const result = await orderCollection.insertOne(newOrder);

        res.json({
            success:true,
            message: "Order created successfully",
            orderId: result.insertedId
        });
    }catch(error){ //catch any errors
        console.error("Error creating order:",error);
        res.json({
            success:false,
            message:"Failed to create order"
        });
    }
});
// put route to update any attribute on lesson 
app.put("/api/update-spaces", async(req,res)=>{
    try{
        const updates = req.body.updates; // array of update objects

        //check if empty
        if(!Array.isArray(updates) || updates.length === 0){
            return res.json({
                success:false,
                message:"No updates provided"
            });
        }

        //process each update in the array
        for(const update of updates){
            const {id, change} = update;
            
            //skip invalid updates
            if(!id || typeof change !== 'number') continue;
            
            //try to safely convert ID
            let objectId;
            try{
                objectId = new ObjectId(id);
            }   catch(err){
                console.warn("Invalid lesson ID:",id);
                continue; //skip invalid IDs
            }

            await lessonCollection.updateOne(
                {_id: objectId},
                {$inc: {spaces: change}} //increment or decrement spaces
            );

        }
        res.json({
            success:true,
            message:"Spaces updated successfully"
        });

    }catch(error){//catch any errors
        console.error("Error updating spaces:",error);
        res.json({
            success:false,
            message:"Failed to update spaces"
        });
    }
});
//serve login page as default 
app.get("/",(req,res)=>{
    res.json({
        success:true,
        message: "Backend server is running"
    });
});
//start the server and listen on specified port
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});
