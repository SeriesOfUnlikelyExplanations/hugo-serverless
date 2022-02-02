'use strict';

const data = {
  logged_out: {
    login: false,
    redirect_url: "https://auth.always-onward.com/login?client_id=clientId&response_type=code&scope=email+openid+phone+profile&redirect_uri=https://url/api/auth/callback"
  },
  logged_in: {
    "login":true,
    "redirect_url":"/api/auth/logout"
  }
}

export default data; 
