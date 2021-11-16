//https://hexo.io/api/console
const fs = require('fs');
const path = require('path');

var options = {
  usage: '<title>',
  arguments: [
    {name: 'title', desc: 'Post title'}
  ],
  desc: "adds all images to the post, so you don't forget any"
}

hexo.extend.console.register('image', options.desc, options, function(args){
  var title = args._[0];
  var regex = new RegExp( `.*${title}.*\.(md)`, 'ig' )
  let postNames = fs.readdirSync(path.join(this.source_dir, '_posts'))
    .filter(elm => {return elm.match(regex)});
  if (postNames.length != 1) {
    console.log('file name does not match')
    return
  }
  let images = fs.readdirSync(path.join(this.source_dir, '_posts', postNames[0].replace('.md','')))
    .filter(elm => {return elm.match(/.*\.(jpg|gif|png|bmp)/ig)});
  let post = fs.readFileSync(path.join(this.source_dir, '_posts', postNames[0])).toString()
  let galleryString = ''
  post += '\n\n\n'
  images.forEach(image => {
    if (!post.includes(image)) {
      let desc = image.replace(/_/g,' ').replace(/-/g,' ')
        .replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); })
        .substr(0, image.lastIndexOf("."))
        .replace(/\d+/g, '')
      let galleryTest = !isNaN(image.substr(0, image.lastIndexOf(".")).slice(-1))
      if (galleryTest) {
        if (!image.includes(galleryString)) {
          post += '%}\n\n'
        }
        if (!galleryString || !image.includes(galleryString)) {
          galleryString = image.substr(0, image.lastIndexOf("."))
            .replace(/\d+/g, '')
          post += `{% gallery "${desc}"\n`
        }
        post += `  ${image}\n`
      } else {
        if (galleryString) {
          post += '%}\n\n'
          galleryString = ''
        }
        post += `![${desc}](${image})\n\n`
      }
    }
  })
  if (galleryString) {
    post += '%}'
  }
  fs.writeFile(path.join(this.source_dir, '_posts', postNames[0]), post, function (err) {
    if (err) throw err;
    console.log('Done!');
  });
});
