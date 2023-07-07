/* for RainbowMaker HTML interface */
/* copyright © 2023 Joe Golembieski, SoftMoon-WebWare.  All rights reserved.
 */

/* this file must be “deferred” and run AFTER the HTML has loaded */

'use strict';

const
	GRADIENT_STOP_PRECISION=4,  // number of decimal places in a gradient percentage: 50.1234%
	ARBITRARY_MAX=62;  // maximum number of gradients, colors per gradient, tiles, sub-tiles per mosaic;


UniDOM.prototypify();

for (const e of document.querySelectorAll("[template]"))  {
	const template=document.getElementById(e.getAttribute('template'));
	if (template)  e.appendChild(template.content.cloneNode(true));  }

{  //open a private namespace
	const irrPolys=document.querySelector('.sculptedRainbow select[name*="[irregularPolygon]"]');
	for (const poly in SoftMoon.WebWare.RainbowMaker.Polygonic.VectoredPolygon.plugins)  {
		irrPolys.appendChild(new Option(poly));  }
}  //close namespace

for (const e of document.querySelectorAll('[name*="[extend][doso]"]:checked'))  {e.onchange();}

const
	gradientGenie=new FormFieldGenie({indxTier:0, groupClass:'gradient', groupTag:'FIELDSET',
																	  checkForFilled:'all',
																	  maxGroups:ARBITRARY_MAX, minGroups:1, dumpEmpties:false,
																		eventRegistrar:SoftMoon.WebWare.plusplusplusInput }),
	colorGenie=   new FormFieldGenie({indxTier:-1, groupClass:'color', groupTag:'FIELDSET',
																	  checkForFilled:'all',
																	  maxGroups:ARBITRARY_MAX, minGroups:2, dumpEmpties:true,
																		eventRegistrar:SoftMoon.WebWare.plusplusplusInput }),
	tileGenie=    new FormFieldGenie({indxTier:0, groupClass:'tile', groupTag:'FIELDSET',
																	  checkForFilled:'all',
																	  maxGroups:ARBITRARY_MAX, minGroups:1, dumpEmpties:false,
																		eventRegistrar:SoftMoon.WebWare.plusplusplusInput }),
	mosaicGenie=  new FormFieldGenie({indxTier:-1, groupClass:'tilelist', groupTag:'SELECT',
																	  checkForFilled:'one',
																	  maxGroups:ARBITRARY_MAX, minGroups:1, dumpEmpties:false,
																		eventRegistrar:SoftMoon.WebWare.plusplusplusInput }),
	gradientPointer=document.querySelector('#rainbows .gradient pointer').cloneNode(true);

colorGenie.config.clone=document.querySelector('#rainbows .gradient .color').cloneNode(true);
colorGenie.config.eventRegistrar=function(colorFS)  {
	for (const inp of colorFS.querySelectorAll('input[min]'))  {
		SoftMoon.WebWare.register_input_type_numeric(inp);  }
	MasterColorPicker.registerTargetElement(colorFS.querySelector('input[type="MasterColorPicker"]'));  }
for (const inp of colorGenie.config.clone.querySelectorAll('input'))  {
	//clean up FireFox - it preserves input values between page-reloads
	inp.value= inp.hasAttribute('default-value') ? inp.getAttribute('default-value') : "";  }

gradientGenie.config.clone=document.querySelector('#rainbows .gradient').cloneNode(true);
mosaicGenie.config.clone=document.querySelector('#mosaics .tilelist').cloneNode(true);

document.querySelector('#rainbows .gradient gradient').appendChild(gradientPointer.cloneNode(true));


function flash(html,finish)  {
	html.classList.add('flash');
	var times=13;  //needs to be an odd number!
	const id=setInterval(
		()=>{html.classList.toggle('flash');  if (--times<=0)  {clearInterval(id);  if (typeof finish === 'function')  finish();}},
		113);  }

function toggleToolbarPanel(panel)  {
	panel.classList.toggle("panel");
	panel.closest("toolbar").classList.toggle("open", panel.classList.contains('panel'));
}


//  ¿which section is on top?  Gradients / Tiles / Canvas
function setTopSection(section)  {
	if (section)  for (const sect of section.parentNode.querySelectorAll('section'))  {
		sect.classList.toggle('top', sect===section);  }  }





