	_UI.eventhandlers = {
		"temppathdragshape" : false,
		"mousex" : 0,
		"mousey" : 0,
		"ismouseovercec" : false,
		"corner" : false,
		"toolhandoff" : false,
		"lastx" : -100,
		"lasty" : -100,
		"firstx" : -100,
		"firsty" : -100,
		"uqhaschanged" : false,
		"eh_shapesel" : false,
		"eh_shaperesize" : false,
		"eh_pantool" : false,
		"eh_addpath" : false,
		"lastTool" : "pathedit",
		"isSpaceDown" : false
	};

	function initEventHandlers() {
		var tool = new pathedit();
		_UI.eventhandlers.eh_addrectoval = new newbasicShape();
		_UI.eventhandlers.eh_shapesel = new pathedit();
		_UI.eventhandlers.eh_shaperesize = new shaperesize();
		_UI.eventhandlers.eh_pantool = new pantool();
		_UI.eventhandlers.eh_addpath = new newPath();
		_UI.eventhandlers.eh_addrectoval = new newbasicShape();

		// Mouse Event Listeners
		_UI.chareditcanvas.addEventListener('mousedown', ev_canvas, false);
		_UI.chareditcanvas.addEventListener('mousemove', ev_canvas, false);
		_UI.chareditcanvas.addEventListener('mouseup',   ev_canvas, false);
		_UI.chareditcanvas.onmouseover = mouseovercec;
		_UI.chareditcanvas.onmouseout = mouseoutcec;
		_UI.chareditcanvas.addEventListener('wheel', mousewheel, false);
		if (document.getElementById("navarea_panel")) {
            document.getElementById("navarea_panel").addEventListener('wheel', function(ev){ev.stopPropagation();}, false);
        }

		// Document Key Listeners
		getEditDocument().addEventListener('keypress', keypress, false);
		getEditDocument().addEventListener('keydown', keypress, false);
		getEditDocument().addEventListener('keyup', keyup, false);

		// The general-purpose event handler.
		function ev_canvas (ev) {

			//debug("EVENTHANDLER - Raw mouse event x/y = " + ev.layerX + " / " + ev.layerY);
			mouseovercec();

			// Fixes a Chrome cursor problem
			document.onselectstart = function () { return false; };

			if (ev.layerX || ev.layerX) {
				// Firefox
				_UI.eventhandlers.mousex = ev.layerX;
				_UI.eventhandlers.mousey = ev.layerY;
			}

			if (ev.offsetX || ev.offsetX) {
				// IE, Chrome, (Opera?)
				_UI.eventhandlers.mousex = ev.offsetX;
				_UI.eventhandlers.mousey = ev.offsetY;
			}

			//debug("EV_CANVAS offsetx / offsety / layerx / layery: " +  ev.offsetX + " " + ev.offsetY + " " + ev.layerX + " " + ev.layerY);

			resetCursor();

			// Switch Tool function
			switch(_UI.selectedtool){
				case "pathedit" :
					tool = _UI.eventhandlers.eh_shapesel;
					break;
				case "shaperesize" :
					tool = _UI.eventhandlers.eh_shaperesize;
					break;
				case "pan" :
					getEditDocument().body.style.cursor = "move";
					tool = _UI.eventhandlers.eh_pantool;
					break;
				case "newpath" :
					getEditDocument().body.style.cursor = "crosshair";
					tool = _UI.eventhandlers.eh_addpath;
					break;
				case "newrect" :
				case "newoval" :
					getEditDocument().body.style.cursor = "crosshair";
					tool = _UI.eventhandlers.eh_addrectoval;
					break;
			}

			// Call the event handler of the tool.
			tool[ev.type](ev);
		}
	}


	// ---------------------------------------------------------
	// new path - adds many points to a new path
	// ---------------------------------------------------------
	function newPath(){
		this.dragging = false;
		this.firstpoint = true;
		this.currpt = {};

		this.mousedown = function (ev) {
			//debug("NEWPATH MOUSEDOWN");
			var newpoint = new PathPoint({"P":new Coord({"x":cx_sx(_UI.eventhandlers.mousex), "y":cy_sy(_UI.eventhandlers.mousey)}), "H1":new Coord({"x":cx_sx(_UI.eventhandlers.mousex-100), "y":cy_sy(_UI.eventhandlers.mousey)}), "H2":new Coord({"x":cx_sx(_UI.eventhandlers.mousex+100), "y":cy_sy(_UI.eventhandlers.mousey)}), "type":"flat", "selected":true, "useh1":false, "useh2":false});

			if(this.firstpoint) {
				//debug("NEWPATH MOUSEDOWN - tool.firstpoint=true, making a new path");
				//alert("EVENTHANDLER - NewPath mousedown - tool.firstpoint=true, making a new path");

				// make a new path with one point
				var newpath = new Path({"pathpoints":[newpoint]});
				//debug("NEWPATH MOUSEDOWN - after new path is made.");

				// make a new shape with the new path
				var newshape = addShape(new Shape({"name": ("path "+(getSelectedCharShapes().length+1)), "path": newpath}));
				newshape.path.selectPathPoint(0);
				//debug("NEWPATH MOUSEDOWN - end of firstpoint, new shape added with new path with single point.");

			} else {
				//debug("NEWPATH MOUSEDOWN - after firstpoint, placing another point");
				var currpath = ss("Event Handler New Path").path;
				var ccp = currpath.isOverControlPoint(cx_sx(_UI.eventhandlers.mousex), cy_sy(_UI.eventhandlers.mousey));
				//debug("NEWPATH MOUSEDOWN - after creating ccp: " + ccp);
				if((ccp=="P")&&(currpath.pathpoints.length > 1)){
					var p = currpath.pathpoints[0];
					var hp = _GP.projectsettings.pointsize/getView("Event Handler newPath mousedown").dz;
					if( ((p.P.x+hp) > cx_sx(_UI.eventhandlers.mousex)) && ((p.P.x-hp) < cx_sx(_UI.eventhandlers.mousex)) && ((p.P.y+hp) > cy_sy(_UI.eventhandlers.mousey)) && ((p.P.y-hp) < cy_sy(_UI.eventhandlers.mousey)) ){
						//clicked on an existing control point in this path
						//if first point - close the path
						_UI.selectedtool = "pathedit";
						_UI.eventhandlers.eh_shapesel.moving = true;
						_UI.eventhandlers.eh_shapesel.controlpoint = "H2";
						_UI.eventhandlers.toolhandoff = true;
						this.dragging = false;
						this.firstmove = false;
						_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
						_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
						redraw("Event Handler newPath mousedown");
						return;
					}
				}

				currpath.addPathPoint(newpoint, false);
				//debug("NEWPATH MOUSEDOWN - after AddPathPoint");
			}

			this.currpt = ss("Event Handler New Path").path.sp(false, "Event Handler New Path");
			this.firstpoint = false;
			this.dragging = true;
			_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
			_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;

			//debug("NEWPATH MOUSEDOWN - end of function, this.currpt:\n" + JSON.stringify(newpoint));
		};

		this.mouseup = function () {
			//debug("NEWPATH MOUSEUP");
			var currpath = ss("Event Handler New Path").path;
			currpath.winding = currpath.findWinding();
			this.dragging = false;
			this.firstmove = false;
			_UI.eventhandlers.lastx = -100;
			_UI.eventhandlers.lasty = -100;

			if(_UI.eventhandlers.uqhaschanged){
				currpath.calcMaxes();
				updateCurrentCharWidth();
				// For new shape tools, mouse up always adds to the undo-queue
				putundoq("New Path tool");
				_UI.eventhandlers.uqhaschanged = false;
				redraw("Event Handler newPath mouseup");
			}
		};

		this.mousemove = function (ev) {
			//debug("NEWPATH MOUSEMOVE");
			if(this.dragging){
				//avoid really small handles
				//debug("NEWPATH MOUSEMOVE - ps*2 = " + (_GP.projectsettings.pointsize*2) + " x / y: " + Math.abs(this.currpt.P.x-cx_sx(_UI.eventhandlers.mousex)) + " / " + Math.abs(this.currpt.P.y-cy_sy(_UI.eventhandlers.mousey)) );
				if( (Math.abs(this.currpt.P.x-cx_sx(_UI.eventhandlers.mousex)) > (_GP.projectsettings.pointsize*2)) || (Math.abs(this.currpt.P.y-cy_sy(_UI.eventhandlers.mousey)) > (_GP.projectsettings.pointsize*2)) ){
					//debug("NEWPATH MOUSEMOVE - dragging H2, this.currpt:\n" + JSON.stringify(this.currpt));
					this.currpt.useh1 = true;
					this.currpt.useh2 = true;
					this.currpt.H2.x = cx_sx(_UI.eventhandlers.mousex);
					this.currpt.H2.y = cy_sy(_UI.eventhandlers.mousey);
					this.currpt.makeSymmetric("H2");
				} else {
					//debug("NEWPATH MOUSEMOVE - no handle created yet");
				}
				_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
				_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
				_UI.eventhandlers.uqhaschanged = true;

				redraw("Event Handler newPath mousemove");
			}
		};
	}


	// ---------------------------------------------------------
	// new basic shape - adds many points to a new path
	// ---------------------------------------------------------
	function newbasicShape(){

		this.mousedown = function (ev) {

			var newshape = new Shape({"visible":false});
			newshape.name = (_UI.selectedtool=="newrect")? ("rect " + (getSelectedCharShapes().length+1)) : ("oval " + (getSelectedCharShapes().length+1));
			newshape = addShape(newshape);
			//debug("NEWBASICSHAPE MOUSEDOWN - just added the new shape");
			// these rely on ss();
			newshape.path.setLeftX(cx_sx(_UI.eventhandlers.mousex));
			newshape.path.setTopY(cy_sy(_UI.eventhandlers.mousey));


			_UI.eventhandlers.temppathdragshape = {
				"leftx": cx_sx(_UI.eventhandlers.mousex),
				"rightx": cx_sx(_UI.eventhandlers.mousex),
				"topy": cy_sy(_UI.eventhandlers.mousey),
				"bottomy": cy_sy(_UI.eventhandlers.mousey)
			};

			this.dragging = true;
			_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
			_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
			_UI.eventhandlers.firstx = _UI.eventhandlers.mousex;
			_UI.eventhandlers.firsty = _UI.eventhandlers.mousey;

			redraw("Event Handler newbasicshape mousedown");
			//debug("NEWBASICSHAPE MOUSEDOWN - after REDRAW");
		};

		this.mouseup = function () {

			var s = ss("eventHandler - newbasicshape mouseup");

			// prevent really small shapes
			if ( (Math.abs(_UI.eventhandlers.lastx - _UI.eventhandlers.firstx) < _GP.projectsettings.pointsize) &&
				(Math.abs(_UI.eventhandlers.lasty - _UI.eventhandlers.firsty) < _GP.projectsettings.pointsize) ){

				_UI.eventhandlers.temppathdragshape = {
					"leftx": s.path.leftx,
					"rightx": s.path.rightx,
					"topy": s.path.topy,
					"bottomy": s.path.bottomy
				};
			}

			if(_UI.selectedtool=="newrect"){
				//debug("NEWBASICSHAPE MOUSEUP - reading TPDS lx-ty-rx-by: " + lx + " : " + ty + " : " + rx + " : " + by);
				s.path = rectPathFromCorners(_UI.eventhandlers.temppathdragshape);
				//debug("NEWBASICSHAPE MOUSEUP - resulting path P1x/y P3x/y: " + s.path.pathpoints[0].P.x + " : " + s.path.pathpoints[0].P.y + " : " + s.path.pathpoints[2].P.x + " : " + s.path.pathpoints[2].P.y);
			} else {
				s.path = ovalPathFromCorners(_UI.eventhandlers.temppathdragshape);
			}

			s.visible = true;

			this.dragging = false;
			_UI.eventhandlers.lastx = -100;
			_UI.eventhandlers.lasty = -100;
			_UI.eventhandlers.firstx = -100;
			_UI.eventhandlers.firsty = -100;
			_UI.eventhandlers.temppathdragshape = false;
			updateCurrentCharWidth();
			putundoq("New Basic Shape tool");
			_UI.eventhandlers.uqhaschanged = false;

			clickTool("pathedit");
		};

		this.mousemove = function (ev) {
			if(this.dragging){
				var s = ss("eventHandler - newbasicshape mousemove");
				evHanShapeResize(s, "se");
				_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
				_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
				_UI.eventhandlers.uqhaschanged = true;
				redraw("Event Handler newbasicshape mousemove");
				//debug("NEWBASICSHAPE MOUSEMOVE past redraw");
			}
		};
	}


	// ---------------------------------------------------------
	// Path Edit - selects points and moves points and handles
	// ---------------------------------------------------------
	function pathedit(){
		this.moving = false;
		this.controlpoint = false;

		this.mousedown = function (ev) {
			//debug("mouse down: " + _UI.eventhandlers.mousex + ":" + _UI.eventhandlers.mousey);
			var s = ss("Path Edit - Mouse Down");
			this.controlpoint = s? s.path.isOverControlPoint(cx_sx(_UI.eventhandlers.mousex), cy_sy(_UI.eventhandlers.mousey)) : false;
			if(this.controlpoint){
				this.moving = true;
				_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
				_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
			} else if (clickSelectShape(_UI.eventhandlers.mousex, _UI.eventhandlers.mousey)){
				//clickSelectShape checks to switch the tool if need be.
				_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
				_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
			} else {
				if(s){s.path.calcMaxes();}
				clickEmptySpace();
			}
			redraw("Event Handler pathedit mousedown");
		};

		this.mouseup = function () {
			this.moving = false;
			_UI.eventhandlers.lastx = -100;
			_UI.eventhandlers.lasty = -100;

			if(_UI.eventhandlers.uqhaschanged) {
				ss("Path Edit - Mouse Up").path.calcMaxes();
				updateCurrentCharWidth();
				putundoq("Path Edit tool");
				_UI.eventhandlers.uqhaschanged = false;
				redraw("Event Handler pathedit mouseup");
			}
		};

		this.mousemove = function (ev) {
			if (this.moving) {
				var s = ss("Path Edit - Mouse Move");
				var sp = s.path.sp();
				if(_UI.eventhandlers.toolhandoff){
					sp.H2.x = cx_sx(_UI.eventhandlers.mousex);
					sp.H2.y = cy_sy(_UI.eventhandlers.mousey);
					_UI.eventhandlers.toolhandoff = false;
				}
				// Moving points if mousedown
				var dx = 0;
				var dy = 0;
				var dz = getView("Event Handler pathedit mousemove").dz;
				switch (this.controlpoint){
					case "P":
						if(!sp.P.xlock) dx = (_UI.eventhandlers.mousex-_UI.eventhandlers.lastx)/dz;
						if(!sp.P.ylock) dy = (_UI.eventhandlers.lasty-_UI.eventhandlers.mousey)/dz;
						break;
					case "H1":
						if(!sp.H1.xlock) dx = (_UI.eventhandlers.mousex-_UI.eventhandlers.lastx)/dz;
						if(!sp.H1.ylock) dy = (_UI.eventhandlers.lasty-_UI.eventhandlers.mousey)/dz;
						break;
					case "H2":
						if(!sp.H2.xlock) dx = (_UI.eventhandlers.mousex-_UI.eventhandlers.lastx)/dz;
						if(!sp.H2.ylock) dy = (_UI.eventhandlers.lasty-_UI.eventhandlers.mousey)/dz;
						break;
				}
				sp.updatePointPosition(this.controlpoint, dx, dy);

				_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
				_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
				_UI.eventhandlers.uqhaschanged = true;
				redraw("Event Handler pathedit mousemove");
			}
		};
	}


	// --------------------------------------------------
	// Shape Resize - resizes whole shapes
	// --------------------------------------------------
	function shaperesize(){
		this.dragging = false;
		this.resizing = false;
		_UI.eventhandlers.corner = false;

		this.mousedown = function (ev) {
			//debug("\nSHAPERESIZE TOOL - mouse down: " + _UI.eventhandlers.mousex + ":" + _UI.eventhandlers.mousey);
			var s = ss("eventHandler - mousedown");
			_UI.eventhandlers.corner = s? s.isOverHandle(_UI.eventhandlers.mousex, _UI.eventhandlers.mousey) : false;
			_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
			_UI.eventhandlers.firstx = _UI.eventhandlers.mousex;
			_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
			_UI.eventhandlers.firsty = _UI.eventhandlers.mousey;

			if (_UI.eventhandlers.corner){
				//debug("SHAPERESIZE TOOL: clicked on _UI.eventhandlers.corner: " + _UI.eventhandlers.corner);
				this.resizing = true;
				this.dragging = false;
				if(_GP.projectsettings.quickpathupdating){
					_UI.eventhandlers.temppathdragshape = {
						"leftx": s.path.leftx,
						"rightx": s.path.rightx,
						"topy": s.path.topy,
						"bottomy": s.path.bottomy
					};

					s.hidden = true;
				}
			} else if (clickSelectShape(_UI.eventhandlers.mousex, _UI.eventhandlers.mousey)){
				this.dragging = true;
				this.resizing = false;
				redraw("Event Handler shaperesize mousedown");
			} else {
				clickEmptySpace();
			}
		};

		this.mouseup = function () {
			//debug("Mouse Up");
			resetCursor();
			var s = ss("eventHandler - mouseup");
			if(_UI.eventhandlers.temppathdragshape){
				_UI.eventhandlers.temppathdragshape = false;
				s.hidden = false;
				_UI.eventhandlers.lastx = _UI.eventhandlers.firstx;
				_UI.eventhandlers.lasty = _UI.eventhandlers.firsty;
				evHanShapeResize(s, _UI.eventhandlers.corner);
			}

			if(this.resizing) s.path.calcMaxes();
			updateCurrentCharWidth();

			this.dragging = false;
			this.resizing = false;
			_UI.eventhandlers.lastx = -100;
			_UI.eventhandlers.lasty = -100;
			_UI.eventhandlers.firstx = -100;
			_UI.eventhandlers.firsty = -100;
			if(_UI.eventhandlers.uqhaschanged) putundoq("Path Edit tool");
			_UI.eventhandlers.uqhaschanged = false;
			redraw("Event Handler shaperesize mouseup");
			//debug("EVENTHANDLER - after shaperesize Mouse Up REDRAW");
		};

		this.mousemove = function (ev) {
			var s = ss("eventHandler - shaperesize mousemove");
			//debug("\nSHAPERESIZE TOOL - ss returned s.link: " + s.link);
			var didstuff = false;
			var dz = getView("Event Handler shaperesize mousemove").dz;
			if(s.link){
				//debug("\tSHAPERESIZE dragging linked shape");
				if(this.dragging && !s.uselinkedshapexy){
					//debug("SHAPERESIZE, this.dragging=" + this.dragging + " && !s.uselinkedshapexy=" + !s.uselinkedshapexy);
					s.xpos += round((_UI.eventhandlers.mousex-_UI.eventhandlers.lastx)/dz);
					s.ypos += round((_UI.eventhandlers.lasty-_UI.eventhandlers.mousey)/dz);
					didstuff = true;
					resetCursor();
				}
			} else {
				//debug("\tSHAPERESIZE dragging normal shape");
				if (this.dragging) {
					// Moving shapes if mousedown
					//debug("\tSHAPERESIZE - Moving Shape on Drag");
					var dx = s.xlock? 0 : dx = round((_UI.eventhandlers.mousex-_UI.eventhandlers.lastx)/dz);
					var dy = s.ylock? 0 : dy = round((_UI.eventhandlers.lasty-_UI.eventhandlers.mousey)/dz);

					s.path.updatePathPosition(dx, dy);
					resetCursor();
					didstuff = true;
				} else if (this.resizing){
					// Resizing shapes if mousedown over handle
					//debug("\tSHAPERESIZE - Resizing Shape over handle");
					evHanShapeResize(s, _UI.eventhandlers.corner);
					didstuff = true;
				}

				//Translation fidelity, passing raw canvas values
				if(s) s.isOverHandle(_UI.eventhandlers.mousex, _UI.eventhandlers.mousey);
			}

			if(didstuff){
				_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
				_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
				_UI.eventhandlers.uqhaschanged = true;
				redraw("Event Handler shaperesize mousemove");
			}
		};
	}


	// --------------------------------------------------
	// Pan - moves the canvas view
	// --------------------------------------------------
	function pantool(){
		this.dragging = false;
		this.deltax = 0;
		this.deltay = 0;

		this.mousedown = function (ev) {
			//debug("PAN TOOL - mouse down: " + _UI.eventhandlers.mousex + ":" + _UI.eventhandlers.mousey);
			var v = getView("Event Handler pantool mousedown");
			this.deltax = (_UI.eventhandlers.mousex-v.dx);
			this.deltay = (_UI.eventhandlers.mousey-v.dy);
			this.dragging = true;
		};

		this.mouseup = function () {
			//debug("PAN TOOL - Mouse Up");
			this.dragging = false;
			this.deltax = 0;
			this.deltay = 0;
		};

		this.mousemove = function (ev) {
			if (this.dragging) {
				// Moving shapes if mousedown
				setView({"dx" : (_UI.eventhandlers.mousex-this.deltax), "dy" : (_UI.eventhandlers.mousey-this.deltay)});
				redraw("Event Handler pantool mousemove");
			}
		};
	}


	// Helper Functions

	//convert canvas x-y inputs to saved shape x-y
	function cx_sx(cx){
		var v = getView("cx_sx");
		return round((cx-v.dx)/(v.dz));
	}

	function cy_sy(cy){
		var v = getView("cy_sy");
		return round((v.dy-cy)/(v.dz));
	}

	function clickEmptySpace(){
		var s = ss("Click Empty Space");
		if(s) {
			s.path.selectPathPoint(false);
			s.path.calcMaxes();
		}
		_UI.selectedshape = -1;
	}

	function evHanShapeResize(s, pcorner){
		//debug("EVHANSHAPERESIZE - " + s.name + " handle " + pcorner);
		var mx = cx_sx(_UI.eventhandlers.mousex);
		var my = cy_sy(_UI.eventhandlers.mousey);
		var lx = cx_sx(_UI.eventhandlers.lastx);
		var ly = cy_sy(_UI.eventhandlers.lasty);
		var dh, dw;

		switch(pcorner){
			case "nw":
				if(canResize("nw")){
					dh = (my-ly);
					dw = (mx-lx);
					if(_UI.eventhandlers.temppathdragshape){
						updateTPDS(dw,dh,(dw*-1),(dh*-1));
					} else {
						s.path.updatePathSize((dw*-1),dh, s.ratiolock);
						s.path.updatePathPosition(dw,0);
					}
				}
				break;

			case "n":
				if(canResize("n")){
					dh = (my-ly);
					if(_UI.eventhandlers.temppathdragshape){
						updateTPDS(0,dh,0,(dh*-1));
					} else {
						s.path.updatePathSize(0, dh, s.ratiolock);
						//s.path.updatePathPosition(0, 0);
					}
				}
				break;

			case "ne":
				if(canResize("ne")){
					dh = (my-ly);
					dw = (mx-lx);
					if(_UI.eventhandlers.temppathdragshape){
						updateTPDS(0,dh,dw,(dh*-1));
					} else {
						s.path.updatePathSize(dw,dh, s.ratiolock);
						//s.path.updatePathPosition(0,0);
					}
				}
				break;

			case "e":
				if(canResize("e")){
					dw = (mx-lx);
					if(_UI.eventhandlers.temppathdragshape){
						updateTPDS(0,0,dw,0);
					} else {
						s.path.updatePathSize(dw, 0, s.ratiolock);
						//s.path.updatePathPosition(0, 0);
					}
				}
				break;

			case "se":
				if(canResize("se")){
					dh = (ly-my)*-1;
					dw = (mx-lx);
					if(_UI.eventhandlers.temppathdragshape){
						updateTPDS(0,0,dw,dh);
					} else {
						s.path.updatePathSize(dw, (dh*-1), s.ratiolock);
						s.path.updatePathPosition(0, dh);
					}
				}
				break;

			case "s":
				if(canResize("s")){
					dh = (ly-my)*-1;
					if(_UI.eventhandlers.temppathdragshape){
						updateTPDS(0,0,0,dh);
					} else {
						s.path.updatePathSize(0, (dh*-1), s.ratiolock);
						s.path.updatePathPosition(0, dh);
					}
				}
				break;

			case "sw":
				if(canResize("sw")){
					dw = (mx-lx);
					dh = (ly-my)*-1;
					if(_UI.eventhandlers.temppathdragshape){
						updateTPDS(dw,0,(dw*-1),dh);
					} else {
						s.path.updatePathSize((dw*-1),(dh*-1), s.ratiolock);
						s.path.updatePathPosition(dw,dh);
					}
				}
				break;

			case "w":
				if(canResize("w")){
					dw = (mx-lx);
					if(_UI.eventhandlers.temppathdragshape){
						updateTPDS(dw,0,(dw*-1),0);
					} else {
						s.path.updatePathSize((dw*-1), 0, s.ratiolock);
						s.path.updatePathPosition(dw, 0);
					}
				}
				break;
		}

		//if(!_UI.eventhandlers.temppathdragshape) s.path.calcMaxes();

		//debug("EVHANSHAPERESIZE - Done lx/rx/ty/by: " + s.path.leftx + "," + s.path.rightx + "," + s.path.topy + "," + s.path.bottomy);
	}

	function updateTPDS(dx,dy,dw,dh){
		//debug("UPDATETPDS dx/dy/dw/dh = "+dx+" "+dy+" "+dw+" "+dh);
		_UI.eventhandlers.temppathdragshape.leftx += round(dx);
		_UI.eventhandlers.temppathdragshape.topy += round(dy);
		_UI.eventhandlers.temppathdragshape.rightx += round(dw+dx);
		_UI.eventhandlers.temppathdragshape.bottomy += round(dh+dy);
	}

	function canResize(pc){
		var s = ss("canResize");
		switch(pc){
			case "nw": return (!s.ylock && !s.hlock && !s.xlock && !s.wlock);
			case "n":  return (!s.ylock && !s.hlock);
			case "ne": return (!s.ylock && !s.hlock && !s.wlock);
			case "e":  return (!s.wlock);
			case "se": return (!s.hlock && !s.wlock);
			case "s":  return (!s.hlock);
			case "sw": return (!s.hlock && !s.xlock && !s.wlock);
			case "w":  return (!s.xlock && !s.wlock);
		}
		return true;
	}

	function mousewheel(event){
		var delta = event.detail? event.detail*(-120) : event.wheelDelta;	//cross browser
		var canscroll = ((_UI.navhere == "character edit") || (_UI.navhere == "linked shapes"));
		canscroll = canscroll && (document.getElementById('dialog_box').style.display != 'block');

		if(canscroll){
		//debug("MOUSEWHEEL: canscroll=true and delta=" + delta );
			if(delta > 0){ viewZoom(1.1); }
			else { viewZoom(0.9); }
		}
	}

	function mouseovercec() {
		//debug("MOUSEOVERCEC");
		_UI.eventhandlers.ismouseovercec = true;
		// Fixes a Chrome cursor problem
		document.onselectstart = function () { return false; };
	}

	function mouseoutcec() {
		//debug("MOUSEOUTCEC");
		_UI.eventhandlers.ismouseovercec = false;
		// Fixes a Chrome cursor problem
		document.onselectstart = function () {};
		resetCursor();
	}

	function keyup(event){
		if(!isOnEditPage()) return;

		var kc = getKeyFromEvent(event);
		//debug("Key Up:\t\t" + kc + " from " + event.which);
		var eh = _UI.eventhandlers;

		// Space
		if(kc=== 'space' && eh.ismouseovercec){
			_UI.selectedtool = eh.lastTool;
			eh.isSpaceDown = false;
			resetCursor();
			redraw("Event Handler - Keyup Spacebar for pan toggle");
		}
	}

	function keypress(event){
		if(!isOnEditPage()) return;

		var s = ss("keypress event");
		var eh = _UI.eventhandlers;

		var kc = getKeyFromEvent(event);
		//debug("Key Press:\t" + kc + " from " + event.which);


		// Space
		if(kc === 'space' && eh.ismouseovercec){
			if(!eh.isSpaceDown){
				eh.lastTool = _UI.selectedtool;
				_UI.selectedtool = "pan";
				eh.isSpaceDown = true;
				getEditDocument().body.style.cursor = "move";
				redraw("Event Handler - Keydown Spacebar for pan toggle");
			}
		}

		// ?
		if(event.shiftKey && kc==='?'){
			event.preventDefault();
			toggleKeyboardTips();
		}

		// z
		if(kc==='undo' || (event.ctrlKey && kc==='z')){
			event.preventDefault();
			pullundoq();
		}

		// del
		if(kc==='del'){
			event.preventDefault();
			deleteShape();
			putundoq("Delete Shape");
			redraw("Keypress DEL");
		}

		// c
		if(event.ctrlKey && kc==='c'){
			event.preventDefault();
			copyShape();
		}

		// v
		if(event.ctrlKey && kc==='v'){
			event.preventDefault();
			pasteShape();
			putundoq("Paste Shape");
			redraw("Paste Shape");
		}

		// s
		if(event.ctrlKey && kc==='s'){
			event.preventDefault();
			saveGlyphrProjectFile();
		}

		// plus
		if(event.ctrlKey && kc==='plus'){
			event.preventDefault();
			viewZoom(1.1);
			redraw("Zoom Keyboard Shortcut");
		}

		// minus
		if(event.ctrlKey && kc==='minus'){
			event.preventDefault();
			viewZoom(0.9);
			redraw("Zoom Keyboard Shortcut");
		}

		// 0
		if(event.ctrlKey && kc==='0'){
			event.preventDefault();
			setView(clone(_UI.defaultview));
			redraw("Zoom Keyboard Shortcut");
		}

		// up
		if(kc==='up'){
			event.preventDefault();
			nudge(0,1);
		}

		// down
		if(kc==='down'){
			event.preventDefault();
			nudge(0,-1);
		}

		// left
		if(kc==='left'){
			event.preventDefault();
			nudge(-1,0);
		}

		// right
		if(kc==='right'){
			event.preventDefault();
			nudge(1,0);
		}
	}

	function getKeyFromEvent (event) {
		//debug("GETKEYFROMEVENT - keyCode:" + event.keyCode + "\twhich:" + event.which);
		var specialChars = {
			8:'backspace', 9:'tab', 13:'enter', 16:'shift', 17:'ctrl', 18:'alt', 20:'capslock', 26:'undo', 27:'esc', 32:'space', 33:'pageup', 34:'pagedown', 35:'end', 36:'home', 37:'left', 38:'up', 39:'right', 40:'down', 45:'ins', 46:'del', 91:'meta', 93:'meta', 187:'plus', 189:'minus', 224:'meta'
		};
		return specialChars[parseInt(event.which)] || String.fromCharCode(event.which).toLowerCase();
	}

	function isOnEditPage() {
		return (_UI.navhere==='character edit' || _UI.navhere==='linked shapes');
	}

	function nudge(dx, dy) {
		var s = ss("Nudge");
		var sp, mx, my;
		if(s){
			mx = (dx * _GP.projectsettings.spinnervaluechange);
			my = (dy * _GP.projectsettings.spinnervaluechange);
			sp = s.path.sp();
			if(sp){
				sp.updatePointPosition('P', mx, my);
			} else {
				s.path.updatePathPosition(mx, my);
			}
			redraw("Nudge");
		}
	}



