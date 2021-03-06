
	function loadPage_openproject(){
		debug("LOADING PAGE >> loadPage_openproject");
		var ct = "<div class='pagecontent textpage'><h1>Open Project</h1>" +
		"<h2>But wait!</h2>If you open a new project, your current project will be lost.  Be sure to download a Glyphr " +
		"project file if you want to save your current project.<br><br>" +
		"<input type='button' class='button'style='padding:10px;' value='Save current project' onclick='saveGlyphrProjectFile();'/><br><br>" +
		"<h2>Okay, now...</h2>";

		ct += importOrCreateNew();
		ct += "</div>";


		getEditDocument().getElementById("mainwrapper").innerHTML = ct;
		getEditDocument().getElementById("droptarget").addEventListener('dragover', handleDragOver, false);
		getEditDocument().getElementById("droptarget").addEventListener('drop', handleDrop, false);
	}

	function loadPage_firstrun(){
		debug("LOADING PAGE >> loadPage_firstrun");
		var ct = "<div class='splashscreen textpage'><canvas id='splashscreencanvas' height=494 width=800></canvas>";
		ct += "<div class='splashver'>"+_UI.thisGlyphrStudioVersion+"<br><br>";
		ct += "For more informaiton visit <a href='http://www.glyphrstudio.com' target=_new>www.glyphrstudio.com</a><br>";
		ct += "Glyphr Studio is licensed under a <a href='https://www.gnu.org/licenses/gpl.html' target='_new'>GNU General Public License</a>.<br>" +
			"Which is a free / open source 'copyleft' license. You are free to use, distribute, and modify Glyphr Studio as long as " +
			"this license and it's freeness stays intact.";
		ct += "</div>";
		ct += importOrCreateNew();
		ct += "</div>";

		var mp = getEditDocument().getElementById("mainwrapper");
		mp.innerHTML = ct;
		mp.style.marginLeft = "0px";
		getEditDocument().getElementById("droptarget").addEventListener('dragover', handleDragOver, false);
		getEditDocument().getElementById("droptarget").addEventListener('drop', handleDrop, false);

		drawSplashScreen();
	}

	function handleDrop(evt) {
		evt.stopPropagation();
		evt.preventDefault();

		var f = evt.dataTransfer.files[0]; // FileList object only first file
		var reader = new FileReader();
		var fcontent = "";

		document.getElementById("droptarget").innerHTML = "Loading File...";
		// Closure to capture the file information.
		reader.onload = (function(theFile) {
			return function(e) {
				//console.log(reader.result);
				fcontent = JSON.parse(reader.result);
				var v = fcontent.projectsettings.version;
				if(v){
					if(v.split(".")[1] !== 4){
						fcontent = migrateFromBetaThreeToFour(fcontent);
						debug(fcontent);
					}
					hydrateGlyphrProject(fcontent);
					//debug("Loading project; " + _GP.projectsettings.name);
				} else {
					document.getElementById("droptarget").innerHTML = "drop file here...";
					alert("File does not appear to be a Glyphr Project, try again...");
				}
			};
		})(f);

		reader.readAsText(f);

	}

	function migrateFromBetaThreeToFour(fc){

		newfc = {
			"linkedshapes" : fc.linkedshapes,
			"opentypeproperties" : fc.opentypeproperties,
			"projectsettings" : _UI.default_GP.projectsettings,
			"fontchars" : []
		};

		for(var e in fc.projectsettings){
			if(newfc.projectsettings.hasOwnProperty(e)){
				newfc.projectsettings[e] = fc.projectsettings[e];
			}
		}

		var tc, hex;
		for(var i=0; i<fc.fontchars.length; i++){
			tc = fc.fontchars[i];
			if(tc){
				hex = "0x00"+tc.cmapcode.substr(2);
				newfc.fontchars[hex] = tc;
				newfc.fontchars[hex].charhtml = hexToHTML(hex);
			}
		}

		return newfc;
	}

	function hydrateGlyphrProject(data) {
		_GP = clone(_UI.default_GP);

		// Project Settings
		if(data.projectsettings) _GP.projectsettings = clone(data.projectsettings);

		// Open Type Properties
		if(data.opentypeproperties) _GP.opentypeproperties = clone(data.opentypeproperties);

		// Linked Shapes
		for (var ssid in data.linkedshapes) {
			if(data.linkedshapes.hasOwnProperty(ssid)){
				_GP.linkedshapes[ssid] = new LinkedShape(data.linkedshapes[ssid]);
			}
		}

		// Characters
		for (var ch in data.fontchars) {
			if(data.fontchars.hasOwnProperty(ch)){
				_GP.fontchars[ch] = new Char(data.fontchars[ch]);
			}
		}

		//debug("\n\nHDRYATEGLYPHRPROJECT: PASSED \n" + JSON.stringify(data));
		//debug("\n\nHDRYATEGLYPHRPROJECT: HYDRATED \n" + JSON.stringify(_GP));

		finalizeGlyphrProject();
	}

	function handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
	}


	function importOrCreateNew(){
		var con = "<table style='width:100%;'><tr><td style='padding-right:50px; width:45%;'>"+
						"<h3>Load an existing Glyphr Project</h3>"+
						"<div id='droptarget'>drop file here...</div>"+
					"</td><td style='width:9%'>&nbsp;</td>"+
					"</td><td style='width:45%;'>"+
						"<h3>Start a new Glyphr Project</h3>"+
						"Project name: &nbsp; <input id='newprojectname' type='text' value='My Font'/><br>"+
						"<input type='button' class='buttonsel' value=' Start a new font from scratch ' onclick='newGlyphrProject()'><br><br>"+
					"</td></tr></table>";

		return con;
	}

	function newGlyphrProject(){
		var fn;
		if(document.getElementById("newprojectname") && document.getElementById("newprojectname").value){
			fn = document.getElementById("newprojectname").value;
		} else {
			fn = "My Font";
		}

		_GP = clone(_UI.default_GP);

		_GP.projectsettings.name = fn;
		_GP.opentypeproperties.name[1].val = fn;
		_GP.opentypeproperties.name[3].val = (fn + " 1.0");
		_GP.opentypeproperties.name[4].val = fn;
		_GP.opentypeproperties.name[6].val = fn;
		setOTprop("cff", "FullName", fn);
		setOTprop("cff", "FamilyName", fn);

		setOTprop("head", "created", ttxDateString());
		_GP.projectsettings.version =  _UI.thisGlyphrStudioVersion;

		_GP.fontchars = {};
		getChar("0x0020", true).isautowide = false;
		getChar("0x0020", true).charwidth = _GP.projectsettings.upm/2;
		
		_GP.linkedshapes = {};
		_GP.linkedshapes["id0"] = new LinkedShape({"shape": new Shape({})});

		finalizeGlyphrProject();
	}




	function finalizeGlyphrProject(){
		//debug("FINALIZEGLYPHRPROJECT - start of function");
		_UI.charcurrstate = clone(_GP.fontchars);
		_UI.linkcurrstate = clone(_GP.linkedshapes);

		if(!isval(_GP.projectsettings.linkedshapecounter)){
			_GP.projectsettings.linkedshapecounter = 0;
		}

		_UI.shownlinkedshape = getFirstLinkedShape();

		resetThumbView();

		_UI.navhere = "character edit";
		navigate();
	}