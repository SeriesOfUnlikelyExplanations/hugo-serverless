'use strict';

const data = {
  logged_out: {
    login: false,
    redirect_url: "https://auth.always-onward.com/login?client_id=clientId&response_type=code&scope=email+openid+phone+profile&redirect_uri=https://url/api/auth/callback"
  },
  logged_in: {
    "login":true,
    "redirect_url":"/api/auth/logout"
  },
  gallery_html: `<div id="carousel0" class="carousel" duration="100" items="1">
    <ul>
      <li id="c0_slide1" style="min-width: 100%; padding-bottom: 500px"><img src="ready1.jpg" alt=""></li>
      <li id="c0_slide2" style="min-width: 100%; padding-bottom: 500px"><img src="ready2.jpg" alt=""></li> 
    </ul>
    <ol>
      <li><a href="#c0_slide1"></a></li>
      <li><a href="#c0_slide2"></a></li>
    </ol>
    <div class="prev">‹</div>
    <div class="next">›</div>
  </div>`
}

export default data; 
