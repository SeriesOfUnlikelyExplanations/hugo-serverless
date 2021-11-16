/**
* Fancybox Gallery tag
*
* Syntax:
*   {% gaia {tag} %}
*/

hexo.extend.tag.register('garmin', function(arg){
  return `<p><iframe src='https://connect.garmin.com/modern/activity/embed/${arg}' 
    style=' margin: auto; display: block; border:none; overflow-y: hidden; background-color:white;
    min-width: 320px; max-width:100%; width:60%; height: 500px;'></iframe></p>`
});
