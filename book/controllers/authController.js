const jwt = require ('jsonwebtoken');
const { signupSchema,signinSchema, acceptCodeSchema, changePasswordSchema } = require ("../middlewares/validator.js");
const User = require('../models/usersModel.js');
const { doHash, doHashValidation, hmacProcess } = require ("../utils/hashing.js");
const transport = require ('../middlewares/sendMail.js');

exports.signup = async (req, res)=>{
    const {email,password} =req.body;
    try {
 const {error, value} = signupSchema.validate({email,password});

 if (error) {
    return res.status(401).json({success:false, message: error.details[0].message});
 }
 const existingUser = await User.findOne({email});
 
 if(existingUser){
    return res.status(401).json({success:false, message:"User Already exist!"});
 }

const hashedPassword = await doHash(password,12);

const newUser = new User ({
    email,
    password:hashedPassword,
})
const result = await newUser.save();
result.password = undefined;
res.status(201).json({
success:true, message:"Your account has been Created Successfully.", result,
});
    } catch (error) {
        console.log(error)
    }
};

exports.signin = async (req, res)=>{
    const {email,password} =req.body;
    
    try {
        const {error, value} = signinSchema.validate({email,password});
        if (error) {
            return res
            .status(401)
            .json({success:false, message: error.details[0].message});
        }

        const existingUser = await User.findOne({email}).select('+password');
        if (!existingUser) {
            return res
            .status(401)
            .json({success:false, message:'User does not Exist!'});
        } 
        const result = await doHashValidation(password,existingUser.password);
        if (!result) {
            return res
            .status(401)
            .json({success:false, message:'invalid credentails!'});
        }
        const token = jwt.sign({
            userId: existingUser._id,
            email: existingUser.email,
            verified: existingUser.verified, 
        },
        process.env.TOKEN_SECRET,
        {
            expiresIn:'8h',
        }
    );

res.cookie('Authorization','Bearer'+ token,{expires: new Date(Date.now()+ 8
*3600000), httpOnly:process.env.NODE_ENV === 'production', secure:process.env.NODE_ENV==='production'})
.json({
    success:true,
    token,
    message:'logged in Succesfully',
});

    } catch (error) {
        console.log(error);
    }
};

exports.signout = async (req,res) =>{
res 
.clearCookie ('Authorization')
.status(200)
.json({success:true, message:'logged out Successfully.'});
};

exports.sendVerificationCode = async (req,res)=>{
    const {email} = req.body;
    try {
        const existingUser = await User.findOne({email});
        if (!existingUser) {
            return res
            .status(404)
            .json({success:false, message:'User does not exist'});
        }
        if (existingUser.verified) {
            return res
            .status(400)
            .json({success:false, message:'You are Already Verified.'});
        }
        const codeValue = Math.floor(Math.random()*1000000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject:"verification code",
            html:'<h1>' + codeValue + '</h1>'
        })

        if (info.accepted[0] === existingUser.email) {
            const hashedCodeValue =hmacProcess(codeValue,process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.VerificationCode = hashedCodeValue;
            existingUser.VerificationCodeValidation = Date.now();
            await existingUser.save();
            return  res.status(200).json({success:true, message:'code sent!'});
        }
    return  res.status(400).json({success:true, message:'opps! code send failed.'});
    
} catch (error) {
        console.log(error);
    }
};

exports.verifyVerificationCode = async (req, res)=>{
    const {email, providedCode} = req.body;
    try {
        const {error, value} = acceptCodeSchema.validate({email, providedCode});
        if (error) {
            return res
            .status(401)
            .json({success:false, message:error.details[0].message});
        }

        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({email}).select("+varificationCode +verificationCodeValidation");

if (!existingUser) {
    return res
    .status(401)
    .json({success:false, message: 'User does not Exist!'});
}
if (existingUser.verified) {
    return res.status(400).json({success: false, message:"you are already verified"});
}

if (!existingUser.VerificationCode || !existingUser.VerificationCodeValidation) {
    return res.status(400).json({success:false, message:"!something went wrong with the code"});
}
if (Date.now() - existingUser.VerificationCodeValidation >5* 60 *1000 ) {
    return res.status(400).json({success:false, message:'code has been Expired!'});
}

const hashedCodeValue = hmacProcess (codeValue,process.env.HMAC_VERIFICATION_CODE_SECRET);

if (hashedCodeValue === existingUser.VerificationCode) {
    existingUser.verified = true;
    existingUser.VerificationCode = undefined;
    existingUser.VerificationCodeValidation = undefined;
    await existingUser.save();
    return res 
    .status(200)
    .json({success:true, message:'Your account has been verified'});
}
return res
.status(400)
.json({success:false, message:"unexpected error"});

    } catch (error) {
        console.log(error);
    }
};

