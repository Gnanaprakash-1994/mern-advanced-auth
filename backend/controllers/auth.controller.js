import crypto from 'crypto'
import bcryptjs from 'bcryptjs'

import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendResetSuccessfulEmail} from '../mailtrap/emails.js'
import {User} from '../models/user.model.js'
import { generateTokenAndSetCookie } from '../utils/generateTokenAndSetCookie.js'


// Signup API code:
export const signup = async (req, res) => {
    const {email, password,name} = req.body
    try {
        //checking the user enterd correct details or not
        if(!email || !password || !name) {
            throw new Error("All fields are required")
    } 
    // If user already exists we need to throw error and message
    const userAlreadyExists = await User.findOne({email})
    if(userAlreadyExists) {
        return res.status(400).json({success:false,message: "User already exists"})
     }
     // Need to hash the typed password from user side for security reason
     const hashedPassword = await bcryptjs.hash(password,10)
     // Need to generate verification token for the user using crypt. This will be get from utils folder create a js file 
     // with generateverificationCode function.
     const verificationToken = Math.floor(100000 + Math.random() * 900000).toString()
     // Creating new user object
     const user = new User({
        email, 
        password: hashedPassword, 
        name,
        verificationToken,
        verificationTokenExpiresAt: Date.now() + 24*60*60*1000 //24hr clock
    })
     await user.save()

     //jwt token to verify email:
     generateTokenAndSetCookie(res,user._id)

    // send verification mail to the email of particular user:
    await sendVerificationEmail(user.email,verificationToken)

     res.status(201).json({
        success:true,
        message: "User created successfully",
        user: {
            ...user._doc,
            password: undefined
        }
     })
    } catch(err){
    res.status(400).json({success:false,message: err.message})
    }
}

// Verify Email Address API code:
export const verifyEmail = async (req, res) => {
    const {code} = req.body
    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: {$gt: Date.now()}
        })
        if(!user){
           return res.status(400).json({success:false,message:"Invalid or expired verification code"}) 
        }
        user.isVerified = true
        user.verificationToken = undefined
        user.verificationTokenExpiresAt = undefined
        await user.save()
        await sendWelcomeEmail(user.email,user.name)
        res.status(200).json({
            success:true,
            message: "Email verified successfully",
            user: {
                ...user._doc,
                password: undefined
            }
        })
    } catch (error) {
       console.log("Error in verifyEmail: ",error.message)
       res.status(500).json({success:false,message: "Server Error"}) 
    }
}

// Login API code
export const login = async (req, res) => {
    const {email,password} = req.body
    try{
        const user = await User.findOne({email})
        if(!user){
            return res.status(400).json({success:false,message:"Invaalid Credentials"})
        }
        const isPasswordValid = await bcryptjs.compare(password,user.password)
        if(!isPasswordValid){
            return res.status(400).json({success:false,message:"Invalid Credentials"})
        }
        generateTokenAndSetCookie(res,user._id)
        user.lastLogin = Date.now()
        await user.save()
        res.status(200).json({
            success:true,
            message:"Logged in Successfully",
            user:{
                ...user._doc,
                password:undefined,
            }
        })
    }catch(error){
        console.log("Error in Login: ",error)
        res.status(400).json({success:false,message: error.message})
    }
}

// Logout API code:  (This will clear the token from the cookie):
export const logout = async (req, res) => {
    // need to clear cookie for logout
    res.clearCookie("token")
    res.status(200).json({success:true, message: "Logged out successfully"})
}

// Forgot Password API code:
export const forgotPassword = async(req,res) => {
    const {email} = req.body
    try {
        const user = await User.findOne({email})
        if(!user){
            return res.status(400).json({success:false,message: "User not found"})
        }
        // Generate a reset Token using crypto package
        const resetToken = crypto.randomBytes(20).toString('hex')
        const resetTokenExpiresAt = Date.now() + 1*60*60*1000// 1hr
        
        user.resetPasswordToken = resetToken
        user.resetPasswordExpiresAt = resetTokenExpiresAt

        await user.save()

        // send reset Password Email with Reset Link
        await sendPasswordResetEmail(user.email,`${process.env.CLIENT_URL}/reset-password/${resetToken}`)
        res.status(200).json({success:true, message: "Password reset link sent to your email"})
    } catch (error) {
        console.log("Error in forgotPassword: ", error)
        res.status(400).json({success:false, message: error.message})
    }
}

// Reset Password API code:
export const resetPassword = async(req,res) => {
    try {
        const {token} = req.params 
        const {password} = req.body 
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: {$gt: Date.now()}
        })
        if(!user){
            return res.status(400).json({success:false, message: "Invalid or expired reset password token"})
        }
        //update password with hashed password
        const hashedPassword = await bcryptjs.hash(password,10)
        user.password = hashedPassword
        user.resetPasswordToken = undefined
        user.resetPasswordExpiresAt = undefined
        
        await user.save()

        // Send Password Reset Successful Email
        await sendResetSuccessfulEmail(user.email)
        res.status(200).json({success:true, message: "Password reset successfully"})
    } catch (error) {
        console.log("Error in resetPassword: ", error)
        res.status(400).json({success:false, message: error.message})
    }
} 

// Check Authentication of User API code:
export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password")
        if(!user){
            return res.status(400).json({success:false, message: "User not found"})
        }
        res.status(200).json({success:true,user})
    } catch (error) {
        console.log("Error in checkAuth: ", error)
        res.status(400).json({success:false, message: error.message})  
    }
}
