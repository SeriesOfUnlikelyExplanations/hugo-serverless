
async function loadComments(post_path) {
  //call api
  var my_url = new URL(window.location.href);
  var my_url = new URL('https://blog.always-onward.com');
  const request_url = new URL( '/api/get_comments', my_url);
  request_url.search = new URLSearchParams({post: post_path }).toString();
  const commentFeed = await fetch(request_url).then((res) => res.json())
  console.log(commentFeed);
  
  var commentFeedHTML = ''
  commentFeed.forEach((comment) => {
    commentFeedHTML += '<article class="read-next-card"><div><b style="color:firebrick">'
    commentFeedHTML += comment.author
    commentFeedHTML += '</b> says:</div><div>'
    commentFeedHTML += comment.content
    commentFeedHTML += '</div></article>'
  });
  document.getElementById('comments-feed').innerHTML = commentFeedHTML
}
function login() {
  var my_url = new URL(window.location.href);
  var code = my_url.searchParams.get("code");
  if (code != null) {
    var request_url = new URL('/api/auth/calback', new URL(window.location.href));
    request_url.search = new URLSearchParams({code: code}).toString();
  } else {
    var request_url = new URL('/api/auth/refresh', my_url);
  }
  return fetch(request_url)
  .then((res) => res.json())
  .then((data) => {
    console.log(data);
    if (data.login) {
      document.getElementById('write-comment').hidden = false;
    } else {
      document.getElementById('write-comment').innerHTML = '<a href="'+data.redirect_url+'">Login to leave a comment!</a>'
      document.getElementById('write-comment').hidden = false;
      document.getElementById('write-comment').onClick = function(e) {
        e.preventDefault();
        sessionStorage.setItem('redirect',location.href);
        location.replace($(this).attr('href'));
      };
    }
  });
}
function formSubmit(post_path) {
  var url = "/api/post_comment";
  var request = new XMLHttpRequest();
  request.open('POST', url, true);
  request.onload = function() { // request successful
    console.log(request.responseText);
    loadComments(post_path)
  };
  request.onerror = function() {
    console.log(request.responseText);
  };
  request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  request.send(JSON.stringify({
    content: document.getElementById("content").value,
    postPath: post_path
  }));
}
