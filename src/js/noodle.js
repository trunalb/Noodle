
// socket globals
socket = new io.Socket('');
socket.connect();
//socket.send('some data');


YUI().use('node', 'event' , 'json' , function(Y){

		/* method onSave - invoked when save button is clicked
		*/
	var 	onSave = function(e){

			var nameNode = Y.one('#participantName'),
			    name = nameNode.get('value'),
			    lastRow = nameNode.get('parentNode').get('parentNode'),
		            checkBoxes = lastRow.all('input'),
			    choice = [];

			Y.each(checkBoxes, function(node){
				if( node.get('id') == 'participantName' ) return;
				choice.push(node.get('checked') ? 'y' : 'n');
				node.set('checked' , false);
			});
			
			//udpate UI
			insertLastRow(name,choice);
			
			//reset last row
			nameNode.set('value' , 'Your Name');
			
			//send over the socket! socket.io FTW!
			var sendObj = {};
			sendObj.cid = gNoodle.cid;
			sendObj.participants = {};
			sendObj.participants[name] = choice.join("|");
			socket.send(Y.JSON.stringify(sendObj));
		},
		/* method onLoad - invoked at domready
		*/
		onLoad = function(){
			//attach listener for the save button
			Y.one('#save').on('click', onSave);
			Y.one('#participantName').on('click', function(e){
				e.currentTarget.set('value' , "");
			});
		}, 
		/* method onMessage - invoked by socket.io when a msg is received
		*/
		onMessage = function(msg) {

			//decode the msg 
			var msg = Y.JSON.parse(msg);
			// check if the msg is for this client
			if( msg.cid == gNoodle.cid){
				Y.each(msg.participants, function( v , k){
					insertLastRow(k , v.split("|"));				
				});
			} else {
				Y.log("msg not for me");
			} 
		
		},

		/* method insertLastRow - inserts a last row based on user action or socket msg, assumes choice.length = child.length - 1
		*/	
		insertLastRow = function( name , choice) {
			var lastRow = Y.one('#participantName').get('parentNode').get('parentNode'),
			    newRow = lastRow.get('parentNode').insertBefore(Y.Node.create(gNoodle.row.replace("P_NAME", name)), lastRow);
			if( newRow.hasChildNodes ){
				Y.each(newRow.get('children'), function( child , index ){
					//!!ASSUMPTION about length: choice = child - 1
				
					if( index === 0 ) return; //dont replace the name again
					var childChoice = choice[index-1],
					    class = childChoice == "y" ? "yes" : "no"; 					
					child.setContent(childChoice);
					child.addClass(class);
				
				});
			} else {
				Y.log("newly inserted row doesnt have any children, perhaps the row template was wrong?");			
			}				   
		};

	//socket listener
	socket.on('message', onMessage);
	
	// bootstrap on domready
	Y.on('domready', onLoad);


});
