const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username : {
        type : String, 
        required : true,
        unique : true,
    },

    firstname : {
        type : String,
        required : true,
    },

    lastname : {
        type : String,
        required : true,
    },

    password : {
        type : String,
        required : true,
    },

    create_on : {
        type : Date,
        default : Date.now
    }
});

const User = mongoose.model("users" , UserSchema);
module.exports = User;