//import modules
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import mongodb from 'mongodb';
import bodyParser from 'body-parser';

const app= express();
const uri='link to be changed',

//middleware
app.use(cors());
app.use(bodyParser.json());

//database connection