function addNewColor(event)  {
	if (event.target.tagName.toLowerCase()==='polygon')  return;
	const
		grad=event.currentTarget,
		mouseX=grad.getMouseOffset(event).x,
		stop= mouseX / grad.offsetWidth,
		specs=event.target.closest('.gradient').querySelector('.specs');
	var pos=0;
	for (const color of specs.querySelectorAll('.color'))  {
		if (stop < parseFloat(color.querySelector('[name*="stop"]').value)/100)  {
			const newColor=colorGenie.popNewGroup(color, {doso:'insert'});
			if (newColor)  {
				const percent=Math.roundTo(GRADIENT_STOP_PRECISION,stop*100)+"%";
				newColor.querySelector('[name*="stop"]').value=percent;
				grad.insertBefore(gradientPointer.cloneNode(true), grad.children[pos]).style.left='calc('+percent+' - 15px)';  //(mouseX-14)+"px";
				break;  }  }
		pos++;  }  }

function dragColor(event)  {event.stopPropagation();  event.preventDefault();
console.log("drag color event stopped");  }



function highlightColor(event)  {
	var count=0;
	if (event.type==='mouseover')  for (const ptr of event.target.closest('gradient').children)  {
		if (ptr===event.target.closest('pointer'))  break;
		count++;  }
	const colorFSs=event.target.closest('fieldset.gradient').querySelectorAll('fieldset.color');
	for (let i=0; i<colorFSs.length; i++)  {
		colorFSs[i].classList.toggle('highlight', event.type==='mouseover' && i===count);  }  }

function highlightColorPointer(event)  {
	var count=0;
	if (event.type==='mouseover')
		for (const cfs of event.currentTarget.closest('fieldset.specs').querySelectorAll('fieldset.color'))  {
			if (cfs===event.currentTarget)  break;
			count++;  }
	const pointers=event.target.closest('fieldset.gradient').querySelectorAll('gradient pointer');
	for (let i=0; i<pointers.length; i++)  {
		pointers[i].classList.toggle('highlight', event.type==='mouseover' && i===count);  }  }






const Gradientor={
	gatherStops: gatherStops,  // this will be local…
	processColor: processColor,  // this will be local…
	processStopColors: processStopColors,  // these rest will we imported from MasterColorPicker.Gradientor
	processStopPositions: processStopPositions  }

// this is harvested from MasterColorPicker.Gradientor … … It will be enhanced and debugged, then re-incorporated there.
// MasterColorPicker will have to revamp the way it handles the Errors generated

function gatherStops(sets)  {  // this method will be customized to MasterColorPicker or RainbowMaker
	const
		stops=new Array,
		map=gatherStops.map;
	for (const set of sets)  {
		const stop=new Object;
		for (let i=0;  i<map.length;  i++)  {
			stop[map[i]]=set.elements[i].value?.trim() || "";  }
		if (stop.Ap!="")  {
			if (stop.color=="")
				stop.color=[undefined,undefined,undefined,undefined,parseFloat(stop.Ap)/100];  }
		stops.push(stop);  }
	return stops;  }
gatherStops.map=['pos', 'color', 'Ap'];  //The order of this array should match the order of inputs in the HTML

const MSG={
	CANT_ADD: ' ¡Gradient Error! : Can’t add to non-existant previous position.',
	CANT_SUB: ' ¡Gradient Error! : Can’t subtract from non-existant next position.',
	CANT_DIV: ' ¡Gradient Error! : Can’t divide without totalPixels.',
	OUT_OF_RANGE: ' ¡Gradient Error! : Stop position out of range (0%–100%).',
	OUT_OF_ORDER: ' ¡Gradient Error! : Stop positions out of order.',
	UNKNOWN_COLOR: ' ¡Gradient Error! : unknown color: “',
	CANT_INTERP: ' ¡Gradient Error! : Can’t interpolate color hints over more than one stop or at end of spectrum.',
  BAD_COLOR_HINT: ' ¡Gradient Error! : Color hints may not be negatively offset.' };

class GradientError extends Error {
	static messages=MSG;
	constructor(msg, problem, data)  {
		super(msg);
		this.problem=problem;
		this.data=data;  }  }
GradientError.prototype.name="GradientError";
SoftMoon.WebWare.GradientError=GradientError;

/*
function processColor(stop)  {  //for MasaterColorPicker
	const boogar=stop.color;
	if (null===(stop.color= (cSpace==='rgb') ? MasterColorPicker.RGB_calc(stop.color) : MasterColorPicker.RGB_calc.to[cSpace](stop.color)))
		throw new GradientError(MSG.UNKNOWN_COLOR+boogar+'”.', 'unknown color');  }
 */

