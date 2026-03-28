const jwt = require("jsonwebtoken");

const { User } = require("../models/user.model");
const { AppError } = require("../utils/app-error");
const { getOrCreateSettings } = require("./settings.service");

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "7d",
  });

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT =
  "https://openidconnect.googleapis.com/v1/userinfo";
const DEFAULT_GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
].join(" ");

const getGoogleOAuthConfig = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:5000/api/auth/google/callback";
  const clientRedirectUri =
    process.env.CLIENT_URL || "http://localhost:5173/login";

  if (!clientId || !clientSecret) {
    throw new AppError(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required",
      500,
    );
  }

  return { clientId, clientSecret, redirectUri, clientRedirectUri };
};

const buildGoogleAuthUrl = () => {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  const scope = process.env.GOOGLE_OAUTH_SCOPES || DEFAULT_GOOGLE_SCOPES;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  return authUrl.toString();
};

const requestGoogleToken = async (params) => {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new AppError(
      data.error_description || "Google token exchange failed",
      400,
    );
  }

  return data;
};

const exchangeGoogleCodeForTokens = async (code) => {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  return requestGoogleToken({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
};

const getGoogleUserProfile = async (accessToken) => {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();

  if (!response.ok || data.error || !data.sub || !data.email) {
    throw new AppError("Could not fetch Google user profile", 400);
  }

  return data;
};

const loginByGoogleProfile = async ({
  googleId,
  email,
  name,
  avatar = "",
  accessToken = "",
  refreshToken = "",
  expiresIn = 3600,
}) => {
  const updateData = {
    googleId,
    email,
    name,
    avatar,
    accessToken,
    tokenExpiresAt: accessToken
      ? new Date(Date.now() + expiresIn * 1000)
      : null,
  };

  if (refreshToken) {
    updateData.refreshToken = refreshToken;
  }

  const user = await User.findOneAndUpdate(
    { $or: [{ googleId }, { email }] },
    updateData,
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await getOrCreateSettings(user._id);

  const token = signToken({
    id: user._id.toString(),
    email: user.email,
  });

  return { user, token };
};

const refreshGoogleAccessToken = async (userId) => {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.refreshToken) {
    throw new AppError("User does not have Google refresh token", 400);
  }

  const tokenData = await requestGoogleToken({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: user.refreshToken,
    grant_type: "refresh_token",
  });

  user.accessToken = tokenData.access_token || user.accessToken;
  user.tokenExpiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000)
    : user.tokenExpiresAt;
  await user.save();

  return {
    accessToken: user.accessToken,
    expiresIn: tokenData.expires_in,
    tokenType: tokenData.token_type,
    scope: tokenData.scope,
  };
};

module.exports = {
  buildGoogleAuthUrl,
  exchangeGoogleCodeForTokens,
  getGoogleOAuthConfig,
  getGoogleUserProfile,
  loginByGoogleProfile,
  refreshGoogleAccessToken,
};
