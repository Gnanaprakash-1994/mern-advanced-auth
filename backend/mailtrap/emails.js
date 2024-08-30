import {mailTrapClient, sender } from './mailtrap.config.js'
import {PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE} from './emailTemplates.js'
import { response } from 'express'

// Email to send verification code:
export const sendVerificationEmail = async(email,verificationToken) => {
    const recipient = [{email}]

    try {
        const response = await mailTrapClient.send({
            from: sender,
            to: recipient,
            subject: 'Verify Your Email',
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}",verificationToken),
            category: "Email Verification"
        })
        console.log("Email sent successfully ",response)
    } catch (error) {
        console.log(`Error sending verification `,error)

        throw new Error(`Error sending verification email: ${error}`)
    }
}

// Email to send Welcome notes after verification and set isverified to TRUE:
export const sendWelcomeEmail = async(email,name) => {
    const reccipient = [{email}]
    try {
        await mailTrapClient.send({
            from: sender,
            to: reccipient,
            template_uuid:"76145fbe-ca57-421e-b490-eb7b31d6064a",
            template_variables:{
                company_info_name:"Auth Company",
                name:name,
            }
        })
        console.log("Welcome Email sent successfully",response)
    } catch (error) {
        console.log(`Error sending Welocme email `,error)
        throw new Error(`Error sending welcome email: ${error}`)
    }
}

// Email to send password reset link:
export const sendPasswordResetEmail = async(email,resetURL) => {
    const recipient = [{email}]
    try{
      const response = await mailTrapClient.send({
        from: sender,
        to: recipient,
        subject: 'Reset your Password',
        html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}",resetURL),
        category: "Password Reset"
      })
    } catch (error) {
        console.log(`Error sending password reset email `, error)
        throw new Error(`Error sending password reset email: ${error}`)
    }
}

// Email to send password reset success message:
export const sendResetSuccessfulEmail = async(email) => {
    const recipient = [{email}]
    try {
        const response = await mailTrapClient.send({
            from: sender,
            to:recipient,
            subject: 'Password Reset Successful',
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
            category: "Password Reset"
        })
        console.log("Reset Successful email sent successfully",response)
    } catch (error) {
        console.log(`Error sending password reset successful email `, error)
        throw new Error(`Error sending password reset successful email: ${error}`)
    }
}