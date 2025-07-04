const { string, required } = require('joi');
const mongoose = require ('mongoose');

const userSchema = mongoose.Schema({
    email:{
        type: String,
        required: [true, 'Email is required!'],
        trim: true,
        unique: [true, 'Email must be unique!'],
        minLength:[5,"Email must have 5 characters!"],
        lowercase: true,
    },
    password:{
        type: String,
        required: [true, "password must be provided!"],
        trim: true,
        select:false,
    },
    verified:{
        type: Boolean,
        default: false,
    },
    verificationCode:{
        type: String,
        default: false,
    },
    verificationCodeValidation:{
        type: Number,
        default: false,
    },
    forgotPasswordCode:{
        type: String,
        default: false,
    },
forgotPasswordCodeValidation:{
        type: Number,
        default: false,
    }

},{
    timestamps:true
});

module.exports = mongoose.model("User", userSchema);