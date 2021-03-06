	function loadPage_importsvg(){
		debug("LOADING PAGE >> loadpage_importsvg");
		var content = "<div class='pagecontent textpage'><h1>Import SVG</h1>" +
		"<h2 id='importsvgselecttitle'>Target character: "+getSelectedCharName()+"</h2>"+
		"<h2 style='margin-bottom:10px;'>Scale options</h2>"+
		"<input type='checkbox' checked onchange='_UI.importsvg.scale=this.checked;'>Scale imported SVG path<br>"+
		"<div style='padding-left:20px;' disabled='"+_UI.importsvg.scale+"'>"+
		"<input type='checkbox' onchange='_UI.importsvg.ascender=this.checked;'>Has ascender<br>"+
		"<input type='checkbox' onchange='_UI.importsvg.descender=this.checked;'>Has descender<br>"+
		"</div><br>"+
		"<h2 style='display:inline;'>Paste SVG code</h2>"+
		"<input type='button' class='button buttonsel' value='Import SVG' style='display:inline; padding-left:20px; padding-right:20px;' onclick='importSVG_importCode();'>"+
		"<input type='button' class='button' value='clear' style='display:inline; margin-left:20px; padding-left:20px; padding-right:20px;' onclick='importSVG_clearCode();'>"+
		"<input type='button' class='button' value='go to character edit' style='display:inline; margin-left:20px; padding-left:20px; padding-right:20px;' onclick='_UI.navhere=\"character edit\"; navigate();'>"+
		"<br><textarea id='svgcode'>"+

		'<path fill="h" d="M17,11c-4.8,0-9.7,1.9-13,5.6V4.1h2V0H0v40.1h6V36H4v-8c0-8.9,6.7-13,13-13s13,4.1,13,13v12h4.1V28C34.1,16.8,25.5,11,17,11z"/>'+
		// '<path fill="r" d="M6,29.1H0V17C0,10.6,2.8,5.4,8,2.4c5.5-3.2,12.6-3.2,18,0c5.2,3,8,8.2,8,14.7h-4c0-5-2.1-8.9-6-11.2c-4.2-2.4-9.8-2.4-14,0c-3.9,2.2-6,6.2-6,11.2v8h2V29.1z"/>'+

		"</textarea><br>"+
		'<div id="svgerrormessagebox">' +
		'<table cellpadding=0 cellspacing=0 border=0><tr>' +
		'<td class="svgerrormessageleftbar"><input type="button" class="svgerrormessageclosebutton" value="&times;" onclick="document.getElementById(\'svgerrormessagebox\').style.display=\'none\';"></td>' +
		'<td id="svgerrormessagecontent"></td>' +
		'</tr></table></div>'+
		"<br><br></div>";
		getEditDocument().getElementById("mainwrapper").innerHTML = content;
		importSVG_selectChar("0x0061");
	}

	function importSVG_clearCode() {
		var t = document.getElementById('svgcode');
		t.innerHTML = '';
		t.focus();
	}

	function importSVG_selectChar(cid){
		debug("IMPORTSVG_SELECTCHAR - selecting " + cid);
		selectChar(cid, true);
		document.getElementById('importsvgselecttitle').innerHTML = "Target character: "+getSelectedCharName();
		update_NavPanels();
	}

	function importSVG_importCode() {
		var svgin = document.getElementById('svgcode').value;
		//debug("IMPORTSVG_IMPORTCODE - svgin is " + JSON.stringify(svgin));
		var newshapes = [];

		if(svgin.indexOf('<path') > -1){
			var pathtag_arr = [];
			var pathtag_count = 0;
			var pathtag_startpos = 0;
			var pathtag_endpos = 0;
			//debug("IMPORTSVG_IMPORTCODE - indexOf <path is " + svgin.indexOf('<path '));

			// Get Path Tags
			while(svgin.indexOf('<path', pathtag_startpos)>-1){
				//debug("IMPORTSVG_IMPORTCODE - indexOf <path is " + svgin.indexOf('<path', pathtag_startpos));
				pathtag_startpos = svgin.indexOf('<path', pathtag_startpos);
				pathtag_endpos = svgin.indexOf('/>', pathtag_startpos) + 2;
				pathtag_arr[pathtag_count] = svgin.substring(pathtag_startpos, pathtag_endpos);
				pathtag_startpos = pathtag_endpos;
				if(pathtag_count > 100) break; else pathtag_count++;
			}
			//debug("IMPORTSVG_IMPORTCODE - pathtag_arr is " + JSON.stringify(pathtag_arr));

			// Convert Tags to Glyphr Shapes
			var data;
			for(var p=0; p<pathtag_arr.length; p++){
				data = pathtag_arr[p];
				data = data.substring(data.indexOf(' d=')+4);
				var close = Math.max(data.indexOf("'"), data.indexOf('"'));
				data = data.substring(0, close);
				data.replace('Z','z');
				data = data.split('z');

				for(var d=0; d<data.length; d++){
					if(data[d].length){
						importSVG_convertPathTag(data[d]); 
						putundoq("Imported Path from SVG");
					}
				}
			}

		} else {
			importSVG_errorMessage("Could find no &lt;path&gt; tags to import");
		}

		// Redraw
		update_NavPanels();
		//for(var i=0; i<newshapes.length; i++) newshapes[i].path.flipNS();
		update_NavPanels();
	}


	function importSVG_convertPathTag(data) {
		// just path data
		debug("IMPORTSVG_CONVERTPATHTAG - data is \n" + data);

		// Parse in the path data, comma separating everything
		data = data.replace(/(\s)/g, ',');
		data = data.replace(/-/g, ',-');
		var curr = 0;
		while(curr < data.length){
			if(importSVG_isPathCommand(data.charAt(curr))){
				data = (data.slice(0,curr)+','+data.charAt(curr)+','+data.slice(curr+1));
				curr++;
			}
			if(curr > 99999) {
				importSVG_errorMessage("Data longer than 100,000 characters is not allowed."); 
				return; 
			} else {
				curr++;
			}
		}

		if(data.charAt(0) === ',') data = data.slice(1);
		while(data.indexOf(',,') > -1) data = data.replace(',,',',');

		debug("IMPORTSVG_CONVERTPATHTAG - parsed path data as \n" + data);

		// Parse comma separated data into commands / data chunks
		data = data.split(',');
		var chunkarr = [];
		var commandpos = 0;
		var command;
		var dataarr = [];
		curr = 1;
		while(curr <= data.length){
			if(importSVG_isPathCommand(data[curr])){
				dataarr = data.slice(commandpos+1, curr);
				command = data[commandpos];
				for(var i=0; i<dataarr.length; i++) dataarr[i] = Number(dataarr[i]);
				chunkarr.push({"command":command, "data":dataarr});
				commandpos = curr;
			}
			curr++;
		}
		// Fencepost
		dataarr = data.slice(commandpos+1, curr);
		command = data[commandpos];
		for(var j=0; j<dataarr.length; j++) dataarr[j] = Number(dataarr[j]);
		chunkarr.push({"command":command, "data":dataarr});

		debug("IMPORTSVG_CONVERTPATHTAG - chunkarr data is \n" + json(chunkarr, true));

		// Turn the commands and data into Glyphr objects
		var patharr = [];
		for(var c=0; c<chunkarr.length; c++){
			debug("\nHandling Path Chunk " + c);
			patharr = importSVG_handlePathChunk(chunkarr[c], patharr, (c===chunkarr.length-1));
		}

		// Combine 1st and last point
		var fp = patharr[0];
		var lp = patharr[patharr.length-1];
		if((fp.P.x===lp.P.x)&&(fp.P.y===lp.P.y)){
			fp.H1.x = lp.H1.x;
			fp.H1.y = lp.H1.y;
			fp.useh1 = lp.useh1;
			patharr.pop();
			fp.resolvePointType();
		}

		var newshape = new Shape({"path":new Path({"pathpoints":patharr})});
		newshape.path.calcMaxes();

		//debug("IMPORTSVG_PARSEPATHTAG - unscaled shape: \n" + json(newshape));

		// Scale
		if(_UI.importsvg.scale){
			var height = _GP.projectsettings.xheight;
			var top = _GP.projectsettings.xheight;
			if(_UI.importsvg.ascender){
				height = _GP.projectsettings.ascent;
				top = _GP.projectsettings.ascent;
			}
			if(_UI.importsvg.descender){
				height += (_GP.projectsettings.upm - _GP.projectsettings.ascent);
			}

			newshape.path.updatePathSize((height - (newshape.path.topy - newshape.path.bottomy)), 0, true);
			newshape.path.setTopY(top);
		}

		return addShape(newshape);
	}

	function importSVG_isPathCommand(c){
		if('MmLlCcSsZzHhVv'.indexOf(c) > -1) return c;
		return false;
	}

	function importSVG_handlePathChunk(chunk, patharr, islastpoint){
		/*
			Path Instructions: Capital is absolute, lowercase is relative
			M m		MoveTo
			L l		LineTo
			H h		Horizontal Line
			V v		Vertical Line
			C c		Bezier (can be chained)
			S s		Smooth Bezier
			Z z		Close Path

			Possibly fail gracefully for these by moving to the final point
			A a		ArcTo (don't support)
			Q q		Quadratic Bezier (don't support)
			T t		Smooth Quadratic (don't support)
		*/

		var cmd = chunk.command;
		var p,h1,h2;
		var lastpoint = patharr[patharr.length-1] || new PathPoint({"P":new Coord({"x":0,"y":0})});
		var prevx = round(lastpoint.P.x, 3);
		var prevy = round(lastpoint.P.y, 3);

		debug("\tprevious point x y\t"+prevx+" "+prevy);
		debug("\t"+cmd+" ["+chunk.data+"]");


		// handle command types
		if(cmd === 'M' || cmd === 'm' || cmd === 'L' || cmd === 'l' || cmd === 'H' || cmd === 'h' || cmd === 'V' || cmd === 'v'){

			var xx = prevx;
			var yy = prevy;

			switch(cmd){
				case 'L':
				case 'M':
					// ABSOLUTE move to
					// ABSOLUTE line to
					xx = chunk.data[0];
					yy = chunk.data[1];
					break;
				case 'l':
				case 'm':
					// relative line to
					// relative move to
					xx = chunk.data[0] + prevx;
					yy = chunk.data[1] + prevy;
					break;
				case 'H':
					// ABSOLUTE horizontal line to
					xx = chunk.data[0];
					break;
				case 'h':
					// relative horizontal line to
					xx = chunk.data[0] + prevx;
					break;
				case 'V':
					// ABSOLUTE vertical line to
					yy = chunk.data[0];
					break;
				case 'v':
					// relative vertical line to
					yy = chunk.data[0] + prevy;
					break;
			}

			xx = round(xx, 3);
			yy = round(yy, 3);

			debug("\tlinear end xx yy\t" + xx + " " + yy);
			p = new Coord({"x":xx, "y":yy});

			lastpoint.useh2 = false;
			patharr.push(new PathPoint({"P":p, "H1":clone(p), "H2":clone(p), "type":"corner", "useh1":false, "useh2":!islastpoint}));

		} else if(cmd === 'C' || cmd === 'c'){
			// ABSOLUTE bezier curve to
			// relative bezier curve to
				// The three subsiquent x/y points are relative to the last command's x/y point
				// relative x/y point (n) is NOT relative to (n-1)

			var currdata = [];
			// Loop through (potentially) PolyBeziers
			while(chunk.data.length){
				// Grab the next chunk of data and make sure it's length=6
				currdata = [];
				currdata = chunk.data.splice(0,6);
				if(currdata.length % 6 !== 0) {
					importSVG_errorMessage('Bezier path command (C or c) was expecting 6 arguments, was passed ['+currdata+']\n<br>Failing "gracefully" by filling in default data.');
					while(currdata.length<6) { currdata.push(currdata[currdata.length-1]+100); }
				}

				// default absolute for C
				//debug("\tCc getting data values for new point px:" + currdata[4] + " py:" + currdata[5]);

				lastpoint.H2 = new Coord({"x":round(currdata[0], 3), "y":round(currdata[1], 3)});
				lastpoint.useh2 = true;
				lastpoint.resolvePointType();
				h1 = new Coord({"x":round(currdata[2], 3), "y":round(currdata[3], 3)});
				p = new Coord({"x":round(currdata[4], 3), "y":round(currdata[5], 3)});

				if (cmd === 'c'){
					// Relative offset for c
					lastpoint.H2.x += prevx;
					lastpoint.H2.y += prevy;
					h1.x += prevx;
					h1.y += prevy;
					p.x += prevx;
					p.y += prevy;
				}

				debug("\tbezier end Px Py\t"+p.x+" "+p.y+"\tH1x H1y:"+h1.x+" "+h1.y);

				patharr.push(new PathPoint({"P":p, "H1":h1, "H2":p}));
			}

		} else if (cmd === 'S' || cmd === 's'){
			lastpoint.makeSymmetric('H1');
			lastpoint.useh2 = true;

			h1 = new Coord({"x":round(chunk.data[0], 3), "y":round(chunk.data[1], 3)});
			p = new Coord({"x":round(chunk.data[2], 3), "y":round(chunk.data[3], 3)});

			if (cmd === 's'){
				// Relative offset for s
				h1.x += prevx;
				h1.y += prevy;
				p.x += prevx;
				p.y += prevy;
			}

			debug("\tbezier result px:"+p.x+" py:"+p.y+" h1x:"+h1.x+" h1y:"+h1.y);

			patharr.push(new PathPoint({"P":p, "H1":h1, "H2":p, "type":"symmetric"}));

		} else if(cmd === 'Z' || cmd === 'z'){
			// End Path
		} else {
			importSVG_errorMessage("Unrecognized path command '"+cmd+"'");
		}

		if(islastpoint) patharr[patharr.length-1].resolvePointType();
		return patharr;
	}

	function importSVG_errorMessage(msg) {
		console.error("Import SVG Error - " + msg);
		var msgcon = document.getElementById('svgerrormessagecontent');
		var msgbox = document.getElementById('svgerrormessagebox');
		msgcon.innerHTML = msg;
		msgbox.style.display = 'block';
	}