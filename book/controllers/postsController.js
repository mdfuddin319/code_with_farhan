const { createPostSchema } = require("../middlewares/validator");
const post = require("../models/postsModel");

exports.getPosts = async (req,res) =>{
    const {page} = req.body;
    const postsPerPage = 10;

    try {
        let pageNum = 0;
        if (page <=1) {
            pageNum = 0;
        }else{
            pageNum = page - 1;
        }
        const result = await post.find().sort({createdAt: -1}).skip(pageNum * postsPerPage).limit(postsPerPage).populate({
        Path:'userId',
        select:'email',
        });
res.status(200).json({success:true, message:'posts', data:result});
    } catch (error) {
        console.log(error);
    }
};

exports.singlePosts = async (req,res) =>{
    const {_id} = req.body;
    

    try {
        
        const result = await post.findOne(_id).populate({
        Path:'userId',
        select:'email',
        });
        if (!existingPost) {
            return res
            .status(404)
            .json({success:false, message:'post unavailable'});
        }

res.status(200).json({success:true, message:'single posts', data:result});
    } catch (error) {
        console.log(error);
    }
};

exports.createPost = async (req,res)=>{
    const {title,description } = req.body;
    const {userId} = req.body;

    try {
        const {error, value} = createPostSchema.validate({
title,
description,
userId,
        });
        if (error) {
            return res
            .status(401)
            .json({success:false, message: error.details[0].message});
        }
        const result = await Post.create({
            title,description,userId,
        });
        res.status(201).json({success:true, message:'created', data:result});
    } catch (error) {
        console.log(error);
    }
};

exports.updatePost = async (req,res)=>{
    const {_id} = req.query;
    const {title,description } = req.body;
    const {userId} = req.body;

    try {
        const {error, value} = createPostSchema.validate({
title,
description,
userId,
        });
        if (error) {
            return res
            .status(401)
            .json({success:false, message: error.details[0].message});
        }

        const existingPost = await Post.findOne({_id});
        if (!existingPost) {
            return res
            .status(404)
            .json({success:false, message:'post unavailable'});
        }
        if (existingPost.userId.toString() !== userId) {
                        return res
            .status(403)
            .json({success:false, message:'Unauthorized'});
        }
        existingPost.title = title;
        existingPost.description = description;

        const result = await existingPost.save();
        res.status(200).json({success:true, message:'Updated', data:result});
    } catch (error) {
        console.log(error);
    }
};
 
exports.deletePost = async (req,res)=>{
    const {_id} = req.query;
     
    const {userId} = req.body;

    try {
        
        const existingPost = await Post.findOne({_id});
        if (!existingPost) {
            return res
            .status(404)
            .json({success:false, message:'Post Already unavailable'});
        }
        if (existingPost.userId.toString() !== userId) {
                        return res
            .status(403)
            .json({success:false, message:'Unauthorized'});
        }

        await Post.deleteOne({_id});
        res.status(200).json({success:true, message:'deleted',});
    } catch (error) {
        console.log(error);
    }
};