exports.changePassword = async (req, res)=>{
const {userId,verified} = req.user;
const {oldPassword,newPassword} = req.body;
try {
    const {error, value} = changePasswordSchema.validate({oldPassword, newPassword});
        if (error) {
            return res
            .status(401)
            .json({success:false, message:error.details[0].message});
        }
        if (!verified) {
            return res 
            .status(401)
            .json({success:false, message:'you are not verified user'});
        }
        const existingUser = await User.findOne({_id:userId}).select('+password');
        if (!existingUser) {
            return res 
            .status(401)
            .json({success:false, message:'user does not Exist'});
        }
        const result = await doHashValidation(oldPassword,existingUser.password);
        if (!result) {
            return res 
            .status(401)
            .json({success:false, message:'Invalid credentails!'});
        } 

        const hashedPassword = await doHash(newPassword,12);
        existingUser.password = hashedPassword;
        await existingUser.save();
        return res
        .status(200)
        .json({success:true, message:"Password Updated!!"});
} catch (error) {
    console.log(error);
}
};


exports.sendForgotPasswordCode = async (req,res)=>{
    const {email} = req.body;
    try {
        const existingUser = await User.findOne({email});
        if (!existingUser) {
            return res
            .status(404)
            .json({success:false, message:'User does not exist'});
        }
        
        const codeValue = Math.floor(Math.random()*1000000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject:"Forgot password code",
            html:'<h1>' + codeValue + '</h1>'
        })

        if (info.accepted[0] === existingUser.email) {
            const hashedCodeValue =hmacProcess(codeValue,process.env.HMAC_VERIFICATION_CODE_SECRET);
            existingUser.forgotPasswordCode = hashedCodeValue;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save();
            return  res.status(200).json({success:true, message:'code sent!'});
        }
    return  res.status(400).json({success:true, message:'opps! code send failed.'});
    
} catch (error) {
        console.log(error);
    }
};

exports.verifyForgotPasswordCode = async (req, res)=>{
    const {email, providedCode, newPassword} = req.body;
    try {
        const {error, value} = acceptFPCodeSchema.validate({email, providedCode,newPassword});
        if (error) {
            return res
            .status(401)
            .json({success:false, message:error.details[0].message});
        }

        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({email}).select("+forgotPasswordCode +forgotPasswordCodeValidation");

if (!existingUser) {
    return res
    .status(401)
    .json({success:false, message: 'User does not Exist!'});
}


if (!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation) {
    return res.status(400).json({success:false, message:"!something went wrong with the code"});
}
if (Date.now() - existingUser.forgotPasswordCodeValidation >5* 60 *1000 ) {
    return res.status(400).json({success:false, message:'code has been Expired!'});
}

const hashedCodeValue = hmacProcess (codeValue,process.env.HMAC_VERIFICATION_CODE_SECRET);

if (hashedCodeValue === existingUser.forgotPasswordCode) {
    const hashedPassword = await doHash(newPassword,12);
    existingUser.password = hashedPassword;
    existingUser.forgotPasswordCode = undefined;
    existingUser.forgotPasswordCodeValidation = undefined;
    await existingUser.save();
    return res 
    .status(200)
    .json({success:true, message:'Your account has been verified'});
}
return res
.status(400)
.json({success:false, message:"unexpected error"});

    } catch (error) {
        console.log(error);
    }
};
