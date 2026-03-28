const {
  buildGoogleAuthUrl,
  exchangeGoogleCodeForTokens,
  getGoogleOAuthConfig,
  getGoogleUserProfile,
  loginByGoogleProfile,
  refreshGoogleAccessToken,
} = require("../services/auth.service");
const { formatResponse } = require("../utils/format-response");
const { AppError } = require("../utils/app-error");

const googleAuthLogin = (_req, res, next) => {
  try {
    const authUrl = buildGoogleAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

const googleAuthCallback = async (req, res, next) => {
  try {
    const { code, error } = req.query;

    if (error) {
      throw new AppError(`Google auth failed: ${error}`, 400);
    }

    if (!code || typeof code !== "string") {
      throw new AppError("Missing Google authorization code", 400);
    }

    const tokenData = await exchangeGoogleCodeForTokens(code);
    const profile = await getGoogleUserProfile(tokenData.access_token);
    const result = await loginByGoogleProfile({
      googleId: profile.sub,
      email: profile.email,
      name: profile.name || profile.email,
      avatar: profile.picture || "",
      accessToken: tokenData.access_token || "",
      refreshToken: tokenData.refresh_token || "",
      expiresIn: tokenData.expires_in || 3600,
    });

    const { clientRedirectUri } = getGoogleOAuthConfig();
    const callbackUrl = new URL(clientRedirectUri);
    callbackUrl.searchParams.set("token", result.token);
    callbackUrl.searchParams.set("email", result.user.email);
    callbackUrl.searchParams.set("name", result.user.name);
    callbackUrl.searchParams.set("avatar", result.user.avatar || "");

    res.redirect(callbackUrl.toString());
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { googleId, email, name, avatar, accessToken, refreshToken, expiresIn } = req.body;

    if (!googleId || !email || !name) {
      throw new AppError("googleId, email, name are required", 400);
    }

    const result = await loginByGoogleProfile({
      googleId,
      email,
      name,
      avatar,
      accessToken,
      refreshToken,
      expiresIn,
    });

    res.json(
      formatResponse({
        message: "Login success",
        data: result,
      }),
    );
  } catch (error) {
    next(error);
  }
};

const googleRefreshToken = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const refreshedToken = await refreshGoogleAccessToken(userId);
    res.json(
      formatResponse({
        message: "Google access token refreshed",
        data: refreshedToken,
      }),
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { googleAuthLogin, googleAuthCallback, googleLogin, googleRefreshToken };