function processColor(stop, cSpace)  {  //for Rainbow-Maker
		const boogar=stop.color;
	if (typeof stop.color === 'string')  {
		if (null===(stop.color= (cSpace==='rgb') ? MasterColorPicker.RGB_calc(stop.color) : MasterColorPicker.RGB_calc.to[cSpace](stop.color)))
			throw new GradientError(MSG.UNKNOWN_COLOR+boogar+'”.', 'unknown color');
		stop.color.push(MasterColorPicker.RGB_calc.getAlpha(stop.Ap));  }  }

function processStopColors(sets, cSpace, allowUndefinedRGBChannels=false)  {
	const
		stops=this.processStopPositions(this.gatherStops(sets));  //  fieldset.querySelectorAll('fieldset.color'), )); ←RainbowMaker
	if (!(stops instanceof Array))  {  // this will now never happen…
		throw new GradientError('gradient internal error; see Error.data.stops:', 'internal', {"stops":stops});  }
	MasterColorPicker.RGB_calc.config.stack({
		RGBA_Factory: {value: Array},
		HSLA_Factory: {value: Array},
		HSBA_Factory: {value: Array},
		HCGA_Factory: {value: Array},
		CMYKA_Factory: {value: Array},
		defaultAlpha: {value: 1},
		allowUndefinedRGBChannels: {value: allowUndefinedRGBChannels}
		});
	try  {for (const stop of stops)  {if (stop.color!="")  this.processColor(stop, cSpace);}}
	finally {MasterColorPicker.RGB_calc.config.cull();}
	for (let i=0; i<stops.length; i++)  {
		if (stops[i].color=="")  {
			if (i===0  ||  i===stops.length-1  ||  stops[i+1].color=="")  throw new GradientError(MSG.CANT_INTERP, 'interpolate', {"index": i, "stops": stops});
			stops[i].color= mixBiads(stops[i-1].color, stops[i+1].color, 0.5, cSpace);  }  }
	if (this.doLog)  console.log(' gradient color stops: ',stops);
	return stops;  }

function mixBiads() {return "mixed color";}

