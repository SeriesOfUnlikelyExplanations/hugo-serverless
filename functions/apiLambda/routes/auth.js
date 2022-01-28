// route - api/auth
const querystring = require('querystring');
const { httpRequest } = require('../components');
const url = require('url');

const authRoutes = (api, opts) => {

  api.get('/logout', async (req,res) => {
    auth = new Auth(req)
    auth.clearCookies(res);
    return res.redirect('https://' + req.config['AuthDomain'] + '/logout?client_id='+req.config['UserPoolClientId']
      +'&logout_uri=https://'+req.config.host)
  })

  api.get('/refresh', async (req,res) => {
    var logoutResponse = {
      login: true,
      redirect_url: '/api/auth/logout'
    }
    console.log(logoutResponse);
    //if there is already an access token, then skip the rest
    if ('access_token' in req.cookies) {
      return res.status(200).json(logoutResponse)
    }
    var loginResponse = {
      login: false,
      redirect_url: 'https://'+req.config['AuthDomain']+'/login?client_id='+req.config['UserPoolClientId']
        +'&response_type=code&scope=email+openid+phone+profile&redirect_uri=https://'
        +req.config.host+'/api/auth/callback'
    }
    if (!('refresh_token' in req.cookies)) {
      return res.status(200).json(loginResponse)
    }
    auth = new Auth(req)
    var tokens = await auth.refreshTokens(req.cookies.refresh_token);
    if ('error' in tokens) {
      auth.clearCookies(res)
      return res.status(200).json(loginResponse)
    }
    auth.setCookies(res, tokens);
    return res.status(200).json(logoutResponse)
  })

  api.get('/callback', async (req,res) => {
    auth = new Auth(req)
    if ('code' in req.query) {
      var tokens = await auth.authCode(req.query.code, req.config.host+'/api/auth/callback');
      if ('error' in tokens) {
        auth.clearCookies(res)
      } else {
        auth.setCookies(res, tokens);
      }
    }
    return res.redirect('https://'+req.config.host)
  })
}

class Auth {
  constructor(req) {
    this.tokenOptions = {
      httpOnly: false,
      path: '/',
      sameSite: true,
      secure: true
    }
    this.refreshTokenOptions = {
      httpOnly: true,
      path: '/api/auth/refresh',
      sameSite: true,
      secure: true
    }
    this.config = req.config
  }

  // clear cookies when customer logs out
  clearCookies(res) {
    res.clearCookie('id_token', this.tokenOptions)
    res.clearCookie('refresh_token', this.refreshTokenOptions)
    res.clearCookie('access_token', this.tokenOptions)
  }

  // get a new access token from the refresh token
  refreshTokens(token) {
    var postData = querystring.stringify({
      'grant_type' : 'refresh_token',
      'refresh_token' : token,
      'client_id': this.config['UserPoolClientId'],
    });
    return this._callTokenApi(postData).then(res => res.body)
  }

  //get tokens from auth code
  authCode(code, host) {
    var postData = querystring.stringify({
      'grant_type' : 'authorization_code',
      'code' : code,
      'client_id': this.config['UserPoolClientId'],
      'redirect_uri': 'https://'+host
    });
    return this._callTokenApi(postData).then(res => res.body)
  }

  //set cookies based on tokens received
  setCookies(res, tokens) {
    var date = new Date();
    date.setDate(date.getDate() + 30)
    if ('id_token' in tokens) {
      this.tokenOptions['expires'] = new Date(new Date().getTime() + tokens.expires_in*1000)
      res.cookie('id_token', tokens.id_token, this.tokenOptions)
    }
    if ('refresh_token' in tokens) {
      this.refreshTokenOptions['expires'] = date
      res.cookie('refresh_token', tokens.refresh_token, this.refreshTokenOptions)
    }
    if ('access_token' in tokens) {
      this.tokenOptions['expires'] = new Date(new Date().getTime() + tokens.expires_in*1000)
      res.cookie('access_token', tokens.access_token, this.tokenOptions)
    }
  }

  //internal method to call the get tokens api
  _callTokenApi(postData) {
    var options = {
      hostname: this.config['AuthDomain'],
      port: 443,
      path: '/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Basic '+ Buffer.from(this.config['UserPoolClientId']+':'+this.config['UserPoolClientSecret']).toString('base64')
      }
    };
    //make the API call
    return httpRequest(options, postData)
  }
}

async function Authorizer(req, res, next) {
  if (!('access_token' in req.cookies)) { return res.sendStatus(403) }
  const {
    verifierFactory,
    errors: { JwtVerificationError, JwksNoMatchingKeyError },
  } = require('@southlane/cognito-jwt-verifier')

  // Put your config values here. calls https://cognito-idp.us-west-2.amazonaws.com/us-west-2_XXX/.well-known/jwks.json
  const verifierCofig = {
    region: 'us-west-2',
    userPoolId: req.config.UserPoolId,
    appClientId: req.config.UserPoolClientId,
  }
  const accessVerifier = verifierFactory(Object.assign(verifierCofig, {tokenType: 'access'}))
  const idVerifier = verifierFactory(Object.assign(verifierCofig, {tokenType: 'id'}))

  try {
    const accessTokenPayload = accessVerifier.verify(req.cookies.access_token);
    const idTokenPayload = idVerifier.verify(req.cookies.id_token);
    req.accessTokenPayload = await accessTokenPayload;
    req.idTokenPayload = await idTokenPayload;
    req.userId = req.idTokenPayload.sub
    req.isAdmin = req.idTokenPayload['custom:isAdmin']
    console.log('User is authorized')
    next()
  } catch (e) {
    console.log(e)
    res.clearCookie('access_token', this.tokenOptions)
    console.log('User is not authorized')
    return res.sendStatus(403)
  }
}

module.exports = { authRoutes, Authorizer }
