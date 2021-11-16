/**
* Fancybox Gallery tag
*
* Syntax:
*   {% gallery image1 image2, etc %}
*/

hexo.extend.tag.register('gallery', function(args, content){
  var title = args.shift()
  var titleHtml = `<span class="caption">${title}</span>`
  var mainHtml = '<div id="mainCarousel" class="carousel mb-4 w-10/12 max-w-xl mx-auto">'
  const baseUrl = '/' + this.path
  for (const arg of args) {
    var dotIndex = arg.lastIndexOf("/");
    if (dotIndex != -1) {
      var smallurl = baseUrl + arg.substring(0, dotIndex+1) + 'small_' + this.src.substring(dotIndex+1)
    } else {
      var smallurl = baseUrl + 'small_' + arg
    }
    mainHtml += `<div class="carousel__slide"><img class="gallery_img" src="${smallurl}" /></div>`
  }
  mainHtml += '</div>'
  return mainHtml + titleHtml
});


