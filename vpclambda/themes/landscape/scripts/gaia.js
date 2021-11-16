/**
* Fancybox Gallery tag
*
* Syntax:
*   {% gaia {tag} %}
*/

hexo.extend.tag.register('gaia', function(arg){
  return `<p><iframe src='https://www.gaiagps.com/public/${arg}?embed=True'
    style=' margin: auto; display: block; border:none; overflow-y: hidden; background-color:white;
      min-width: 320px; max-width:100%; width:60%;
      height: 420px;'
    scrolling='no' seamless='seamless'></iframe></p>`
});