function processStopPositions(stops) {
	// we depend on “input type numeric” and it guaranteeing the proper unit (percents or pixels); we do not check syntax within
	// we return an array of objects; or null if any colors or stop-points are invalid.
	// The returned pos (position) values are factors from 0-1.
	if (stops[0].pos=="")  stops[0].pos='0%';
	else if (parseFloat(stops[0].pos)!==0)  {
		stops.unshift({color: stops[0].color, pos: '0%'});
		stops.hasVirtualStart=true;  }
	var totalPixels, last=stops.length-1;
	while (last>=0  &&  stops[last].color==""  &&  stops[last].pos=="")  {stops.length--;  last--;}
	if (stops[last].pos?.endsWith('%'))  {
		if (parseFloat(stops[last].pos)!==100)  {
			stops.push({color: stops[last].color, pos: '100%'});
			stops.hasVirtualEnd=true;  }  }
	else {
		if (stops[last].pos!="")  totalPixels=parseFloat(stops[last].pos);
		stops[last].pos='100%';  }
	for (let pending=0, pendOff=0, addTo, iOff, i=0;  i<stops.length;  i+=iOff)  { iOff=1
		if (stops[i].pos=="")  {
			if (stops[i].color=="")  stops.splice(i--,1);
			else  {pending++;  pendOff++;}
			continue;  }
		if (stops[i].pos.startsWith('+'))  {
			if (pending)  {
				if (stops[i].color=="")  {pendOff++;  continue;}  // here we have an additive color-hint in the midst of blank positions, that gets put-off until the end
				else  throw new GradientError(MSG.CANT_ADD, 'relative', {'index':i, 'stops':stops});  }
			stops[i].isPosOffset=true;
			addTo=parseFloat(stops[i-1].pos);  }
		else if (stops[i].pos.startsWith('-'))  {  // this is not currently supported by MasterColorPicker
			if (stops[i].color=="")  throw new GradientError(MSG.BAD_COLOR_HINT, 'color-hint', {'index':i, 'stops':stops})
			for (var j=i+1; j<stops.length; j++)  {
				if (stops[j].pos=="")  {
					if (stops[j].color=="")  {stops.splice(j--, 1);  continue;}
					throw new GradientError(MSG.CANT_SUB, 'relative');  }
				if (stops[j].pos.startsWith('+'))  throw new GradientError(MSG.CANT_SUB, 'relative', {'index':i, 'stops':stops});
				if (stops[j].pos.startsWith('-'))  continue;
				break;  }
			let k=j-1;  // j = index of next “anchored” position
			addTo= stops[j].pos= stops[j].pos.endsWith('%') ?
					parseFloat(stops[j].pos)/100
				: (totalPixels ? stops[j].pos/totalPixels : new GradientError(MSG.CANT_DIV, 'no totalPixels', {'index':j, 'stops':stops}));
			if (addTo instanceof Error)  throw addTo;
			stops[i].isNegOffset=true;
			iOff=(j-i)+1;
			while (k>i)  {  //process the run of negative relative offsets
				if (stops[k].pos.endsWith('%'))  stops[k].pos=parseFloat(stops[k].pos)/100 + addTo;
				else  {
					if (totalPixels)  stops[k].pos=parseFloat(stops[k].pos)/totalPixels + addTo;
					else  throw new GradientError(MSG.CANT_DIV, 'no totalPixels', {'index':k, 'stops':stops});  }
				stops[k].isNegOffset=true;
				addTo=stops[k--].pos;  }  }
		else addTo=0;
		if (stops[i].pos.endsWith('%'))  stops[i].pos=parseFloat(stops[i].pos)/100 + addTo;
		else  {
			if (totalPixels)  stops[i].pos=parseFloat(stops[i].pos)/totalPixels + addTo;
			else  throw new GradientError(MSG.CANT_DIV, 'no totalPixels', {'index':i, 'stops':stops});  }
		if (stops[i].pos<0  ||  stops[i].pos>1)  throw new GradientError(MSG.OUT_OF_RANGE, 'out of range', {'index':i, 'stops':stops});
		if (i>0  &&  stops[i].pos < stops[i-pendOff-1].pos)  throw new GradientError(MSG.OUT_OF_ORDER, 'out of order', {'index':i, 'stops':stops});
		if (pending)  {  // here we fill in the positions that were left blank, skipping any ones in the middle that were additive color-hints
			const
				start=i-pendOff-1,
				base=stops[start].pos,
				spread=(stops[i].pos - base) / (pending + 1);
//console.log('pending: ',pending,pendOff,start,i,' base:',base,' spread:',spread);
			do {if (stops[start+pendOff].pos=="")  stops[start+pendOff].pos= base + spread*(pending--);}
			while ( --pendOff );  }  }
	for (let i=0;  i<stops.length;  i++)  {  // here we fill in the remaining mid-point-color-hints that were additive in nature, but were in the midst of blank positions
		if (typeof stops[i].pos !== 'string')  continue;
		if (stops[i].pos.endsWith('%'))
			stops[i].pos= stops[i-1].pos + ( stops[i+1].pos - stops[i-1].pos )*( parseFloat(stops[i].pos)/100 );
		else  {
			if (totalPixels)  stops[i].pos= parseFloat(stops[i].pos)/totalPixels + stops[i-1].pos;
			else  throw new GradientError(MSG.CANT_DIV, 'no totalPixels', {'index':i, 'stops':stops});
			if (stops[i].pos<0  ||  stops[i].pos>1)  throw new GradientError(MSG.OUT_OF_RANGE, 'out of range', {'index':i, 'stops':stops});
			if (stops[i].pos < stops[i-1].pos  ||  stops[i].pos > stops[i+1].pos)  throw new GradientError(MSG.OUT_OF_ORDER, 'out of order', {'index':i, 'stops':stops});  }  }
	stops.gradientType= totalPixels ? "Paletted" : "TrueColor";
	stops.totalPixels=totalPixels;
	return stops;  }





