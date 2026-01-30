import { config } from "../../constants/config.js";

/**
 * Generates an HTML email template for workspace invitation.
 * @param {string} workspaceName - The name of the workspace.
 * @param {string} inviterName - The name of the person who sent the invite.
 * @param {string} token - The unique invitation token.
 * @returns {string} The complete HTML string for the email body.
 */
export function invitationTemplate(workspaceName, inviterName, token) {
  const primaryColor = "#007bff";
  const borderColor = "#e9ecef";
  const acceptUrl = `${config.FRONTEND_URL}/accept-invitation/${token}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workspace Invitation</title>
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

        /* Button Styles */
        .button-wrapper { padding: 20px 0; }
        .accept-button { 
            display: inline-block;
            background-color: ${primaryColor}; 
            color: #ffffff; 
            padding: 14px 40px; 
            border-radius: 6px; 
            text-decoration: none;
            font-size: 16px; 
            font-weight: 600; 
            transition: background-color 0.3s;
        }
        .accept-button:hover {
            background-color: #0056b3;
        }
        
        /* Workspace Info Box */
        .workspace-box {
            background-color: #f8f9fa;
            border-left: 4px solid ${primaryColor};
            padding: 15px 20px;
            margin: 20px 0;
            text-align: left;
            border-radius: 4px;
        }
        .workspace-name {
            font-size: 20px;
            font-weight: bold;
            color: #333333;
            margin: 0;
        }
        .inviter-info {
            font-size: 14px;
            color: #666666;
            margin-top: 5px;
        }
        
        /* Expiry Notice */
        .expiry-notice {
            font-size: 14px;
            color: #999999;
            margin-top: 20px;
            font-style: italic;
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
            .accept-button { padding: 12px 30px; font-size: 14px; }
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
                                    <h1 style="margin: 0; font-size: 24px;">🎉 Workspace Invitation</h1>
                                </td>
                            </tr>
                        </table>

                        <!-- Content Section -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td class="content" style="padding: 30px; text-align: center;">
                                    <p class="greeting" style="font-size: 18px; color: #333333; margin-top: 0; margin-bottom: 20px;">You're Invited!</p>
                                    
                                    <p class="instruction" style="font-size: 16px; color: #666666; margin-bottom: 20px; line-height: 1.5;">
                                        <strong>${inviterName}</strong> has invited you to collaborate in their workspace.
                                    </p>
                                    
                                    <!-- Workspace Info Box -->
                                    <div class="workspace-box" style="background-color: #f8f9fa; border-left: 4px solid ${primaryColor}; padding: 15px 20px; margin: 20px 0; text-align: left; border-radius: 4px;">
                                        <p class="workspace-name" style="font-size: 20px; font-weight: bold; color: #333333; margin: 0;">${workspaceName}</p>
                                        <p class="inviter-info" style="font-size: 14px; color: #666666; margin-top: 5px; margin-bottom: 0;">Invited by ${inviterName}</p>
                                    </div>
                                    
                                    <p class="instruction" style="font-size: 16px; color: #666666; margin-bottom: 30px; line-height: 1.5;">
                                        Click the button below to accept the invitation and join the workspace.
                                    </p>
                                    
                                    <!-- Accept Button -->
                                    <div class="button-wrapper" style="padding: 20px 0;">
                                        <a href="${acceptUrl}" class="accept-button" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 14px 40px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: 600;">
                                            Accept Invitation
                                        </a>
                                    </div>
                                    
                                    <p class="expiry-notice" style="font-size: 14px; color: #999999; margin-top: 20px; font-style: italic;">
                                        This invitation will expire in 7 days.
                                    </p>
                                    
                                    <hr style="border: none; border-top: 1px solid ${borderColor}; margin: 30px 0;">
                                    
                                    <p style="font-size: 14px; color: #999999; line-height: 1.5; margin: 0;">
                                        If the button above doesn't work, copy and paste this link into your browser:<br>
                                        <a href="${acceptUrl}" style="color: ${primaryColor}; word-break: break-all;">${acceptUrl}</a>
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <!-- Footer Section -->
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td class="footer" style="padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid ${borderColor};">
                                    <p style="margin: 0 0 10px 0;">
                                        If you didn't expect this invitation, you can safely ignore this email.
                                    </p>
                                    <p style="margin: 0;">
                                        Need help? <a href="mailto:support@yourapp.com" class="support-link" style="color: ${primaryColor}; text-decoration: none;">Contact Support</a>
                                    </p>
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
