const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');
const config = require('../../config');
const { logger } = require('../../winston');
const { User, Event } = require('../models');
const GitHub = require('./GitHub');
const RepositoryVerifier = require('./RepositoryVerifier');
const EventCreator = require('./EventCreator');
const { createUAAStrategy, verifyUAAUser } = require('./uaaStrategy');
const Features = require('../features');

const passport = new Passport.Passport();
const flashMessage = {
  message: `Apologies; you are not authorized to access ${config.app.appName}! Please contact the ${config.app.appName} team if this is in error.`,
};

passport.serializeUser((user, next) => {
  next(null, user.id);
});

passport.deserializeUser((id, next) => {
  User.scope('withUAAIdentity').findByPk(id)
    .then((user) => {
      next(null, user);
    });
});

/**
 * Github Auth
 */
const {
  github: {
    options: githubOptions,
    authorizationOptions: githubAuthorizationOptions,
  },
} = config.passport;

async function checkUpdateUser({
  username,
  email,
  githubAccessToken,
  githubUserId,
}) {
  const user = await User.scope('withUAAIdentity')
    .findOne(
      { where: { username } }
    );

  if (!user) {
    return { flashMessage };
  }

  if (user.UAAIdentity) {
    if (Features.enabled(Features.Flags.FEATURE_AUTH_UAA)) {
      return { flashMessage: 'You must login with your cloud.gov account. Please try again.' };
    }
    return { flashMessage: 'Now that you\'ve migrated, you must login to Pages with your cloud.gov account.' };
  }

  await user.update({
    username,
    email,
    githubAccessToken,
    githubUserId,
    signedInAt: new Date(),
  });

  return user;
}

async function verifyGithub(accessToken, _refreshToken, profile, callback) {
  try {
    if (config.app.product !== 'pages') {
      const isValidUser = await GitHub.validateUser(accessToken, false);
      if (!isValidUser) {
        return callback(null, false, flashMessage);
      }
    }

    const username = profile.username.toLowerCase();
    // eslint-disable-next-line no-underscore-dangle
    const { email } = profile._json;

    const user = await checkUpdateUser({
      username,
      email,
      githubAccessToken: accessToken,
      githubUserId: profile.id,
    });

    if (user.flashMessage) {
      return callback(null, false, user.flashMessage);
    }

    EventCreator.audit(Event.labels.AUTHENTICATION, user, 'GitHub login');

    RepositoryVerifier.verifyUserRepos(user)
      .catch(err => EventCreator.error(Event.labels.SITE_USER, err, {
        userId: user.id,
      }));

    return callback(null, user);
  } catch (err) {
    logger.warn('Authentication error: ', err);
    return callback(err);
  }
}

async function verifyGithub2(accessToken, _refreshToken, profile, callback) {
  try {
    const username = profile.username.toLowerCase();
    // eslint-disable-next-line no-underscore-dangle
    const { email } = profile._json;

    const user = {
      username,
      email,
      githubAccessToken: accessToken,
      githubUserId: profile.id,
    };

    EventCreator.audit(Event.labels.AUTHENTICATION_PAGES_GH_TOKEN, null, 'User authenticated', {
      user,
    });

    return callback(null, user);
  } catch (err) {
    EventCreator.error(Event.labels.AUTHENTICATION_PAGES_GH_TOKEN, err);
    logger.warn('Github authentication error: ', err);
    return callback(err);
  }
}

passport.use('github', new GitHubStrategy(githubOptions, verifyGithub));
passport.use('github2', new GitHubStrategy(githubAuthorizationOptions, verifyGithub2));

let uaaLogoutRedirectURL = '';

/**
 * UAA Auth
 */
if (Features.enabled(Features.Flags.FEATURE_AUTH_UAA)) {
  const uaaOptions = {
    ...config.passport.uaa.options,
    callbackURL: `${config.app.hostname}/auth/uaa/callback`,
    logoutCallbackURL: `${config.app.hostname}/auth/uaa/logout`,
  };

  const verifyUAA = async (accessToken, refreshToken, profile, callback) => {
    try {
      const user = await verifyUAAUser(
        accessToken,
        refreshToken,
        profile,
        ['pages.user', 'pages.support', 'pages.admin']
      );

      if (!user) return callback(null, false, flashMessage);

      await user.update({
        signedInAt: new Date(),
      });

      EventCreator.audit(Event.labels.AUTHENTICATION, user, 'UAA login');

      return callback(null, user);
    } catch (err) {
      EventCreator.error(Event.labels.AUTHENTICATION, err, { profile });
      return callback(err);
    }
  };

  const uaaStrategy = createUAAStrategy(uaaOptions, verifyUAA);

  passport.use('uaa', uaaStrategy);

  uaaLogoutRedirectURL = uaaStrategy.logoutRedirectURL;
}

passport.logout = (idp) => {
  const redirectURL = idp === 'uaa' ? uaaLogoutRedirectURL : '/';
  return (req, res) => {
    const { user } = req;
    req.logout();
    if (user) {
      EventCreator.audit(Event.labels.AUTHENTICATION, user, 'logout');
    }
    req.session.destroy(() => {
      res.redirect(redirectURL);
    });
  };
};

module.exports = passport;