function buildDisplayGradient(event)  {  // this is an “onchange” event
	const msgBox=event.target.closest('fieldset.gradient').querySelector('messages');
	const
		specs=event.target.closest('fieldset.specs'),
		sets=specs.querySelectorAll('fieldset.color'),
		pointers=event.target.closest('fieldset.gradient').querySelectorAll('gradient pointer');
	function alignPointerPlacement(stops)  {
		for (var i=0; i<stops.length; i++)  {  // pointers are 27px wide
			pointers[i].style.left="calc("+stops[i].pos*100 + "% - 13px)";  }  }
	try {
		const
			cSpace=specs.querySelector('select[name*="[colorSpace]"]').value.toLowerCase(),
			stops=Gradientor.processStopColors(sets, cSpace, false),
			gName=specs.closest('fieldset.gradient').querySelector('input[name*="[name]"]').value;
console.log("We got the Stops! ¡See:",stops);
		msgBox.innerHTML="We got the Stops!";
		msgBox.classList.remove('error');
    alignPointerPlacement(stops);
    const grad=stops.totalPixels ?
				new SoftMoon.WebWare.RainbowMaker.Paletted_Gradient(gName)
			: new SoftMoon.WebWare.RainbowMaker.TrueColor_Gradient(gName);
console.log("We got the gradient!  ¡See:",grad);
	}
	catch(e) {
		msgBox.classList.add('error');
		msgBox.innerHTML='<msg>'+e.message + (e.data ? "&nbsp; See color #"+(e.data.index+1) : "") + '</msg>';
//console.error(e,e.data?.stops);
		if (!(e instanceof GradientError))  {console.error(e);  return;}
		var finishFlash;
		const
			stops=e.data.stops,
			i=e.data.index,
			setOff= stops.hasVirtualStart ? (-1) : 0;
		switch (e.problem)  {
		case "out of order":
			if (!document.querySelector('input[name="auto-sort"]').checked)  break;
			if (stops[i].isNegOffset  ||  stops[i].isPosOffset)  {
				msgBox.append("(can not auto-adjust relative-offset colors)");
				break;  }
			for (var j=0; j<i; j++)  { if (stops[j].pos>stops[i].pos)  {
				finishFlash=function() {
					if (stops[j].isPosOffset
					||  (j>0  &&  stops[j-1].isNegOffset  &&  (--j,true)))  {
						msgBox.append("(can not auto-adjust amidst relative-offset colors. See Color #"+(j+1+setOff)+")");
						flash(sets[j+setOff]);
						return;  }
					msgBox.innerHTML="Stop position reordered.";
					msgBox.classList.remove('error');
					colorGenie.cutGroup(sets[i+setOff]);  //the Genie will handle keeping the input-names in proper numerical order
					const pasted=colorGenie.pasteGroup(sets[j+setOff], {doso:'insert'});
					pointers[j].before(pointers[i]);
					pointers[i].style.left=stops[i].pos*100 + "%";
					flash(pasted, ()=>buildDisplayGradient({target:pasted}));  }
				break;  }  }
		break;
		case "out of range":  break;
		default: alignPointerPlacement(stops);
		}
		if (typeof e.data?.index === 'number')  flash(sets[e.data.index], finishFlash);  }

	}





function enhanceGradientKeyboard(event)  {
	let utf8char;
	switch (/\b(RGBAb|Ap)\b/.test(event.target.className)  &&  event.ctrlKey  &&  event.key)  {
	case ";": utf8char="◊";  // lozenge
	break;
	case "0": utf8char= event.altKey ? "Ø" : "∅";  // Latin O with stroke : nullset
	break;  }
	if (utf8char)  {
		const curPos=event.target.selectionStart;
		event.target.value=event.target.value.substr(0,curPos)+utf8char+event.target.value.substr(event.target.selectionEnd||curPos);
		event.target.selectionStart=
		event.target.selectionEnd=curPos+1;
		event.preventDefault();
		return;  }
	if (event.ctrlKey  ||  event.shiftKey)  return;
	switch (event.key)  {
		// if the user “modifies” the (numeric) text-input to add a “unit”, the unit is added via JavaScript,
		// and the browser does NOT consider this ALONE to be a reason for an “onchange” event,
		// whether the user presses the Enter key or removes focus from the input.
		// If we force the action here, we must prevent default action as we try to build the gradient ¡twice! under other normal conditions
		// and any “flash” messages get garbled since ¡two! flashes on the same html occur simultaneously.
	case "Enter":
		event.preventDefault();
		buildDisplayGradient(event);
	return;
	case "ArrowUp":
		if (event.target.hasAttribute('min')  &&  !event.altKey)  return;
		event.target.closest(".color").previousElementSibling?.getElementsByClassName(event.target.className)?.[0]?.focus();
	return;
	case "ArrowDown":
		if (event.target.hasAttribute('min')  &&  !event.altKey)  return;
		event.target.closest(".color").nextElementSibling?.getElementsByClassName(event.target.className)?.[0]?.focus();  }  }





//  if tile placement is “center” then disable absolute position specs
function centerPlacement(checkbox)  {
	const tr=checkbox.closest("tr");
	tr.classList.toggle("center", checkbox.checked);
	for (const inp of tr.querySelectorAll("input[type='text'], input[type='radio']"))  {
		inp.disabled=checkbox.checked;  }  }

function helpFor(index)  {
	if (index=document.getElementById('help_for_'+index))  {
		document.getElementById('help').classList.add('active');
		index.scrollIntoView();  }  }