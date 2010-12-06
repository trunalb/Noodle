/* NOoDlE -- doodle on node
*/

var 	express = require('express'),
	app = express.createServer(),
	ws = require('socket.io').listen(app),
	sys = require('sys'),
	assets  = __dirname + '/assets',
	mongodb = require('mongodb'),
	Db= mongodb.Db,
    	Server= mongodb.Server,
	noodlesCollection = "";//all collection of noodles from mongoDb

// mongodb constants
var HOST = "127.0.0.1",
    PORT  = "27017";



// init : set things...
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use('/js', express.staticProvider({root: __dirname + '/src/js/' })); 
app.use('/css', express.staticProvider({root: __dirname + '/src/css/' })); 

//mongodb init
var noodleDb = new Db('noodleDb', new Server(HOST,PORT,{auto_reconnect: true},{}));
sys.puts("Opening MongoDB connection");
noodleDb.open(function(){
	console.log("db opened");

	noodleDb.collection('noodles' , function(e,nood){
		console.log("collection opened");
		
		noodlesCollection = nood;// store the reference outside of the closure to reference it later
	});

});

noodleDb.addListener('error', function(err){
	sys.puts("there was an error" + err);
	sys.puts("Have you started mongodb? Try ./mongod ");
});



//this will populate req.body
app.use(express.bodyDecoder());

//fetch from database

function fetchRecords(req,res,next){
	console.log("fetching records for id " + req.params.id);

/*var dbObj = {
	cid : "1234",
	cols : "little India|bombay garden|thai",
	participants : {
				trunal : "y|y|y",
				namrata : "y|n|n",
				sagar : "n|n|y"
			}
	};

	dbObj.cid = req.params.id;*/

	noodlesCollection.find({cid : req.params.id + ""},{},function(e,res){

		//res should be just one		
		res.each(function(e,msg){
			console.log(msg);		
		
			req.noodle = msg;
			//call the next handler
			next();
		});

	});
}

//expressJS code -------------------------

app.get('/', function (req,res){
	
	sys.puts("root request received");
	var options = {
	    locals: {
		init:{}
	    }
	};

	res.render('layout' , options);
});

app.get('/:id',fetchRecords, function(req,res){
	console.log("Serving the request for id " + req.params.id);
	//res.render('init', {});
	var options = {
		locals : {
			start : req.noodle
		}
	};
	
	sys.puts("Rendering with these options : " + JSON.stringify(options));
	res.render('layout' ,options);
});

app.post('/', function(req,res){
	var	columns = [],
		options = req.body.options || {}, 		
		newHash = new Date().getTime();

	sys.puts("Post received");
	sys.puts(sys.inspect(options));	
	
	for ( key in options ) {
		if( options[key] != '') {
			sys.puts(options[key]);
			columns.push(options[key]);		
		}	
	}	
	
	if( columns.length !=0 ){
		sys.puts(columns.join("|"));
	} else {
		sys.puts("No column values received!");	
	}

	//create an entry in the db
	var noodleObj = {
		cid : newHash + "", //somehow mongo needs a string, duh
		cols : columns.join("|")	
	};
	
	noodlesCollection.insert(noodleObj);

	res.redirect('/' + newHash );
});

app.listen(8125);


//socketIO code -----------------------------
ws.on('connection' , function(client){
	client.on('message', function(msg){
		
		sys.puts("client update received : "  + msg);
		//notify clients			
		client.broadcast(msg);

		msg = JSON.parse(msg);

		//update the db with the latest info
		noodlesCollection.find({ cid: msg.cid+"" },{},function(e,res){

			res.each(function(e,record){

				if( record != null ){				
					console.log("record is ");
					sys.puts(JSON.stringify(record));
					var oldParticipants = record.participants || {},
					    newParticipants = msg.participants || {};
				
					//error handling needed
					for( key in newParticipants ){
						oldParticipants[key] = newParticipants[key];
					}

					noodlesCollection.update({cid : record.cid }, {$set:{participants:oldParticipants}} , false , function(){});
				}
	
			});

		});

	});

});
