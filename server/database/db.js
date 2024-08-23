import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const USERNAME = process.env.DB_USERNAME;
const PASSWORD = process.env.DB_PASSWORD; 

const Connection = () => {
    const DB_URI = `mongodb://${USERNAME}:${PASSWORD}@voicemail-shard-00-00.svgqm.mongodb.net:27017,voicemail-shard-00-01.svgqm.mongodb.net:27017,voicemail-shard-00-02.svgqm.mongodb.net:27017/?ssl=true&replicaSet=atlas-ooaroo-shard-0&authSource=admin&retryWrites=true&w=majority&appName=voicemail`;
    try {
        mongoose.connect(DB_URI, { useNewUrlParser: true });
        mongoose.set('strictQuery', true);
        console.log('Database connected sucessfully');
    } catch (error) {
        console.log('Error while connecting with the database ', error.message)
    }
}

export default Connection;