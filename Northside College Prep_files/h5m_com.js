window.requestAnimFrame = (function(){
return  window.requestAnimationFrame       || 
		window.mozRequestAnimationFrame    ||
		window.webkitRequestAnimationFrame ||	 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame     ||  
		function( callback ){ return window.setTimeout(callback, 1000 / 60); };
})();

function H5Marquee() {
var e = this;
var frame = null;

this.mouse = { 'x': -1, 'y': -1 }

this.textMode = null;
this.text = new Array();
this.textStack = new Array();
this.stackTracker = 0;
this.fontSize = 0;
this.textColor = null;
this.hoverColor = null;
this.textWidth = null;
this.overlayLeft = null;
this.overlayRight = null;

this.stroke = null;
this.textShadow = null;
this.shadowMode = null;

this.parentNode = null;
this.canvas = null;
this.canvasId = null;
this.screen = null; 
this.screenWidth = 0;
this.screenHeight = 0;
this.oldMarquee = null;
this.startingX = 0;
this.startingY = 0;
this.vel = 0;
this.chase = null;

this.id = function(el) { return document.getElementById(el); }

this.loop = function( ) {

	frame = requestAnimFrame(e.loop);
	e.clearScreen();
	e.update();
	e.draw();

}

this.init = function( settings ) {
	
	if(!this.mode( settings )) return false;
	if(settings.debug) {
		console.log( 'h5m: textMode: ' + e.textMode );
		console.log("h5m: parent id = " + settings.parent);
		console.log("h5m: parent element check = " + e.id(settings.parent));
	}

	if(settings.overlayRight) {
		e.overlayRight = new Image();
		e.overlayRight.src = settings.overlayRight;
		if(settings.debug) console.log("h5m: overlay right = " + e.overlayRight.src);
	}
	
	if(settings.overlayLeft) {
		e.overlayLeft = new Image();
		e.overlayLeft.src = settings.overlayLeft;
		if(settings.debug) console.log("h5m: overlay left = " + e.overlayLeft.src);
	}

	var compatible = (!!window.HTMLCanvasElement && !!window.CanvasRenderingContext2D);
	if(!compatible) {
		e.failSafe(settings);
		return;
	} else e.createCanvas(settings);
	
	var screen = e.id(e.canvasId);
	
	if(settings.debug) {
		console.log("h5m: canvas id = " + e.canvasId);
		console.log("h5m: canvas created");
		console.log("h5m: canvas element check = " + e.id(e.canvasId));
	}
	
	e.screen=screen.getContext("2d");

	e.screenWidth = settings.width;
	e.screenHeight = settings.height;
	if(settings.debug) console.log("h5m: screen width / height = " + e.screenWidth + "/" + e.screenHeight);
	
	e.fontSize = (settings.fontSize)    ?  settings.fontSize : 14;
	e.textColor = (settings.fontColor) 	?  settings.fontColor : "#000";
	var font = ((settings.fontStyle) 	? (settings.fontStyle + " ") : "normal ")
			+ ((settings.fontWeight) 	? (settings.fontWeight + " ") : "normal ") + e.fontSize + "px "
			+ ((settings.fontFamily) 	? (settings.fontFamily + " ") : "Times New Roman ");
	e.screen.font = font;
	e.hoverColor = (settings.hoverColor) ? settings.hoverColor : e.textColor;
	
	if (settings.textShadow) {
		e.textShadow = settings.textShadow.split(" ");
			if(settings.debug) {
				console.log("h5m: textShadow = " + settings.textShadow + " / e.textShadow = " + e.textShadow);
			}
	}
	
	if(settings.stroke){
		e.stroke = settings.stroke.split(" ");
		e.screen.lineWidth = e.stroke[0];
		e.screen.strokeStyle = e.stroke[1];
	}
	
	if(settings.debug) {
		console.log("h5m: font = " + font + " " + e.textColor + " hoverColor:" + e.hoverColor);	
		console.log("h5m: text height = " + e.fontSize);
	}
	
	e.startingX = e.screenWidth;
	e.startingY = ((((e.screenHeight - e.fontSize) / 2) + e.fontSize) - 4) + ((settings.yPlus) ? settings.yPlus : 0); 
	if(settings.debug) console.log("h5m: y position = " + e.startingY + " yPlus adjustment = " + ((settings.yPlus) ? settings.yPlus : "0"));
	
	e.vel = (settings.velocity) ? settings.velocity : 1;
	if(settings.debug) console.log("h5m: velocity = " + e.vel);

	if(e.textMode == "array") {
		e.textStack = e.setTextStack(settings.text);
		if(settings.ajax) e.textStackAjax(settings);
		if(settings.debug) console.log("h5m: text stack = " + e.textStack + ' tracker = ' + e.stackTracker + '  / ' + e.textStack[e.stackTracker]);
		var newText = e.textStack[e.stackTracker].title;
		var newLink = ("link" in e.textStack[e.stackTracker]) ? e.textStack[e.stackTracker].link : null;
		var newTarget = ("target" in e.textStack[e.stackTracker]) ? e.textStack[e.stackTracker].target : null;
		var uniqueColor = ("textColor" in e.textStack[e.stackTracker]) ? e.textStack[e.stackTracker].textColor : false;
		var uniqueHover = ("hoverColor" in e.textStack[e.stackTracker]) ? e.textStack[e.stackTracker].hoverColor : false;
		var measurement = e.screen.measureText(newText);
		e.textWidth = Math.floor(measurement.width);
		e.text.push({ 
		'text':newText, 
		'link':newLink, 
		'target':newTarget, 
		'x':e.startingX, 
		'y':e.startingY, 
		'width':e.textWidth, 
		'height':e.fontSize,
		'textColor':uniqueColor,
		'textHover':uniqueHover,
		'chased':false,
		'touched':false});

		if(e.textStack.length > 1) e.stackTracker++;
		
	} else if(e.textMode == "ajax") {
		e.textStackAjax(settings);
		return;
	} else {
		var measurement;
		measurement = e.screen.measureText(settings.text);
		e.textWidth = Math.floor(measurement.width);
		e.text.push({
					'text':settings.text, 
					'x':e.startingX, 
					'y':e.startingY, 
					'width':e.textWidth, 
					'height':e.fontSize, 
					'chased':false,
					'touched':false});
		if(settings.debug) console.log("h5m: text width = " + e.textWidth);
	}
	
	if(settings.chase) {
		var dec = (settings.chase < 10) ? parseFloat('0.0'+settings.chase) : parseFloat('0.'+settings.chase);
		e.chase = e.screenWidth * dec;
		if(settings.debug) console.log("h5m: chase starting from = " + settings.chase + "% or " + e.chase + "px (screen width: " + e.screenWidth + ")");
	}
	
	if(settings.debug) console.log("h5m: text = " + e.text[0].text);

	e.loop();

}

this.draw = function( ) {
var tColor = null;
var hColor = null;
	for (var i=0; i < e.text.length; i++) {
		tColor = (e.text[i].textColor) ? e.text[i].textColor : e.textColor;
		hColor = (e.text[i].textHover) ? e.text[i].textHover : e.hoverColor;
		e.configShadow();
		e.screen.fillStyle = (e.text[i].touched && e.text[i].link) ? hColor : tColor;
		e.screen.fillText(e.text[i].text, e.text[i].x, e.text[i].y);
		if(e.stroke) e.screen.strokeText(e.text[i].text, e.text[i].x, e.text[i].y);
	}
e.overlay();
}

this.update = function( ) {
	if(e.chase){
		for (var i=0; i < e.text.length; i++) {
			if(!e.text[i].chased) {
				if ((e.text[i].x + e.text[i].width) < e.chase) {
					var newText = null;
					var newLink = null;
					var newTarget = null;
					if(e.textMode == "array")  {
					newText = e.textStack[e.stackTracker].title;
					newLink = ("link" in e.textStack[e.stackTracker]) ? e.textStack[e.stackTracker].link : null;
					newTarget = ("target" in e.textStack[e.stackTracker]) ? e.textStack[e.stackTracker].target : null;
					var uniqueColor = ("textColor" in e.textStack[e.stackTracker]) ? e.textStack[e.stackTracker].textColor : false;
					var uniqueHover = ("hoverColor" in e.textStack[e.stackTracker]) ? e.textStack[e.stackTracker].hoverColor : false;
					var measurement = e.screen.measureText(newText);
					e.textWidth = Math.floor(measurement.width);
					if(e.textStack.length > 1) (e.stackTracker == e.textStack.length-1) ? (e.stackTracker = 0) : e.stackTracker++ ;
					} else {
						newText  = e.text[i].text;
						e.textWidth = e.text[i].width;
					}
					e.text.push({ 
								'text': newText, 
								'link': newLink, 
								'target':newTarget,
								'x':e.startingX, 
								'y':e.startingY, 
								'width':e.textWidth, 
								'height':e.fontSize, 
								'textColor':uniqueColor,
								'textHover':uniqueHover,
								'chased':false,
								'touched':false});
					e.text[i].chased = true;
				}
			}
		}
	}

	var mouseTouched = false;
	for (var i=e.text.length-1; i > -1; i--) {		
		if (e.mouseContact({'x':e.text[i].x,
				'y':e.text[i].y,
				'width':e.text[i].width,
				'height':e.text[i].height})) {
				e.text[i].touched = true;
				if(e.text[i].link) mouseTouched = true;
		} else e.text[i].touched = false;
		if((e.text[i].x + e.text[i].width) < 0) {
			(e.chase) ? e.text.shift() : e.text[i].x = e.screenWidth;
		} else {
			e.text[i].x += e.vel * -1;
		}
	}
	
	if(mouseTouched) e.canvas.style.cursor = "pointer";
	else e.canvas.style.cursor = "default";
}

this.textStackAjax = function ( settings, old ) {
	if(!old) var old = null;
	var rand = Math.floor(Math.random() * 100);
	var call_to = settings.ajax + '?r='+rand;
	var call = new e.com(call_to);
	var call_back = function() {
	var data = eval("var stream = " + call.response + ";");
	
	e.textStack = e.setTextStack(stream, old, true, settings);
		if(e.textMode == 'ajax') {
			if(old == null) {
			var measurement = e.screen.measureText(e.textStack[e.stackTracker].title);
			e.textWidth = Math.floor(measurement.width);
			} else e.textWidth = 0;
			var newText = e.textStack[e.stackTracker].title;
			var newLink = ("link" in e.textStack[e.stackTracker]) ? e.textStack[e.stackTracker].link : null;
			var newTarget = ("target" in e.textStack[e.stackTracker]) ? e.textStack[e.stackTracker].target : null;
			var uniqueColor = ("textColor" in e.textStack[e.stackTracker]) ? e.textStack[e.stackTracker].textColor : false;
			var uniqueHover = ("hoverColor" in e.textStack[e.stackTracker]) ? e.textStack[e.stackTracker].hoverColor : false;
			e.text.push({ 
						'text':newText, 
						'link':newLink,
						'target':newTarget,
						'x':e.startingX, 
						'y':e.startingY, 
						'width':e.textWidth, 
						'height':e.fontSize, 
						'textColor':uniqueColor,
						'textHover':uniqueHover,
						'chased':false,
						'touched':false});
			if(e.textStack.length > 1) e.stackTracker++;
			
			if(settings.chase) {
				var dec = (settings.chase < 10) ? parseFloat('0.0'+settings.chase) : parseFloat('0.'+settings.chase);
				e.chase = e.screenWidth * dec;
				if(settings.debug) console.log("h5m: chase starting from = " + settings.chase + "% or " + e.chase + "px (screen width: " + e.screenWidth + ")");
			}
	
			if(settings.debug) console.log("h5m: text = " + e.text[0].text);
			e.textMode = "array";
			
			 if(old != null) {
				e.stackTracker = 0;
				var init = e.iterator();
				e.oldMarquee.loop = '1';
				e.oldMarquee.setAttribute("loop","1");
				(window.attachEvent) ? e.oldMarquee.attachEvent('onfinish', e.iterator) : e.oldMarquee.addEventListener('finish', e.iterator, false);
				
			} else e.loop();
		} 
	}
	call.POST(call_back);
}

this.createCanvas = function( settings ) {
	e.canvasId = settings.parent + '_canvas';
	
	e.canvas = document.createElement('canvas');
	e.canvas.style.position = "relative";
	e.canvas.id     = e.canvasId;
	e.canvas.width  = settings.width;
	e.canvas.height = settings.height;
	e.canvas.margin = 0;
	if(settings.debug) e.canvas.style.backgroundColor = "#ff0000";
	
	if(settings.z) e.canvas.style.zIndex   = settings.z;
	e.parentNode = e.id(settings.parent);
	e.parentNode.style.height = settings.height + "px";
	e.parentNode.style.width = settings.width + "px";
	e.parentNode.appendChild(e.canvas);
	
	HTMLCanvasElement.prototype.xy = e.mouseXY;
	
	e.canvas.addEventListener('mousemove', function(ev){
		e.mouse = e.canvas.xy(ev); 
	}, false);
	
	e.canvas.addEventListener('click', function(ev) {
		e.mouseClick(ev);
	}, false);
		
	e.canvas.addEventListener('mouseout', function(ev) {
		e.mouseOut(ev);
	}, false);
	
}

this.setTextStack = function(text, old, m, settings) {
if(!settings) var settings = null;
if(!old) var old = null;
if(!m) var m = false;
var tempArr = e.textStack;
	for(var i = 0; i < text.length; i++){
	tempArr.push(text[i]);
	if(old != null) e.setUniqueLinks(text[i], i, m, settings);
		if("repeat" in text[i]) {
			if(text[i].repeat >= 1) {
				for(var j=0; j < text[i].repeat; j++){
					tempArr.push(text[i]);
				}
			}
		}
	}
return tempArr;
}

this.configShadow = function() {
	if (e.textShadow == null) return false;
	else {
	e.screen.shadowOffsetX = e.textShadow[0];
	e.screen.shadowOffsetY = e.textShadow[1];
	e.screen.shadowColor = e.textShadow[2];
	e.screen.shadowBlur = e.textShadow[3];
	}
}
this.clearShadow = function() {
	if (e.textShadow == null) return false;
	else {
	e.screen.shadowOffsetX = 0;
	e.screen.shadowOffsetY = 0;
	e.screen.shadowColor = e.textShadow[2];
	e.screen.shadowBlur = 0;
	}
}

this.mouseOut = function(ev) {
	if(!ev) var ev = window.event;
	e.mouseContactId = -1;
	e.mouse = {'x':-1,'y':-1}
	e.screen.fillStyle = e.textColor;
}

this.mouseClick = function(ev) {
	if(!ev) var ev = window.event;
	e.mouse = e.canvas.xy(ev);
	
for (var i=0; i < e.text.length; i++) {
		if (e.mouseContact({'x':e.text[i].x,
				   'y':e.text[i].y,
				   'width':e.text[i].width,
				   'height':e.text[i].height})) {
			if (e.text[i].link) {
				var openLink
				if(e.text[i].target == '_blank') openLink=window.open(e.text[i].link, '_blank');
				else openLink=window.open(e.text[i].link, '_self')
				openLink.focus();
			}
		} 
	}	
}

this.mouseXY = function (eve){
	if(!eve) var eve = window.event;

	var totalOffsetX = 0;
	var totalOffsetY = 0;
	var canvasX = 0;
	var canvasY = 0;
	var canvas = this;
	do{
	totalOffsetX += canvas.offsetLeft;
	totalOffsetY += canvas.offsetTop;
	}
	while(canvas = canvas.offsetParent)

	canvasX = eve.pageX - totalOffsetX;
	canvasY = eve.pageY - totalOffsetY;
return {'x':canvasX, 'y':canvasY}
}

this.mouseContact = function(message) {
	if(e.mouse.x > (message.x + message.width)) return false;
	if(e.mouse.x < message.x) return false;
	if(e.mouse.y < (message.y - (message.height / 2))) return false;
	if(e.mouse.y > (message.y + (message.height / 2))) return false;
return true;
}

this.overlay = function( ) {
	if(e.overlayRight || e.overlayLeft) e.clearShadow();
	if(e.overlayRight) e.screen.drawImage(e.overlayRight,(e.screenWidth - e.overlayRight.width), 0);
	if(e.overlayLeft) e.screen.drawImage(e.overlayLeft, 0, 0);
}

this.clearScreen = function( ) {

	e.screen.clearRect(0,0,e.screenWidth,e.screenHeight);

}

this.isArray = function( text ) { return (Object.prototype.toString.call( text ) === '[object Array]'); }

this.mode = function ( settings ) {
	if(!settings.text && !settings.ajax) {
		console.log('h5m: text setting cannot be missing if ajax setting is missing.');
		return false;
	} 
	else if(e.isArray( settings.text )) e.textMode = "array";
	else if(settings.ajax) e.textMode = "ajax";
	else e.textMode = "string";
	return true;
}

this.failSafe = function( settings ) {

	if(settings.debug) console.log('*old browser* falling back on <marquee></marquee> element');
	e.oldMarquee = document.createElement('marquee');
	
	e.canvasId = settings.parent + '_marquee';
	e.parentNode = e.id(settings.parent);
	
	//IE7
	e.oldMarquee.trueSpeed = 'truespeed';
	e.oldMarquee.scrollAmount = ((settings.velocity) ? settings.velocity : 1);
	e.oldMarquee.scrollDelay = '18';
	// > IE7
	e.oldMarquee.setAttribute("truespeed","truespeed");
	e.oldMarquee.setAttribute("scrollamount", ((settings.velocity) ? settings.velocity : 1));
	e.oldMarquee.setAttribute("scrolldelay","18");

	e.oldMarquee.style.position = "relative";
	e.oldMarquee.style.overflow = "hidden";
	var weight, style, family, color, size, hover;
	e.oldMarquee.style.paddingTop = ((settings.height - ((settings.fontSize) ? (settings.fontSize) : 14)) / 2) + "px";
	e.oldMarquee.style.size = size = (settings.fontSize) ? (settings.fontSize + "px") : '14px';
	e.oldMarquee.style.fontWeight = weight = (settings.fontWeight) ? settings.fontWeight : 'normal';
	e.oldMarquee.style.fontStyle = style = (settings.fontStyle) ? settings.fontStyle : 'normal';
	e.oldMarquee.style.fontFamily = family = (settings.fontFamily) ? settings.fontFamily : 'Times New Roman';
	e.oldMarquee.style.color = color = (settings.fontColor) ? settings.fontColor : '#000';

	if(settings.debug) console.log("font = " + e.oldMarquee.style.size + " " + e.oldMarquee.style.fontStyle + " " + e.oldMarquee.style.fontWeight + " " + e.oldMarquee.style.fontFamily + " " + e.oldMarquee.style.color);
	e.oldMarquee.id     = e.canvasId;
	e.oldMarquee.width  = settings.width;
	e.oldMarquee.height = settings.height;
	e.parentNode.appendChild(e.oldMarquee);
	if(settings.debug) console.log('marquee element check, id= ' + e.oldMarquee.id + "(element = " + e.id(e.oldMarquee.id) + ")");
	
	hover = settings.hoverColor;
	var linkSheet = document.createStyleSheet ("");
	if(e.textMode == "array")  {
linkSheet.cssText = '#'+e.canvasId+',#'+e.canvasId+' a:link,#'+e.canvasId+' a:visited { font-weight:'+weight+'; font-size:'+size+'; font-style:'+style+'; text-decoration:none; color:'+color+';} #'+e.canvasId+ ' a:hover {color:'+hover+';}';
		e.textStack = e.setTextStack(settings.text, true, false, settings);
		var init = e.iterator();
		e.oldMarquee.loop = '1';
		e.oldMarquee.setAttribute("loop","1");
		(window.attachEvent) ? e.oldMarquee.attachEvent('onfinish', e.iterator) : e.oldMarquee.addEventListener('finish', e.iterator, false);
		if(settings.ajax) e.textStackAjax(settings, true);
	} else if(e.textMode == "ajax") {
		linkSheet.cssText = '#'+e.canvasId+',#'+e.canvasId+' a:link,#'+e.canvasId+' a:visited { font-weight:'+weight+'; font-size:'+size+'; font-style:'+style+'; text-decoration:none; color:'+color+';} #'+e.canvasId+ ' a:hover {color:'+hover+';}';
		e.textStackAjax(settings, true);
	} else {
		linkSheet.cssText = '#'+e.canvasId+' { font-weight:'+weight+'; font-size:'+size+'; font-style:'+style+'; text-decoration:none; color:'+color+';}';
		e.oldMarquee.innerHTML = settings.text;
	}
	
	var overlayZINDEX = e.parentNode.style.zIndex + 1;
	if(settings.debug) console.log('overlay z-index = ' + overlayZINDEX);

	if(e.overlayLeft != null) {
		e.overlayLeft.style.cssText = 'position:absolute;left:0;top:0;height:'+settings.height+'px;z-index:'+overlayZINDEX+';';
		e.parentNode.appendChild(e.overlayLeft);
		if(settings.debug) console.log('left overlay style = ' + e.overlayLeft.style.cssText);
	}
	if(e.overlayRight != null) {
		e.overlayRight.style.cssText = 'position:absolute;right:0;top:0;height:'+settings.height+'px;z-index:'+overlayZINDEX+';';
		e.parentNode.appendChild(e.overlayRight);
		if(settings.debug) console.log('right overlay style = ' + e.overlayRight.style.cssText);
	}


}
this.iterator = function() {
			var newText = e.textStack[e.stackTracker].title;
			var jclass = ("jclass" in e.textStack[e.stackTracker]) ? 'class="'+e.textStack[e.stackTracker].jclass+'"': 'class=""';
			if("link" in e.textStack[e.stackTracker]) {
				var target;
				if(e.textStack[e.stackTracker].target == '_blank') target='target="_blank"';
				else target='';
				newText = '<a ' + target + ' ' + jclass + ' href="' + e.textStack[e.stackTracker].link + '">' + e.textStack[e.stackTracker].title + '</a>';
			}
			e.oldMarquee.innerHTML = newText;
			(e.stackTracker == e.textStack.length-1) ? (e.stackTracker = 0) : e.stackTracker++ ;
}
this.setUniqueLinks = function(text,i,m,settings) {
if(!settings) var settings = null;
if(!m) var m = null;
var tColor = null;
var hColor = null;
		if(text.textColor || text.hoverColor){
				var linkSheet = document.createStyleSheet ("");
				tColor = (text.textColor) ? text.textColor : settings.textColor;
				hColor = (text.hoverColor) ? text.hoverColor : settings.hoverColor;
				var aj = (m) ? "_" : "";
				linkSheet.cssText = '#'+e.canvasId+' a._'+i+aj+':link,#'+e.canvasId+' a._'+i+aj+':visited{color:'+tColor+'!important;}#'+e.canvasId+' a._'+i+aj+':hover {color:'+hColor+'!important;}';
				text.jclass="_"+i+aj;
		} 
	return text;
}

this.com = function(url) {
	var com = this;
	this.obj = null;
	this.url = url;
	this.result = null;

	this.connection = function () {
		if(window.XMLHttpRequest){
		com.obj = new XMLHttpRequest();
		} else if(window.ActiveXObject){
		com.obj =  new ActiveXObject("Microsoft.XMLHTTP");
		} else {
		alert('browser out dated');
		return false;
		}
	}

	this.POST = function(callback, parameters) {
		parameters = (typeof parameters === "undefined") ? "" : parameters;
		com.connection();
		com.obj.open("POST",com.url,true);
		com.obj.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		com.obj.onreadystatechange = function() {
			if(com.obj.readyState == 4 && com.obj.status == 200)
			{ 
				com.response = com.obj.responseText;
				callback();
			}
		}
		com.obj.send(parameters);
	}
}

}

var EduNet_Load;
if (window.attachEvent) {
    EduNet_Load = function (element, event, handler) {
		
        element.attachEvent('on'+event, function load() { 
			handler();
			element.detachEvent('on'+event, load);
		});
    };
}
else {
    EduNet_Load = function (element, event, handler) {
		element.addEventListener(event, function load() { 
			handler();
			element.removeEventListener(event, load, false);
		}, false);
		
    };
}