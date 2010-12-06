var jade = require('jade');

jade.renderFile(__dirname + '/views/layout.jade', {debug:true},function(err, html){
    if (err) throw err;
    console.log(html);
});
