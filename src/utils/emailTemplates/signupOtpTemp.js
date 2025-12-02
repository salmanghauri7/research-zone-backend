/**
 * Generates an HTML email template for sending a One-Time Password (OTP).
 * * @param {string} name - The user's first name (for personalization).
 * @param {string} otp - The generated OTP code.
 * @returns {string} The complete HTML string for the email body.
 */
export function signupOTPEmailTemp(name, otp) {
  // NOTE: Inline CSS is used extensively for maximum email client compatibility.
  const primaryColor = "#007bff";
  const borderColor = "#e9ecef";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account</title>
    <style>
        /* General Reset & Body Styles */
        body { margin: 0; padding: 0; background-color: #f4f7f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        td, th { padding: 0; }
        img { display: block; border: 0; }
        
        /* Main Container */
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }

        /* Header */
        .header { padding: 20px; text-align: center; background-color: ${primaryColor}; color: #ffffff; }

        /* Content Area */
        .content { padding: 30px; text-align: center; }
        .greeting { font-size: 18px; color: #333333; margin-bottom: 20px; }
        .instruction { font-size: 16px; color: #666666; margin-bottom: 30px; line-height: 1.5; }

        /* OTP Box Styles */
        .otp-box-wrapper { padding: 20px 0; }
        .otp-box { 
            background-color: ${borderColor}; 
            border: 2px dashed ${primaryColor}; 
            display: inline-block;
            padding: 15px 30px; 
            border-radius: 6px; 
            margin: 0 auto;
            font-size: 32px; 
            font-weight: bold; 
            letter-spacing: 5px; 
            color: #333333; 
            text-decoration: none;
            user-select: all; /* Allows easy copy on mobile */
        }
        
        /* Footer */
        .footer { 
            padding: 20px; 
            text-align: center; 
            font-size: 12px; 
            color: #999999; 
            border-top: 1px solid ${borderColor}; 
        }
        .support-link { color: ${primaryColor}; text-decoration: none; }

        /* Responsive adjustments */
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0; }
            .content { padding: 20px; }
            .otp-box { font-size: 28px; padding: 10px 20px; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6;">
    <center>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <div class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                        
                        <!-- Header Section -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td class="header" style="padding: 20px; text-align: center; background-color: ${primaryColor}; color: #ffffff; border-radius: 8px 8px 0 0;">
                                    <h1 style="margin: 0; font-size: 24px;">Account Verification</h1>
                                </td>
                            </tr>
                        </table>

                        <!-- Content Section -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td class="content" style="padding: 30px; text-align: center;">
                                    <p class="greeting" style="font-size: 18px; color: #333333; margin-top: 0; margin-bottom: 20px;">Hello, ${name}!</p>
                                    
                                    <p class="instruction" style="font-size: 16px; color: #666666; margin-bottom: 30px; line-height: 1.5;">
                                        Thank you for signing up. Please use the verification code below to complete your registration and log in to your account.
                                    </p>
                                    
                                    <!-- OTP CODE BOX -->
                                    <div class="otp-box-wrapper" style="padding: 20px 0;">
                                        <div class="otp-box" style="background-color: ${borderColor}; border: 2px dashed ${primaryColor}; display: inline-block; padding: 15px 30px; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: ${primaryColor};">
                                            ${otp}
                                        </div>
                                    </div>
                                    
                                    <p class="instruction" style="font-size: 14px; color: #999999; margin-top: 30px; margin-bottom: 0;">
                                        This code is valid for 10 minutes. Please do not share this code with anyone.
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <!-- Footer Section -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td class="footer" style="padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid ${borderColor};">
                                    <p style="margin: 0 0 5px 0;">If you did not request this, you can safely ignore this email.</p>
                                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
                                </td>
                            </tr>
                        </table>

                    </div>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
    `;
}
