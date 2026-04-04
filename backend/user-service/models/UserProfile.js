const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({

authId:{
type:String,
required:true
},

name:{
type:String,
required:true
},

email:{
type:String,
required:true
},

role:{
type:String,
enum:["EMPLOYEE","MANAGER"]
},

department:{
type:String
},

phone:{
type:String
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("UserProfile",userProfileSchema);