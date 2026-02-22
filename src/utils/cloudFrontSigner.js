import { getSignedCookies } from "@aws-sdk/cloudfront-signer";
import { config } from "../constants/config.js";

/**
 * Generate CloudFront signed cookies for secure content delivery
 * @param {number} expirationTime - Cookie expiration time in milliseconds
 * @returns {Object} Signed cookies object with Policy, Signature, and Key-Pair-Id
 */
export const generateCloudFrontSignedCookies = (
  expirationTime = 3600000 // 1 hour in milliseconds
) => {
  const cloudFrontDomain = config.CLOUDFRONT_DOMAIN;
  const privateKey = config.CLOUDFRONT_PRIVATE_KEY;
  const keyPairId = config.CLOUDFRONT_KEY_PAIR_ID;

  if (!cloudFrontDomain || !privateKey || !keyPairId) {
    throw new Error(
      "CloudFront configuration is missing. Ensure CLOUDFRONT_DOMAIN, CLOUDFRONT_PRIVATE_KEY, and CLOUDFRONT_KEY_PAIR_ID are set."
    );
  }

  // Create policy for CloudFront
  const policy = JSON.stringify({
    Statement: [
      {
        Resource: `https://${cloudFrontDomain}/*`,
        Condition: {
          DateLessThan: {
            "AWS:EpochTime": Math.floor((Date.now() + expirationTime) / 1000),
          },
        },
      },
    ],
  });

  // Generate signed cookies
  const cookies = getSignedCookies({
    policy,
    privateKey,
    keyPairId,
  });

  return cookies;
};

/**
 * Generate a CloudFront URL for a file stored in S3
 * @param {string} fileKey - S3 file key (path)
 * @returns {string} CloudFront URL
 */
export const generateCloudFrontUrl = (fileKey) => {
  const cloudFrontDomain = config.CLOUDFRONT_DOMAIN;

  if (!cloudFrontDomain) {
    throw new Error("CloudFront domain is not configured");
  }

  if (!fileKey || typeof fileKey !== "string" || fileKey.trim() === "") {
    throw new Error("Invalid or missing fileKey");
  }

  return `https://${cloudFrontDomain}/${fileKey}`;
};

/**
 * Set CloudFront signed cookies in the response headers
 * @param {Object} res - Express response object
 * @param {Object} cookies - Signed cookies object
 * @param {number} maxAge - Cookie max age in milliseconds (default: 1 hour)
 */
export const setCloudFrontCookies = (
  res,
  cookies,
  maxAge = 3600000 // 1 hour in milliseconds
) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAge,
    path: "/",
  };

  res.cookie("CloudFront-Policy", cookies["CloudFront-Policy"], cookieOptions);
  res.cookie(
    "CloudFront-Signature",
    cookies["CloudFront-Signature"],
    cookieOptions
  );
  res.cookie(
    "CloudFront-Key-Pair-Id",
    cookies["CloudFront-Key-Pair-Id"],
    cookieOptions
  );
};
