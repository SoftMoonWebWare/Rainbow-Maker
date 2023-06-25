/* for RainbowMaker HTML interface */
/* this file must be “deferred” and run AFTER the HTML has loaded */

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
																	  maxGroups:ARBITRARY_MAX, minGroups:1, dumpEmpties:false, }),
	colorGenie=   new FormFieldGenie({indxTier:-1, groupClass:'color', groupTag:'FIELDSET',
																	  checkForFilled:'all',
																	  maxGroups:ARBITRARY_MAX, minGroups:2, dumpEmpties:true, }),
	tileGenie=    new FormFieldGenie({indxTier:0, groupClass:'tile', groupTag:'FIELDSET',
																	  checkForFilled:'all',
																	  maxGroups:ARBITRARY_MAX, minGroups:1, dumpEmpties:false, }),
	mosaicGenie=  new FormFieldGenie({indxTier:-1, groupClass:'tilelist', groupTag:'SELECT',
																	  checkForFilled:'one',
																	  maxGroups:ARBITRARY_MAX, minGroups:1, dumpEmpties:false, }),
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
			const newColor=colorGenie.popNewField(color, {doso:'insert'});
			if (newColor)  {
				const percent=Math.roundTo(GRADIENT_STOP_PRECISION,stop*100)+"%";
				newColor.querySelector('[name*="stop"]').value=percent;
				grad.insertBefore(gradientPointer.cloneNode(true), grad.children[pos]).style.left='calc('+percent+' - 15px)';  //(mouseX-14)+"px";
				break;  }  }
		pos++;  }  }

function dragColor(event)  {event.stopPropagation();  event.preventDefault();
console.log("drag color event stopped");  }

function relocateColor(stopInput, type)  {
console.log('relocate Color event ('+type+') for:',stopInput,);
	const
		count=Array.from(stopInput.closest('fieldset.specs').children).indexOf(stopInput.closest('.color')),
		pointers=stopInput.closest('fieldset.gradient').querySelectorAll('gradient pointer'),
		pointer=pointers[count],
		newStop=parseFloat(stopInput.value)/100;
	if (count>0  &&  newStop<pointers[count])  {}




}
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
	if (event.type==='mouseover')  for (const cfs of event.currentTarget.closest('fieldset.specs').children)  {
		if (cfs===event.currentTarget)  break;
		count++;  }
	const pointers=event.target.closest('fieldset.gradient').querySelectorAll('gradient pointer');
	for (let i=0; i<pointers.length; i++)  {
		pointers[i].classList.toggle('highlight', event.type==='mouseover' && i===count);  }  }


//  if tile placement is “center” then disable absolute position specs
function centerPlacement(checkbox)  {
	const tr=checkbox.closest("tr");
	tr.classList.toggle("center", checkbox.checked);
	for (const inp of tr.querySelectorAll("input[type='text'], input[type='radio']"))  {
		inp.disabled=checkbox.checked;  }  }

function enhanceGradientKeyboard(event)  {
	if (event.ctrlKey  ||  event.shiftKey)  return;
	switch (event.key)  {
	case "Enter":  return;
		if (/\[stop\]/.test(event.target.name))  relocateColor(event.target, event.type);
	return;
	case "ArrowUp":
		if (event.target.hasAttribute('min')  &&  !event.altKey)  return;
		event.target.closest(".color").previousElementSibling?.getElementsByClassName(event.target.className)[0].focus();
	return;
	case "ArrowDown":
		if (event.target.hasAttribute('min')  &&  !event.altKey)  return;
		event.target.closest(".color").nextElementSibling?.getElementsByClassName(event.target.className)[0].focus();  }  }

function helpFor(index)  {
	if (index=document.getElementById('help_for_'+index))  {
		document.getElementById('help').classList.add('active');
		index.scrollIntoView();  }  }