// route - api/auth
var querystring = require('querystring');
var { httpRequest } = require('../components');
const url = require('url');

module.exports = (api, opts) => {

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


