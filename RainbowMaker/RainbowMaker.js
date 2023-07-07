//  character encoding: UTF-8 UNIX   ¡tab-spacing: 2  important!   word-wrap: no
/*  RainbowMaker 2.0 alpha	     July 7, 2023
		Copyright © 2011, 2012, 2021, 2023 Joe Golembieski, SoftMoon Webware

		This program is a work of fictional imagination.
		Any resemblence to any real-life code or variables is purely coincidental.
 */


// requires +++Math.js
// requires +++Canvas.js

'use strict';


const  INFINITY='∞';  // ¿ this may? should? be farmed out to a larger framework context ?




/* not currently used: */
if (!(Object.clone instanceof Function))
	Object.clone=function($O, $deep=0)  {
		const NO=new $O.constructor();
		for (const k in $O)  {
			 NO[k]= ($deep>0  &&  typeof $O[k] === 'object') ? Object.clone($O[k], $deep-1) : $O[k];  }
		return NO;  }
 /**/



/*
const SoftMoon={};
if (!SoftMoon.WebWare)  Object.defineProperty(SoftMoon, 'WebWare', {value:{}, enumerable:true};
*/


{  // create a private NameSpace for the rest of this file

const RainbowMaker={MAX_GRAFK_SIZE: 500*500, rainbows:{}};


/* The “tile” (super-class of Tile) is the basic unit of “data” that the RainbowMaker uses.
 * It is an independent aspect of an overall bitmap, and can be placed anywhere on said bitmap.
 * In essence, it is a graphic (referred to as a grafik or grafix in comments herein).
 * It may be:
 *   • a pre-defined bitmap image (class of ImageTile),
 *   • a “scupted gradient” (rainbow) shape (super-class of Shape)
 *   • a tile composed of a mosaic of other tiles (super-class of MosaicTiler)
 *   • **future** a vectored-drawing image (super-class of ImageTile) ←using enhanced canvas drawing methods
 */
// Every tile has a unique name.  The array below holds those tiles in the order they were produced.
// The array also has properties which correspond to each tile’s name;
//  therefore it is easier to refer to “RainbowMaker.tiles” as an object, not an array…
//  but arrays have special seach/iteration features, so… do what you like!
Object.defineProperty(RainbowMaker, 'tiles', {value:new Array, enumerable:true});


Object.defineProperty(SoftMoon.WebWare, 'RainbowMaker', {value:RainbowMaker, enumerable:true});


/*  RainbowMaker.MAX_GRAFK_SIZE
	This is the maximum number of pixels in the “grafk” - which may be smaller than the full final “image” produced.
	In essence, this is the maximum number of “attended pixels:”  the pixels that will considered by the algorithms.
	To build each shape, the algorithms look at each pixel in the grafk in succession,
		and determine what color, if any, to place there.
	the default limits this for practical reasons: a star this size may take 4 seconds to create,
	but a nebula this size may take several minutes to create - read the comments on that in the MosaicTiler Class.
*/

//  import some functions into this namespace that need the fastest access possible by the compiler
const    abs = Math.abs,
				ceil = Math.ceil,
			 floor = Math.floor,
				 max = Math.max,
				 min = Math.min,
			 round = Math.round,
				 pow = Math.pow,
				sqrt = Math.sqrt,
				fmod = function($v, $d)  {return $v - $d * (($d < 0) ? ceil($v / $d) : floor($v / $d));},  // ← PHP equiv ¿ or use → Math.sawtooth ?
			 hypot = Math.hypot,
				 sin = Math.sin,
				 cos = Math.cos,
				 tan = Math.tan,
				atan = Math.atan,
			radian = Math.rad,
		getAngle = Math.Trig.getAngle,
	 readAngle = Math.Trig.readAngle,
ellipseAngle = Math.Trig.ellipseAngle,
			rotate = Math.Trig.rotate,
rotateAround = Math.Trig.rotateAround,
	 rotateBox = Math.Trig.rotateBox;



/*
	this is a (semi-)"abstract" class, the basis of all RainbowMaker’s grafix
	each Tile extension instance is either a:
		• wrapper for a pre-existing “bitmapped image” - i.e. another Canvas or Image
		• Rainbow Gradient (sculpted or simple) generator - i.e. a Shape
		• wapper for a “standard” Canvas graphic (vector graphic, etc.) generator (in the future)
		• Mosaic of other Tiles (i.e. a Tile made of sub-Tiles) see MosaicTiler
	A “blank” tile is used as a placeholder, and provides dummy methods and values used by
	the MosaicTiler so it does not have to evaluate a Tile’s status each time it sets a pixel, speeding up the process.
 */
class Tile {

	name;
	/* The name is specifically for reference when building Mosaics (see the MosaicTiler class)
	 * but you can also reference the constructed Tile from the RainbowMaker.tiles array/object.
	 * Once a tile is constructed, you can use it … its name has no intrinsic meaning.
	 * Once a Mosiac is constructed, the names of the tiles within said Mosaic no longer matter.
	 * You can “replace” tiles with the same name, and either:
	 * • simply paintOn() each tile immediately after construction, afterwhich the Tile is typically useless anyway,
	 * • or keep track of the “replaced” tile elsewhere.
	 * This way you can chain together multiple “plans” from different JSON files
	 * and not worry too much about conflicting names.
	 * Or the RainbowMaker.tiles array/object can keep track of them for you…
	 * and alert you to problems when tiles have the same name in a given plan.
	 */
	static replaceOldTiles=true;

	constructor(name="")  {
		if (name==undefined)  name=new Date().toString();
		if (RainbowMaker.tiles[name])  {
			if (Tile.replaceOldTiles)  {
				const i=RainbowMaker.tiles.findIndex(t=>t.name===name);
				if (i>=0)  RainbowMaker.tiles.splice(i,1);  }
			else throw new Error('A RainbowMaker Tile already exists with the name “'+name+'”.');  }
		this.name=name;
		Object.defineProperty(this, 'fullName', {
			get: function(){return (this.name ? (this.name+" ") : "") + this.__proto__.name;},
			enumerable: true,
			configurable: false });
		if (new.target===Tile)  this.isBlankTile=true;  //blank Tiles are used by the MosaicTiler classes
		RainbowMaker.tiles.push(this);
		RainbowMaker.tiles[name]=this;  }

	getColorAt(/* {x: , y: } */) {return null;}
	paintOn(/* $context */) {}  }

Tile.prototype.name='Tile';
Tile.prototype.width=0;   /* int */
Tile.prototype.height=0;  /* int */
Tile.prototype.center=[0,0];  /* Array [int x, int y]  rotational center of grafk  */



class ImageTile extends Tile { // ¡¡ width, height, scale values all need to take in account crop values !!
	image;
	alpha;     // float ‹0-1› →blendrate to blend image into canvas
	//            or final pixel alpha-multiplier when  composite='copy'
	composite; // valid value for  CanvasRenderingContext2D.globalCompositeOperation
	set width(w) {
		if (Number.isNumeric(w))  {
			this.#sWidth=round(w);  this.#_scale=w/this.#nWidth;   this.#sHeight=round(this.#nHeight*this.#_scale);  }
		else  throw new TypeError('ImageTile width must be numeric.');  }
	get width() {return this.#sWidth;}
	set height(h) {
		if (Number.isNumeric(h))  {
			this.#sHeight=round(h);  this.#_scale=h/this.#nHeight;   this.#sWidth=round(this.#nWidth*this.#_scale);  }
		else  throw new TypeError('ImageTile height must be numeric.');  }
	get height() {return this.#sHeight;}
	#nWidth;
	#nHeight;
	#sWidth;     // auto-scaled by this class
	#sHeight;    // auto-scaled by this class
	#_scale;
	set scale(s) {
		s=Number.parsePercent(s, 'ImageTile scale must be numeric.');
		if (this.image.naturalWidth===undefined)  {this.width=this.image.width;  this.height=this.image.height;}
		else  {this.width=this.image.naturalWidth;  this.height=this.image.naturalHeight;}
		this.#_scale=s;  this.width=this.#nWidth*s;  this.height=this.#nHeight*s;  }
	get scale() {return this.#_scale;}
	get center() {return {x:floor(this.#sWidth/2), y:floor(this.#sHeight/2)}}
	crop;      // {left: , top: , width: , height: } ← values BEFORE scaling when "blend"; AFTER scaling when "apply"

	constructor($name, $image, $composite='source-over', $alpha=1, $scale=1, $crop)  {
		super($name);
		if ($image instanceof HTMLCanvasElement
		||  $image instanceof HTMLImageElement
		||  $image instanceof SVGImageElement
		||  $image instanceof HTMLVideoElement
		||  $image instanceof ImageBitmap
		||  $image instanceof Image)  {
			this.image=$image;
			this.composite=$composite;  // typically: 'source-over' ← alpha blends  or  'copy' ← alpha replaces
			this.alpha=$alpha;
			this.crop=$crop;
			if (this.image.naturalWidth===undefined)  {this.#nWidth=this.image.width;  this.#nHeight=this.image.height;}
			else  {this.#nWidth=this.image.naturalWidth;  this.#nHeight=this.image.naturalHeight;}
			this.scale=$scale;  }
		else
			throw new TypeError('Unrecognized image format for '+this.name+'.\n  ',$image,' typeof ',typeof $image);  }

	getAttendedPixels($canvas, $margin)  {
		if ($margin) this.margin=$margin;
		this.attendedPixels={
			left:   max(0, this.margin.left),
			top:    max(0, this.margin.top),
			right:  min($canvas.width,  $canvas.width-this.margin.right),   //this.width+this.margin.left
			bottom: min($canvas.height, $canvas.height-this.margin.bottom)  };  //this.height+this.margin.top
		return this.attendedPixels;  }

	// Note pixels are prepared based on a scaled version of the image.
	// When you call  getColorAt()  values passed in should reflect the scaled image.
	// this.width  and  this.height  reflect the scaled values here.
	// (Note  this.image.width  and  this.image.height  are CSS scaled values and are not relevent here.)
	// If you crop the image, the resulting pixel-block is also scaled.
	// Also note if you rescale or replace the image, the previously prepared pixels remain.  Use  releasePixels()
	preparePixels($p)  {
		if (this.#_scale===1  &&  this.alpha===1  &&  this.image instanceof HTMLCanvasElement)  {
			const ctx=this.image.getContext('2d');
			if (this.crop)
				ctx.preparePixelBlock({left:this.crop.left, top:this.crop.top,
															right:this.crop.left+this.crop.width, bottom:this.crop.top+this.crop.height});
			else
				ctx.preparePixelBlock();  }
		else  {
			const canvas=document.createElement('canvas');
			if (this.crop)  {
				canvas.width=this.crop.width*this.#_scale;  canvas.height=this.crop.height*this.#_scale;  }
			else  {
				canvas.width=this.#sWidth;  canvas.height=this.#sHeight;  }
			const ctx=canvas.getContext('2d');
			ctx.globalAlpha=this.alpha;
			ctx.globalCompositeOperation='copy';
			if (this.crop)
				ctx.drawImage(this.image,
											this.crop.left, this.crop.top, this.crop.width, this.crop.height,
											0,0, this.crop.width*this.#_scale, this.crop.height*this.#_scale );
			else
				ctx.drawImage(this.image,
											0,0, this.#nWidth, this.#nHeight,
											0,0, this.#sWidth, this.#sHeight );
			ctx.preparePixelBlock();  }
		const getPixel=ctx.getPixel;  //the values are self-contained in this closure; we want to loose the created canvas and context
		this.getColorAt=function(p) {const c=this.center, m=this.margin;  return getPixel(p.x+c.x+m.left, c.y+m.top-p.y);}
		if (arguments.length>=1) return this.getColorAt($p);  }

	getColorAt=this.preparePixels;  // the first time getColor is called, it automatically prepares pixels

	releasePixels() {this.getColorAt=this.preparePixels;}

	paintOn($context)  {
		const oldGA=$context.globalAlpha,
					oldGC=$context.globalCompositeOperation;
		$context.globalAlpha=this.alpha;
		$context.globalCompositeOperation=this.composite;
		if (this.crop)
			$context.drawImage( this.image,
													this.crop.left, this.crop.top, this.crop.width, this.crop.height,
													this.attendedPixels.left,
													this.attendedPixels.top,
													this.attendedPixels.right-this.attendedPixels.left,
													this.attendedPixels.bottom-this.attendedPixels.top);
		else
			$context.drawImage( this.image,
													this.attendedPixels.left,
													this.attendedPixels.top,
													this.attendedPixels.right-this.attendedPixels.left,
													this.attendedPixels.bottom-this.attendedPixels.top);
		$context.globalAlpha=oldGA;
		$context.globalCompositeOperation=oldGC;  }  }

ImageTile.prototype.name='Image Tile';



class Shape extends Tile  {  // this is an "abstract" class
	rainbow;    // Object manages the colors for this grafk
	doExtend;   // whether this tile’s grapfks overflow its width or height
	doReflect;  // if this tile’s grafks overflow, is the color sequence repeated or reflected?
	maxExtend=1;  // maximum number of “times” we can extend the grafik
	timesOut;   // the number of “times” we have extended the grafik with a specific pixel

	constructor($name, $rainbow) {
		if (new.target===Shape)
			throw new TypeError('A simple Shape class instance is insufficient. You must use a class extention.');
		super($name);
		this.rainbow=$rainbow;  }

	//  This method below will be passed pertinent variables once before the graphic creation process begins.
	//  this.height, this.width, and this.center[x,y] -must- be set (change them directly as nessesary)
	//   by this method to the needs of the class (using $radius, $hw['width'], $hw[ratio_1], and $rotate['graph']).
	//  Note this is **NOT** the __CONSTRUCT method.
	init($radius, $hw, $rotate, $spiral) {};

	// $p={x: , y: }
	getColorAt($p)  {const ci=this.getColorIndex($p);  return (ci===null) ? null : this.rainbow.getColor(ci);}

//    0    *    1         2   // span is the highest indx value allowed (5 in this example)
//    012345678901234567890   // indx value passed in (digits in row above are the “tens column” value)
//    012345432101234543210   // indx value out: reflected (works with integers or floating point equally well)
//    012345012345012345012   // indx value out: repeated  (demo of “byInt”)
//    012340123401234012340   // indx value out: repeated  (demo of floating point - values “almost” reach 5 but never go below 0)
	extender($indx, $span, $boost=false, $byInt=false)  {
		if ($indx/$span>this.maxExtend)  return null;
		if (this.doReflect)  {
			this.timesOut= $indx/$span + ($boost ? this.timesOut : 0);
			if ($span<.01)  return 0;
			while ($indx>$span)  {$indx=abs($span-($indx-$span));}  }
// colors at the edge of the graphic are “deprived” (whether reflecting, repeating, or not):
//   you can only round up OR down to them, not both.
		else  {
			// when “repeating” (below), colors at the edge of the colorband are “deprived” throughout the graphic
			//  (and mathematically speaking, the last is more deprived by an infinately small amount...)
			$byInt && ++$span;
			this.timesOut= $indx/$span + ($boost ? this.timesOut : 0);
			$indx=$indx%$span;  }
		return $indx;  }

	paintOn($context)  {
		const xOff=this.center.x-this.margin.left,
					yOff=this.margin.top+this.center.y;
		$context.preparePixelBlock(this.attendedPixels);
		for (let row=this.attendedPixels.top;  row<this.attendedPixels.bottom;  row++)  {
			for (let column=this.attendedPixels.left;  column<this.attendedPixels.right;  column++)  {
				const ci=this.getColorIndex({x: column-xOff,  y: yOff-row});
				if (null!==ci)
					$context.setPixel5Ch(column, row, this.rainbow.getColor(ci));  }  }
		$context.replacePixelBlock();  }  }

Shape.prototype.getAttendedPixels=getAttendedPixels;



// this trate is used by Shape and MosaicTiler
function getAttendedPixels($canvas, $margin)  {
		if ($margin) this.margin=$margin;
		if (this.doExtend)
			this.attendedPixels={
				left: 0,
				top:  0,
				right: $canvas.width,
				bottom:$canvas.height  };
		else
			this.attendedPixels={
				left:   max(0, this.margin.left),
				top:    max(0, this.margin.top),
				right:  min($canvas.width,  $canvas.width-this.margin.right),   //this.width+this.margin.left
				bottom: min($canvas.height, $canvas.height-this.margin.bottom)  };  //this.height+this.margin.top
		if ((this.attendedPixels.bottom-this.attendedPixels.top)*(this.attendedPixels.right-this.attendedPixels.left)
		 >  SoftMoon.WebWare.RainbowMaker.MAX_GRAFK_SIZE)  {
			const sq=round(sqrt(SoftMoon.WebWare.RainbowMaker.MAX_GRAFK_SIZE));
			throw new RangeError('Shape “'+this.name+'” is too large.  Must be less than '+SoftMoon.WebWare.RainbowMaker.MAX_GRAFK_SIZE+' attended pixels (≈'+sq+' by ≈'+sq+').');  }
		return this.attendedPixels;  }



// This Class will draw circular radial
// (or possibly multi-sectored spiraled-conic)
// gradients with sector limits.
// Its internal logic supports ellipse and other radial shapes through extentions.
class Radial extends Shape  {
	Xradius;
	Yradius;
	majorSemiAxis;
	hwRatio;
	whFactor;
	pieSlices;
	totalSlices;
	rotation;
	doSpiral;
	spiral;

	//  initialize radial graphics
	init($radius, $hw, $rotate, $spiral)  {
		this.majorSemiAxis = $radius = Number($radius);
		var hwRatio= $hw.ratio_1 = (Number($hw.ratio_1) || 1),
				slice, ts, rotation;
		this.hwRatio=hwRatio;
		this.whFactor=1/hwRatio;
		this.doExtend=Boolean.eval($hw.doExtend);
		this.maxExtend=$hw.maxExtend||1;
		this.doReflect=Boolean.eval($hw.doReflect);
		this.pieSlices=new Array;
		$rotate.pie_slices=readAngle($rotate.pie_slices, 'deg', 'rad');
		for (slice of $hw.pie_slices)  { if (Number.isNumeric(slice.from)  &&  Number.isNumeric(slice.to))  {
			if (slice.sliceFlag)  {
				ts=_360deg/slice.of;
				slice.from=radian(ts*(slice.number-1)-$rotate.pie_slices);
				slice.to=radian(slice.from+ts);  }
//				ts=_360deg/slice.from; // original PHP scheme was changed due to change in input-form
//				slice.from=radian(ts*(slice.to-1)-$rotate.pie_slices);
//				slice.to=radian(slice.from+ts);  }
			else  {
				slice.from=radian(readAngle(slice.from, 'deg', 'rad')-$rotate.pie_slices);
				slice.to=radian(readAngle(slice.to, 'deg', 'rad')-$rotate.pie_slices);  }
			if (slice.to < slice.from)  slice.xOrgFlag=true;
			if ($hw.pie_slices.squish)  {
				slice.from=ellipseAngle(slice.from, hwRatio);
				slice.to=ellipseAngle(slice.to, hwRatio);  }
			this.pieSlices.push(slice);  }  }
		if ( (this.totalSlices=this.pieSlices.length) > 0 )  {
			this.pieSlices=this.pieSlices.sort((a,b)=>a.from-b.from);
			//ksort(this.pieSlices);
			//array_multisort(array_subkey(this.pieSlices, 2, 'from'), this.pieSlices, SORT_NUMERIC);
			}
//console.log(this.pieSlices);
		if ( this.doSpiral=Boolean($spiral.doso) )  {
			this.spiral.Rotate=readAngle($spiral.rotate, 'deg', 'rad');
			this.spiral.Sectors=_360deg/$spiral.sectors;
			this.spiral.factor=Number($spiral.factor);
			this.spiral.Factor=this.majorSemiAxis/$spiral.factor;
			this.spiral.FactorA=this.spiral.Sectors*$spiral.factor;
			this.spiral.goCounterClockwise=($spiral.twist==='counter-clockwise');
			this.spiral.doSquish=Boolean.eval($spiral.squish);  }
//			this.spiral.doSquish=($spiral.squish==='true');  }
		// This will size the grafk to a rotated ellipse.
		// If your plugin shape recedes/exceeds this elliptical boundry, it should resize the grafk accordingly.
		// Your plugin shape may also place the grafkcenter as needed.
		this.rotation= rotation= readAngle($rotate.graph, 'deg', 'rad');
		if (hwRatio>1)  {
			this.Xradius = round($radius / hwRatio);  // (minorSemiAxis)
			this.Yradius = $radius;  }
		else  {
			this.Xradius = $radius;
			this.Yradius = round($radius * hwRatio);  }  // (minorSemiAxis)
		this.width =round(hypot(this.Xradius*cos(rotation), this.Yradius*sin(rotation)))*2+1;
		rotation+=_90deg;
		this.height=round(hypot(this.Xradius*cos(rotation), this.Yradius*sin(rotation)))*2+1;
		this.center.x=floor(this.width/2);
		this.center.y=floor(this.height/2);  }


	//  process circle, ellipse, and all other radial shapes
	getColorIndex($p)  {
		var offCenter, angle, i, radius;
		if (this.rotation)  rotate($p, this.rotation);
		offCenter=hypot($p.x, $p.y);
		angle=getAngle($p.x, $p.y);
		for (i=0; i<this.totalSlices; i++)  {
			if ( this.pieSlices[i].xOrgFlag  ?
				(angle>=this.pieSlices[i].from  ||  angle<=this.pieSlices[i].to)
			: (angle>=this.pieSlices[i].from  &&  angle<=this.pieSlices[i].to) )
				break;  }
		if (this.totalSlices>0  &&  i===this.totalSlices)  return null;
		// if not a circle, then calculate the length of the ray segment from centerpoint to shape edge, through pixel
		if (this.getRadius)  {
			radius=this.getRadius($p.x, $p.y, offCenter, angle);
			compressionFactor=(radius>0) ?  this.majorSemiAxis/radius  :  1;  }
		else  {  //default for circles
			radius=this.majorSemiAxis;
			compressionFactor=1;  }
		if (this.doExtend  &&  radius>.01)  {
			offCenter=this.extender(offCenter, radius);
			if (offCenter===null)  return null;  }
		else if (offCenter>radius)  return null;  //continue;
		offCenter=offCenter*compressionFactor;
		if (this.doSpiral)  {
			if (this.spiral.doSquish) angle=ellipseAngle(angle, this.whFactor);
			if (this.spiral.goCounterClockwise)  angle=_360deg-angle;
			angle=radian(angle+this.spiral.Rotate);
			if (this.doReflect)
				offCenter=(offCenter+this.spiral.Factor*(angle/this.spiral.Sectors) % this.spiral.Factor)*this.spiral.factor;
//				offCenter=fmod(offCenter+this.spiral.Factor*(angle/this.spiral.Sectors), this.spiral.Factor)*this.spiral.factor;
			else
				offCenter=(offCenter+this.spiral.Factor*((angle+this.spiral.FactorA*floor(this.timesOut) % _360deg)/this.spiral.Sectors) % this.spiral.Factor)*this.spiral.factor;
//				offCenter=fmod(offCenter+this.spiral.Factor*(fmod(angle+this.spiral.FactorA*floor(this.timesOut), _360deg)/this.spiral.Sectors), this.spiral.Factor)*this.spiral.factor;
			}
		return offCenter/radius;  }


	//  this is here for user-hacks.
	//  you may use this function as a method in your own Radial class extention.
	//  replacing it will not alter the current functionality.
	//  calling it directly will result in an error.
	static autosize=autosize;


	}  //  close  Radial Class

Radial.prototype.name='Circular Radial';



//  this class trate for Radial class extentions is available though the static value:
//    SoftMoon.WebWare.RainbowMaker.shapes.Radial.autosize;
//  it is used within as a trate by the  Polygonic  and  TwistedShimmeringStar  classes.
//  note that all  Shape  Tiles  should autosize themselves
function autosize($maxRadius, $hw)  {
	var rotate= radian(-this.rotation),
			circIncr= 1/$maxRadius,
			a, r, x, y,
			top, right, bottom, left;
	for (a=0; a<_2PI; a+=circIncr)  {
		r=this.getRadius(0, 0, $maxRadius, a);
		x=round(cos(a+rotate)*r);
		y=round(sin(a+rotate)*r);
		top=   max(y, top);
		right= max(x, right);
		bottom=min(y, bottom);
		left=  min(x, left);  }
	if ($hw.sizeTo==='shape')  {
		this.grafkwidth =abs(left)+right+1;
		this.grafkheight=abs(bottom)+top+1;
		this.grafkcenter.x=abs(left);
		this.grafkcenter.y=top;  }
	else  {
		this.grafkwidth =max(abs(left), right)*2+1;
		this.grafkheight=max(abs(bottom), top)*2+1;
		this.grafkcenter.x=floor(this.grafkwidth/2);
		this.grafkcenter.y=floor(this.grafkheight/2);  }  }




class Ellipse extends Radial {

	getRadius($x, $y)  { var angle;
		if ($x==0)  angle=_PI_2;
		else  angle=atan( (abs($y) / abs($x)) / this.hwRatio );
		return  hypot(this.Xradius*cos(angle), this.Yradius*sin(angle));  }  }

Ellipse.prototype.name='Elliptic Radial';


/*
 *The VectoredPolygon class defines & builds pre-made & user-made custom polygons for the Polygonic class.
	Each custom polygon is defined by its name and schema.
	The schema is a array of vertices with optional sides,
and this schema is what is passed on as the data set “plugin” to the
Polygonic Class for the Rainbow Maker.
	The name of each custom polygon is only for reference convienience.
	The vertices are defined in polar coordinates, that is, by angle (in radians) and the radius at that vertice point.
	The radius is, in this case, a ratio of the Rainbow Class’ colorband, or more specifically, the ratio of
the eliptic radius at the given angle of the imaginary ellipse that contains the Irregular Polygon,
which is itself a ration of the Rainbow Maker’s colorband.  A value of 0 means the shape caves in to the centerpoint;
while a value of 1 means the shape protrudes out from the centerpoint at that vertice the full length of the colorband;
while values greater than 1 “stretch” the colorband, which, if extreme, can lead to “banding” of the color-gradient.
	Put simply, the radius must be a value greater than 0, and should be no more than 1.  However, note this is to
*calculate* the final value; the radius passed in to various ==building== methods herein should be realtime values and
should correspond with the maxRadius value also passed in.  See additional comments on this below.
	If no side is defined, it is assumed to be a strait line.
	If a side is defined, it must be a wrapper lambda “init” function defining another lambda function
that can define the side using the polar corordinates passed into it.
Sides define the side between the ¡next! vertice and the vertice that the lambda function is associated with.
A side defined with the last vertice connects to the first vertice.
The values passed into each side-defining lambda wrapper function are:
$r1, $r2 = the radius at each vertice (in pixels).
$a1, $a2 = the angle at each vertice.
The value passed into each side-building lambda function is:
$angle = the angle of the pixel-in-question (from the (+) x-axis)
				that lies between the two vertices {$a1, $r1} and {$a2, $r2}.
The wrapper function should do any pre-calculation overhead and return the side-building lambda function.
The side-building lambda function should return the radius of the shape at the given $angle.

	•You may use this class to build your own schemas to add to the list of pre-defined ones,
	•You may use this class to build your own ready-to-use-now schema.

	Use  makeSide()  addXYToShape()  addPolarToShape()  sort()
to build your own shape schemas.
	Use  readyNamedPolygon()
to save your schema in the VectoredPolygon.plugins Object for future retreival
	Use  initSchema()
when you are ready to use any plugin (pre-defined or your custom ones)
before passing it into a Polygonic class instance.

	When building a custom schema that you want to use again,
pass in ¡string-names! pertaining to the type of sides you want if they are standard.  For example:
		myPoly.addXYToShape( 14, 21, 37, 'curved', array('index'=>1, 'swell'=>.618, 'count'=>1) );
	Calling the readyNewPolygon('nameOfMyPolygon') method will add your schema to the pre-defined list.
	While you also can technically pass in lambda functions directly and save it to the list,
if you want to save the all the created VectoredPolygon schemas to a file,
it is best to save sides as strings, then use initSchema later when you use the schema.

	When building a custom schema that you simply want to use now then discard,
pass in the lambda functions ¡directly!  For example:
		myPoly.addPolarToShape(
			_90deg,
			.618, 1,
			VectoredPolygon.makeSide('curved', array('index'=>1, 'swell'=>.618, 'count'=>1)));
*/
class VectoredPolygon extends Array {  //for building plugins to the Polygonic class

	addXYToShape($x, $y, $maxRadius=1, $side=null, $specs=null)  { // (x,y) is based on the cartesian coordiante system
		if (!Number.isNumeric($x)  ||  !Number.isNumeric($y)  ||  !Number.isNumeric($maxRadius))
			throw new TypeError('Coordinate and maxRadius values must be numeric to create custom Irregular Polygons.');
		$maxRadius=Number($maxRadius);
		this.addPolarToShape(getAngle($x, $y), hypot($x, $y), $maxRadius, $side, $specs);  }

	// (a,r) is point defined by angle, radius in the polar coordinate system.
	// maxRadius is the radius (at the given angle) of the imaginary ellipse that contains the polygon.
	// If maxRadius is less than the given radius, the Rainbow Class colorband will be stretched...but it’s possible.
	// Theoretically, one or more vertices should lie on the maxRadius, while the rest of vertices lie within.
	// If the side is left undefined, the Polygonic Class plugin for the Rainbow Class will make the side a strait line.
	addPolarToShape($a, $r, $maxRadius=1, $side=null, $specs=null)  {
		if (!Number.isNumeric($a)  ||  !Number.isNumeric($r)  ||  !Number.isNumeric($maxRadius))
			throw new TypeError('Coordinate and maxRadius values must be numeric to create custom Polygons.');
		$a=Number($a);
		if (0>=$maxRadius)
			throw new RangeError('“maxRadius” must be a positive number (greater than zero) to create custom Polygons.');
		var n={angle: $a, radius: $r/$maxRadius};
		if (VectoredPolygon.makeSide.sideTypes.includes($side))  {
			n.side=$side;
			if ($specs instanceof Object)  n.specs=$specs;  }
		else if ($side instanceof Function)  n.side=$side;
		else if ($side!==null  &&  $side!==undefined)
			throw new Error('Customized sides must be pre-defined or defined by a lambda function when creating custom Polygons.');
		this.push(n);  }

	sort()  { //This will sort the new shape’s vertices by angles in ascending order.
		//At this time, the logic in the Polygonic class is simple, and requires the shape be sorted this way.
		//A ray from the grafk center may not pass through more than one side
		super.sort(function(a,b) {return a.angle - b.angle;});  }

	initSchema()  {
		for (var v_s of this)  {  // vertex and side
			if (typeof v_s.side === 'string')  {
				v_s.side=VectoredPolygon.makeSide(v_s.side, v_s.specs);
				delete v_s.specs;
				}  }  }

	readyNamedPolygon($n)  {
		if (!($n instanceof String)  ||  $n==="")
			throw new TypeError('Your custom Polygon must be given a name as a string.');
		if (VectoredPolygon.plugins[$n])
			throw new Error('Your custom Polygon must have a unique name: “'+$n+'” is taken.');
		if (this.length<3)
			throw new RangeError('Your custom Polygon must have 3 sides or more.');
		VectoredPolygon.plugins[$n]=this;  }

						//SoftMoon.WebWare.RainbowMaker.Polygonic.VectoredPolygon.plugins
	static plugins={

		"trapazoid":[  //this is a “schema”
			{'angle':_._70deg, 'radius':.7},
			{'angle':_._110deg, 'radius':.7},
			{'angle':_._225deg, 'radius':1},
			{'angle':_._315deg, 'radius':1} ],

		"bowtie":[  //this is a “schema”
			{'angle':_._30deg, 'radius':1, 'side':"curved", 'specs':{'index':.618, 'swell':.382, 'arc':_._180deg}},
			{'angle':_._90deg, 'radius':.25, 'side':"curved", 'specs':{'index':1.618, 'swell':.382, 'arc':_._180deg}},
//  ¡¡¡  what the fuck is 540deg?
			{'angle':_._150deg, 'radius':1, 'side':"curved, zigzag", 'specs':{'index':1, 'swell':.0618, 'arc':_._540deg, 'height':.618, 'count':12}},
			{'angle':_._210deg, 'radius':1, 'side':"curved", 'specs':{'index':.618, 'swell':.382, 'arc':_._180deg}},
			{'angle':_._270deg, 'radius':.25, 'side':"curved", 'specs':{'index':1.618, 'swell':.382, 'arc':_._180deg}},
			{'angle':_._330deg, 'radius':1, 'side':"curved, zigzag", 'specs':{'index':1, 'swell':.0618, 'arc':_._540deg, 'height':.618, 'count':12}} ],

		"heart":[   //this is a “schema”
			{'angle':_._20deg, 'radius':1, 'side':"curved", 'specs':{'index':1.382, 'swell':.382, 'arc':_._180deg}},
			{'angle':_._60deg, 'radius':.95, 'side':"curved", 'specs':{'index':.724, 'swell':.618, 'arc':_._180deg}},
			{'angle':_._90deg, 'radius':.382, 'side':"curved", 'specs':{'index':1.382, 'swell':.618, 'arc':_._180deg}},
			{'angle':_._120deg, 'radius':.95, 'side':"curved", 'specs':{'index':.724, 'swell':.382, 'arc':_._180deg}},
			{'angle':_._160deg, 'radius':1},
			{'angle':_._270deg, 'radius':1} ],

		"club":[    //this is a “schema”
			{'angle':_._32deg, 'radius':.37, 'side':"curved", 'specs':{'index':1, 'swell':1, 'arc':_._180deg}},
			{'angle':_._148deg, 'radius':.37, 'side':"curved", 'specs':{'index':.456, 'swell':1.7, 'arc':_._180deg}},
			{'angle':_._268deg, 'radius':.15},
			{'angle':_._268deg, 'radius':1},
			{'angle':_._272deg, 'radius':1},
			{'angle':_._272deg, 'radius':.15, 'side':"curved", 'specs':{'index':2.2, 'swell':1.7, 'arc':_._180deg}} ],

		"spade":[   //this is a “schema”
			{'angle':_._60deg, 'radius':.618},
			{'angle':_._90deg, 'radius':1},
			{'angle':_._120deg, 'radius':.618, 'side':"curved", 'specs':{'index':.5, 'swell':.2, 'arc':_._180deg}},
			{'angle':_._220deg, 'radius':.8, 'side':"curved", 'specs':{'index':.618, 'swell':1.2, 'arc':_._180deg}},
			{'angle':_._268deg, 'radius':.13},
			{'angle':_._268deg, 'radius':1},
			{'angle':_._272deg, 'radius':1},
			{'angle':_._272deg, 'radius':.13, 'side':"curved", 'specs':{'index':1.618, 'swell':1.2, 'arc':_._180deg}},
			{'angle':_._320deg, 'radius':.8, 'side':"curved", 'specs':{'index':2, 'swell':.2, 'arc':_._180deg}} ],

		"converse":[   //this is a “schema”
			{'angle':_._13deg, 'radius':.89, 'side':"curved", 'specs':{'index':1, 'swell':.382, 'arc':_._180deg}},
			{'angle':_._24deg, 'radius':.75, 'side':"curved", 'specs':{'index':1, 'swell':.382, 'arc':_._180deg}},
			{'angle':_._43deg, 'radius':.92, 'side':"curved", 'specs':{'index':1, 'swell':.618, 'arc':_._180deg}},
			{'angle':_._67deg, 'radius':.80, 'side':"curved", 'specs':{'index':1, 'swell':.382, 'arc':_._180deg}},
			{'angle':_._88deg, 'radius':.85, 'side':"curved", 'specs':{'index':1, 'swell':.382, 'arc':_._180deg}},
			{'angle':_._113deg, 'radius':.7, 'side':"curved", 'specs':{'index':1, 'swell':.618, 'arc':_._180deg}},
			{'angle':_._133deg, 'radius':.9, 'side':"curved", 'specs':{'index':1, 'swell':.618, 'arc':_._180deg}},
			{'angle':_._167deg, 'radius':.84, 'side':"curved", 'specs':{'index':1, 'swell':.618, 'arc':_._180deg}},
			{'angle':_._187deg, 'radius':.96, 'side':"curved", 'specs':{'index':1, 'swell':.618, 'arc':_._180deg}},
			{'angle':_._200deg, 'radius':.83, 'side':"curved", 'specs':{'index':1, 'swell':.618, 'arc':_._180deg}},
			{'angle':_._222deg, 'radius':.89, 'side':"curved", 'specs':{'index':1, 'swell':.618, 'arc':_._180deg}},
			{'angle':_._247deg, 'radius':.79, 'side':"curved", 'specs':{'index':1, 'swell':.618, 'arc':_._180deg}},
			{'angle':_._260deg, 'radius':.87, 'side':"curved", 'specs':{'index':1, 'swell':.618, 'arc':_._180deg}},
			{'angle':_._277deg, 'radius':.80, 'side':"curved", 'specs':{'index':1, 'swell':.618, 'arc':_._180deg}},
			{'angle':_._292deg, 'radius':1},
			{'angle':_._302deg, 'radius':1.7},
			{'angle':_._320deg, 'radius':.77, 'side':"curved", 'specs':{'index':1, 'swell':.382, 'arc':_._180deg}},
			{'angle':_._354deg, 'radius':.85, 'side':"curved", 'specs':{'index':1, 'swell':.618, 'arc':_._180deg}} ]
	};

	static { for (const schema in this.plugins)  {
		Object.defineProperty(this.plugins[schema], 'initSchema', {value: VectoredPolygon.prototype.initSchema});  }  }

	static initSchema($schema) {VectoredPolygon.prototype.initSchema.call($schema);}


	// This will return a lambda closure function that you can pass into addXYToShape() or addPolarToShape() as the 'side'
	//  or you can use it to “manually” build your own VectoredPolygon/Array instance to pass into the Polygonic class.
	// ¡Note that you can also pass a string value into addXYToShape() or addPolarToShape()
	//  as the 'side' (along with the $specs) if it matches a $type below,
	//  and that will simplify things; call initSchema() when done and makeSide will then be automatically called.
	static makeSide($type, $specs)  { switch ($type)  {    //a bit redundant here, but built for speed:

		case 'curved': return function ($r1, $r2, $a1, $a2)  {
		var p1_p2=sqrt($r1*$r1 + $r2*$r2 - 2*$r1*$r2*cos($a2-$a1+_2PI)),  //the distance between the two vertices
				rotate=cos( atan(($r2-$r1)/sqrt(pow(p1_p2,2)-pow(($r2-$r1),2))) ); //rotate it by the polar-slope angle
		$specs.swell*=p1_p2;  // p1_p2*(_PI/$specs.arc);
		return function($angle)  {
				// r is the distance AT the given angle FROM the origin TO the LINE-SEGMENT connecting the two vertices:
			var r=$r1*$r2*sin($a2-$a1+_2PI) / ($r1*sin($angle-$a1+_2PI) - $r2*sin($angle-$a2+_2PI)),
					p1_p=sqrt($r1*$r1 + r*r - 2*$r1*r*cos($angle-$a1+_2PI)),  //the distance between (a1,r1) and (angle,r)
				// c is the amount of curvature away from the LINE-SEGMENT connecting the two vertices (at the given percent of distance along the LINE-SEGMENT):
					c=sin( $specs.arc * (atan(tan( (p1_p/p1_p2)*_PI_2 )*$specs.index)/_PI_2) )*$specs.swell  *  rotate;
			return r+c;  };  };

		case 'zigzag': return function($r1, $r2, $a1, $a2)  {
		var p1_p2=sqrt($r1*$r1 + $r2*$r2 - 2*$r1*$r2*cos($a2-$a1+_2PI)),  //the distance between the two vertices
				zz=p1_p2/$specs.count,
				rotate=cos( atan(($r2-$r1)/sqrt(pow(p1_p2,2)-pow(($r2-$r1),2))) ); //rotate it by the polar-slope angle
		$specs.height*=zz;
		return function($angle)  {
				// r is the distance AT the given angle FROM the origin TO the LINE-SEGMENT connecting the two vertices:
			var r=$r1*$r2*sin($a2-$a1+_2PI) / ($r1*sin($angle-$a1+_2PI) - $r2*sin($angle-$a2+_2PI)),
					p1_p=sqrt($r1*$r1 + r*r - 2*$r1*r*cos($angle-$a1+_2PI)),  //the distance between (a1,r1) and (angle,r)
				// z is the amount of zig-zag away from the LINE-SEGMENT connecting the two vertices (at the given percent of distance along the LINE-SEGMENT):
					z=atan(tan( (fmod(p1_p, zz)/zz)*_PI_2 )*$specs.index)/_PI_2;
					z=((z<.5 ? (z*2) : ((1-z)*2))-.5)*$specs.height  *  rotate;
			return r+z;  };  };

		case 'curved, zigzag': return function($r1, $r2, $a1, $a2)  {
		var p1_p2=sqrt($r1*$r1 + $r2*$r2 - 2*$r1*$r2*cos($a2-$a1+_2PI)),  //the distance between the two vertices
				zz=p1_p2/$specs.count,
				rotate=cos( atan(($r2-$r1)/sqrt(pow(p1_p2,2)-pow(($r2-$r1),2))) ); //rotate it by the polar-slope angle
		$specs.swell*=p1_p2;  // p1_p2*_PI_2 / $specs.arc
		$specs.height*=zz;
		return function($angle)  {
				// r is the distance AT the given angle FROM the origin TO the LINE-SEGMENT connecting the two vertices:
			var r=$r1*$r2*sin($a2-$a1+_2PI) / ($r1*sin($angle-$a1+_2PI) - $r2*sin($angle-$a2+_2PI));
					p1_p=sqrt($r1*$r1 + r*r - 2*$r1*r*cos($angle-$a1+_2PI));  //the distance between (a1,r1) and (angle,r)
				// c is the amount of curvature away from the LINE-SEGMENT connecting the two vertices (at the given percent of distance along the LINE-SEGMENT):
					c=sin( $specs.arc * (atan(tan( (p1_p/p1_p2)*_PI_2 )*$specs.index)/_PI_2) )*$specs.swell  *  rotate;
				// z is the amount of zig-zag away from the LINE-SEGMENT connecting the two vertices (at the given percent of distance along the LINE-SEGMENT):
					z=atan(tan( (fmod(p1_p, zz)/zz)*_PI_2 )*$specs.index)/_PI_2;
					z=((z<.5 ? (z*2) : ((1-z)*2))-.5)*$specs.height  *  rotate;
			return r+c+z;  };  };

		default: return null;  }  }

	static {
			//  found at:  SoftMoon.WebWare.RainbowMaker.Polygonic.VectoredPolygon.makeSide.sideTypes
		Object.defineProperty(this.makeSide, 'sideTypes', {value:['curved', 'zigzig', 'curved, zigzag'], enumerable: true});
		Object.freeze(this.makeSide.sideTypes);  }
}  // close VectoredPolygon class

VectoredPolygon.prototype.isUserShape=true;



// to use the Polygonic Class, you must create an array of objects defining the points, and optionally the sides, of the polygon.
// (see also the VectoredPolygon class)
// points are given in polar form, i.e. by angle (counter-clockwise) from the positive X-axis, and radial distance from center
// example follows
// (all angles must be in radians, and should progress from smallest to largest)
// (all radius values are given in ratios, where “1” is the natural length of the colorband)
// (if no side is defined (between two points) it will make a “strait edge”)
//  $shape=[
//    {'angle'=(_45deg), 'radius'=(.618)},  /*this will be a strait edge from this point to next point*/
//    {'angle'=(_90deg), 'radius'=(.382)},  /*this will be a strait edge from this point to next point*/
//    {'angle'=(_180deg), 'radius'=1,
//     'side'=function($r1, $r2, $a1, $a2)  { /*values passed in are radius(pixels) and angle(radians)*/
//             /* values passed in are the vertexes where this side begins and ends (this point & next point). */
//             /* do something here to prepare your function.  This wrapper must return another function:  */
//             return function($angle)  use  (/*values calculated in the wrapper*/) {  /* ← PHP syntax*/
//               /* do something here to shape the side from this point to next point */  }} },
//    {'angle'=(_270deg), 'radius'=(.75)}  /*this will be a strait edge from this point to FIRST point*/
//  ];
//
class Polygonic extends Radial  {
	static VectoredPolygon=VectoredPolygon;
	shape;
	vertices;

	constructor($name, $rainbow, $shape)  {
		super($name, $rainbow);
		this.shape=$shape;
		this.vertices=$shape.length;
		this.name=$shape.name+this.name;  }

	init($maxRadius, $hw, $rotate, $spiral)  {
		super.init($maxRadius, $hw, $rotate, $spiral);
		for (i=0; i<this.vertices;  i++)  {
			this.shape[i].angle = ellipseAngle(this.shape[i].angle, $hw.ratio_1);
			this.shape[i].radius *= hypot(this.Xradius*cos(this.shape[i].angle), this.Yradius*sin(this.shape[i].angle));  }
		this.initSides();
		this.autosize($maxRadius*1.02, $hw);  }

	initSides()  {
		for (i=0, li=this.vertices-1;  i<this.vertices;  li=i++)  {
			if (this.shape[li].side instanceof Function)
				this.shape[li].side = this.shape[li].side(  //this function should return a function
					this.shape[li].radius, this.shape[i].radius,
					this.shape[li].angle, this.shape[i].angle );  }  }

	getRadius($x, $y, $, $angle)  {
		var shape=this.shape, i, li;
		for (i=0; i<this.vertices;  i++)  {if ($angle<=shape[i].angle)  break;}
		li=(i==0) ? (this.vertices-1) : (i-1);
		if (i==this.vertices)  i=0;
		if (shape[li].side)
			return shape[li].side($angle);
		else  return  //thanks to Dr. Math’s FAQ page at http://mathforum.org/dr.math/faq/formulas/faq.polar.html for the basis of this formula!
			shape[li].radius*shape[i].radius*sin(shape[i].angle-shape[li].angle+_2PI) / (shape[li].radius*sin($angle-shape[li].angle+_2PI) - shape[i].radius*sin($angle-shape[i].angle+_2PI));  }  }

Polygonic.prototype.name='Polygonic Radial';
Polygonic.prototype.autosize=autosize;  //this trate is shared with  TwistedShimmeringStar



class RegularPolygon extends Polygonic  {
	isStar;
	side;

	constructor($name, $rainbow, $star=false, $side)  {
		super($name, $rainbow);
		this.isStar=Boolean($star);
		if ($side instanceof Function)  this.side=$side;  }

	init($radius, $hw, $rotate, $spiral)  {
		super.super.init($radius, $hw, $rotate, $spiral);
		this.shape=new Array;
		this.vertices=round($hw.sectors_1);
		var pointDepth, sector, rotatePoints, rotate,
				i, top, right, bottom, left, a, h, x, y;
		if (this.isStar)  {pointDepth=1-$hw.depth;  this.vertices*=2;}
		sector=_2PI/this.vertices;
		rotatePoints= radian(-readAngle($rotate.sectors_1, 'deg', 'rad'));
		rotate= radian(-readAngle($rotate.graph, 'deg', 'rad'));
		this.grafkwidth= this.grafkheight= 0;
		for (i=0; i<this.vertices; i++)  {
			a= this.shape[i].angle= ellipseAngle(sector*i+_PI_2+rotatePoints, $hw.ratio_1);
			h= this.shape[i].radius=
				hypot(this.Xradius*cos(a), this.Yradius*sin(a)) * ((this.isStar  &&  (i&1)) ? pointDepth : 1);
			if (this.side)  this.shape[i].side=this.side;
			x=round(cos(a+rotate)*h);  y=round(sin(a+rotate)*h);
			top=   max(y, top);
			right= max(x, right);
			bottom=min(y, bottom);
			left=  min(x, left);  }
		if ($hw.sizeTo==='shape')  {
			this.grafkwidth =abs(left)+right+1;
			this.grafkheight=abs(bottom)+top+1;
			this.grafkcenter.x=abs(left);
			this.grafkcenter.y=top;  }
		else  {
			this.grafkwidth =max(abs(left), right)*2+1;
			this.grafkheight=max(abs(bottom), top)*2+1;
			this.grafkcenter.x=floor(this.grafkwidth/2);
			this.grafkcenter.y=floor(this.grafkheight/2);  }
		this.shape.sort(function(a,b){return a.angle-b.angle});
		if (this.side)  this.initSides();  }  }



// You may extend this class with additional formulas to create the point shape...
class TwistedShimmeringStar extends Radial  {

	star;
	hook;
	pointDepth;
	pointSpread;
	pinwheel;
	spinDirection;
	twist;
	shimmer;
	shimmerHand;
	twistMax;
	shimmerMax;
	curveFactor;
	errors=new Array;

	//  The $ellipticRadius is the distance from the centerpoint to the ellipse edge that “contains” the star,
	//   as the length of the ray-segment of the ray that passes through the pixel in question.
	//  The value of $segment is from 0 to 1, with 0 being the outer star-point, and 1 being the inner star-point.
	//  This value is a “percentage” of the ARC of the ellipse that contains the star;
	//   and said arc is 1/2 of the arc between two adjacent outer star-points.
	static Stars={
	'starlet': function($ellipticRadius, $segment)  {return $ellipticRadius - $ellipticRadius*this.pointDepth*$segment;},
	'star☼1': function($ellipticRadius, $segment)  {return $ellipticRadius - $ellipticRadius*this.pointDepth*(atan(tan(acos($segment))/this.curveFactor)/_PI_2);},
	'star☼2': function($ellipticRadius, $segment)  {return $ellipticRadius - $ellipticRadius*this.pointDepth*(atan(tan(asin($segment))/this.curveFactor)/_PI_2);},
	'star☼3': function($ellipticRadius, $segment)  {return $ellipticRadius - $ellipticRadius*this.pointDepth*(atan(tan($segment * _PI_2)/this.curveFactor)/_PI_2);},
	'star☼4': function($ellipticRadius, $segment)  {return $ellipticRadius - $ellipticRadius*this.pointDepth*sin(atan(tan(asin($segment))/this.curveFactor));},
	'star☼5': function($ellipticRadius, $segment)  {return $ellipticRadius - $ellipticRadius*this.pointDepth*sin(atan(tan($segment * _PI_2)/this.curveFactor));}
	};

	static getStars()  {return Object.keys(TwistedShimmeringStar.Stars);}


	// pass in the string-name of the point shape formula when creating an instance...
	// if you extend this class with your own formula, the $hook() method (if any) will be called from the init() method
	constructor($name, $rainbow, $star, $hook=false)  {
		super($name, $rainbow);
		if ((TwistedShimmeringStar.Stars[$star] instanceof Function)
		&&  ($hook===false  ||  ($hook instanceof Function)))
			{this.star=$star;  this.hook=$hook;}
		else  {this.star='starlet';  this.hook=false;}  }

	init($maxRadius, $hw, $rotate, $spiral)  {
		var temp;
		super.init($maxRadius, $hw, $rotate, $spiral);
		this.pointDepth=Number($hw.depth);
		this.differentialAngle=readAngle($rotate.sectors_1, 'deg', 'rad') +
			(this.star==='star☼1') ? (-(_90deg)) : _90deg;  //to rotate odd-number-pointed stars to point up
		this.pointSpread=(_360deg/$hw.sectors_1);
		this.pinwheel=this.pointSpread/abs($rotate.pinwheel);
		this.spinDirection= ($rotate.pinwheel<0)  ?
			0  :  (this.pointSpread-this.pointSpread*abs($rotate.pinwheel))/this.pointSpread;
		this.twist=$rotate.twist;
		this.shimmer=$rotate.shimmer;
		if (this.twist.extent!==INFINITY
		&&  (1-this.twist.depth) > this.twist.extent)  { temp=this.twist.extent;
			this.twist.extent=1-this.twist.depth;
			this.twist.depth=1-temp;
			this.errors.push('Twist depth greater than extent.  Values swapped.');  }
		if (this.shimmer.extent!==INFINITY
		&&  (1-this.shimmer.depth) > this.shimmer.extent)  { temp=this.shimmer.extent;
			this.shimmer.extent=1-this.shimmer.depth;
			this.shimmer.depth=1-temp;
			this.errors.push('Shimmer depth greater than extent.  Values swapped.');  }
		this.shimmer.amount=abs(this.shimmer.amount);
		this.shimmerHand= ($rotate.shimmer.amount>0)  ?  0 : _PI;
		this.twistMax= (this.twist.extent===INFINITY)  ?  Infinity : 1;
		this.shimmerMax= (this.shimmer.extent===INFINITY)  ?  Infinity : 1;
		switch (this.star)  {
		case "star☼2":     //   ☆¸¸.•*´¨`*•.¸¸☆
		case "star☼3":
		case "star☼4": {this.curveFactor=$hw.depth*$hw.swell;  break;}
		case "star☼1":
		case "star☼5": {this.curveFactor=$hw.swell;  break;}  }
		this.star=TwistedShimmeringStar.Stars[this.star];
		if (this.hook)
			this.hook($maxRadius, this.Xradius, this.Yradius, $hw, $rotate, this);
		// she's very sensitive to where you touch her round-off errors, so we bump-up the maxRadius just a bit.
		this.autosize($maxRadius*1.02, $rotate, $hw, this);  }

	getRadius($x, $y, $offCenter, $angle)  {
		var ellipticRadius, twistDepth, twistExtent, shimmerDepth, shimmerExtent, segment;
		$angle=ellipseAngle($angle, this.whRatio);  //we need the scrunched angle
		ellipticRadius=hypot(this.Xradius*cos($angle), this.Yradius*sin($angle));
		twistDepth=ellipticRadius - ellipticRadius*this.twist.depth;
		twistExtent= (this.twist.extent===INFINITY)  ?
				ellipticRadius
			: abs(ellipticRadius*this.twist.extent-twistDepth);
		twistDepth=($offCenter-twistDepth)/twistExtent;
		twistDepth=(twistDepth<0) ? 0 : (twistDepth>this.twistMax ? 1 : twistDepth);
		shimmerDepth=ellipticRadius - ellipticRadius*this.shimmer.depth;
		shimmerExtent= (this.shimmer.extent===INFINITY)  ?
				ellipticRadius
			: abs(ellipticRadius*this.shimmer.extent-shimmerDepth);
		shimmerDepth=($offCenter-shimmerDepth)/shimmerExtent;
		shimmerDepth=(shimmerDepth<0) ? 0 : (shimmerDepth>this.shimmerMax ? 1 : shimmerDepth);
		$angle+=this.differentialAngle
					+ this.pointSpread*this.twist.amount*twistDepth
					+ this.pointSpread*sin(shimmerDepth*_PI*this.shimmer.wiggles+this.shimmerHand)*this.shimmer.amount*pow(this.shimmer.expand, shimmerDepth);
		$angle=radian($angle);
		segment=2*(fmod($angle, this.pointSpread)/this.pinwheel + this.spinDirection);
		segment=(segment < 1) ? (1-segment) : (segment-1);
		return this.star(ellipticRadius, segment);  }  }

TwistedShimmeringStar.prototype.name="Twisted Shimmering Star"
TwistedShimmeringStar.prototype.autosize=autosize; // this trate is shared with  Polygonic



class Flower extends Radial  {
	sectors;
	depthFactor;
	Xd;
	Yd;

	init($maxRadius, $hw, $rotate, $spiral)  {
		super.init($maxRadius, $hw, $rotate, $spiral);
		this.sectors=$hw.sectors_1/2;
		this.depthFactor=(1-$hw.depth)/$hw.swell;
		if ($hw.depth>1)  {
			this.Xd = round($maxRadius / (1-$hw.depth));
			this.Yd = $maxRadius;  }
		else  {
			this.Xd = $maxRadius;
			this.Yd = round($maxRadius * (1-$hw.depth));  }
		this.grafkheight = this.grafkwidth = 0;
		$rotate=readAngle($rotate.graph, 'deg', 'rad');
		var ca=1/$maxRadius,
				i, i_, a, r;
		for (i=0; i<=_180deg; i+=ca)  {
			a=this.sectors*atan(tan(i)*this.depthFactor);  i_=ellipseAngle(i, this.whRatio);
			r=hypot(this.Xd*cos(a), this.Yd*sin(a))*(hypot(this.Xradius*cos(i_), this.Yradius*sin(i_))/$maxRadius);
			this.grafkheight=max(round(abs(sin(i+$rotate))*r)*2+1, this.grafkheight);
			this.grafkwidth =max(round(abs(cos(i+$rotate))*r)*2+1, this.grafkwidth);  }
		this.grafkcenter.x=floor(this.grafkwidth/2);
		this.grafkcenter.y=floor(this.grafkheight/2);  }

	getRadius($x, $y, $, $angle)  {
		var a;
		if ($x==0)  {$angle=_PI_2;  a=this.sectors*_PI_2;}
		else  {
			$angle=atan( (abs($y) / abs($x)) / this.hwRatio );
			a=this.sectors*atan( (abs($y) / abs($x)) * this.depthFactor );  }
		return  hypot(this.Xd*cos(a), this.Yd*sin(a))*(hypot(this.Xradius*cos($angle), this.Yradius*sin($angle))/this.majorSemiAxis);  }  }

Flower.prototype.name="Flower";


class RadialMask extends Radial  {
	mask;
	th;

	// $mask is a CavnvasRenderingContext2D instance, an HTML Canvas Element, or an HTML Image Element
	constructor($name, $rainbow, $mask, $threshold=85, $crop)  {
		super($name, $rainbow);
		if ($mask instanceof HTMLCanvasElement)  $mask=$mask.getContext('2d');
		else
		if ($mask instanceof Image)  {
			const canvas=document.createElement('canvas');
			canvas.width=$mask.width;  canvas.height=$mask.height;
			const proxy=canvas.getContext('2d'); // note all references to this temp canvas element and context are lost
			proxy.drawImage($mask, 0, 0);
			$mask=proxy;  }
		this.th=$threshold;
		if ($crop)
			this.mask=$mask.pixels=$mask.getImageData($crop.column, $crop.row, $crop.width, $crop.height);
		else
			this.mask=$mask.pixels=$mask.getImageData(0,0, $mask.canvas.width, $mask.canvas.height);
		$mask.pixels.get=function ($x, $y)  {
			const p=4*($y*this.width + $x);
			return [this.data[p], this.data[p+1], this.data[p+2]];  };  }  // , this.data[p+3]

	init($maxRadius, $hw, $rotate, $spiral)  {
		super.init($maxRadius, $hw, $rotate, $spiral);
		this.mask.ox=floor(this.mask.width/2);
		this.mask.oy=floor(this.mask.height/2);
		this.grafkheight=  this.mask.height;
		this.grafkwidth =  this.mask.width;
		if ($rotate=readAngle($rotate.graph, 'deg', 'rad'))  {
			let p={x:this.grafkwidth, y:this.grafkheight};
			rotateBox(p, $rotate);
			this.grafkwidth=p.x;
			this.grafkheight=p.y;  }
		this.grafkcenter.x=floor(this.grafkwidth/2);
		this.grafkcenter.y=floor(this.grafkheight/2);
		if (this.spiral.squish)
			this.whFactor=this.grafkwidth/this.grafkheight;  }

	getRadius($x, $y, $offCenter, $angle)  {
		var i, x, y,
				mask=this.mask,
				c=mask.get(mask.ox+$x, mask.oy-$y);
		if ((c[0]+c[1]+c[2])/3 > this.th)  i=$offCenter;  else  i=0;
		do {
			x=mask.ox+round(cos($angle)*(++i));
			y=mask.oy-round(sin($angle)*i);  }
		while (x>=0  &&  y>=0  &&  x<mask.width  &&  y<mask.height
			&&  (c=mask.get(x, y))  &&  (c[0]+c[1]+c[2])/3 > this.th);
		return i-1;  }  }

RadialMask.prototype.name='Raidal Mask'


/*   **********  that’s it for the Radial Shapes  **********   */





class Fountain extends Shape { // this is an "abstract" class

	constructor($name, $rainbow) {
		if (new.target===Fountain)
			throw new TypeError('A simple FountainShape class instance is insufficient. You must use a class extention.');
		super($name, $rainbow);  }

	setCenter($fountainHeight)  {
		this.center.x=floor(this.width/2);  //rotational center of graphic and “origin”
		this.center.b=floor(this.height/2)+round($fountainHeight/2);  //“origin” (base) 'y' value of uprighted fountains
		this.center.y=(this.reflect) ? this.center.b : floor(this.height/2);  //rotational center of graphic
		}
	// It is up to the host software to adjust this.center[x,y,b] for placement on the greater Canvas image,
	//  if {$column, $row} represent the absolute Canvas-image coordinates.
	getCoord(p)  {
		if (this.rotation)  rotate_around(p, this.rotation, this.center);
		return {x: p.x-this.center.x,  y: this.center.b-p.y};  }

	init($radius, $hw, $rotate, $spiral) {this.setCenter();}
	getColorAt($column, $row) {} //should call this.getCoord()
	}

Fountain.prototype.name='Fountain';



// you may extend this Class by replacing the getRadius method with your own to control the overall shape to your liking
class Geiser extends Fountain  {
	radius;
	hw;
	majorAxis;
	fountainheight;

	init($radius, $hw, $rotate, $spiral) {
		this.radius=$radius;  this.hw=$hw;
		this.majorAxis=round(2*$radius * $hw.ratio_1);
		this.depth=this.majorAxis*(1-$hw.depth);
		if (this.doSpiral=Boolean($spiral.doso))  this.spiralRate=this.majorAxis*$spiral.factor;
		this.fountainheight=$hw.span*this.majorAxis;
		$rotate= -(this.rotation=readAngle($rotate.graph, 'deg', 'rad'));
		var y, p1={}, p2={},
				cy=this.fountainheight/2;
		for (y=0;  y<this.fountainheight;  y++)  {
			p1.x= -(p2.x= this.getRadius(y));  p1.y=p2.y=y-cy;
			rotate(p1, $rotate);
			rotate(p2, $rotate);
			this.width =max(abs(round(p1.x))*2+1, abs(round(p2.x))*2+1, this.width);
			this.height=max(abs(round(p1.y))*2+1, abs(round(p2.y))*2+1, this.height);  }
		this.setCenter(this.fountainheight);  }

//  This method below returns the distance from the (“vertical”) center axis to the edge of the fountain shape,
//   as the length of the perpendicular (“horizontal”) line segment that passes through the point {x,y}
	getRadius($y)  {return pow(this.hw.swell, (this.majorAxis-abs($y))/this.majorAxis)*(abs($y/this.hw.ratio_1)/2);}

	getColorIndex($column, $row)  {
		var spread, p=this.getCoord({x:$column, y:$row});
		if (!this.doExtend  &&  (p.y<0  ||  p.y>this.fountainheight))  return null;
		spread=this.getRadius(p.y);  p.x=abs(p.x);
		if (spread>0  &&  this.doExtend)  {
			p.x=this.extender(p.x, spread);
			if (p.x===null)  return;  }
		else if (p.x>spread)  return (this.doExtend  &&  spread===0) ? 0 : null;
		else if (spread===0)  return 0;
		if (this.doReflect  &&  p.y<0)  p.x=spread-p.x;
		if (this.doSpiral)  p.x=fmod(this.radius*((spread-p.x)/spread + p.y/this.spiralRate), this.radius);
		else  p.x=this.radius*(p.x/spread);
		return round(p.x);  }  }

Geiser.prototype.name="Geiser";



//  To become  SimpleRibbon Class.......
class BasicGradient extends Fountain  {
	radius;
	hw;
	isSplitBlock;

	constructor($name, $isSplitBlock)  {
		super($name);
		this.isSplitBlock=Boolean(isSplitBlock);  }

	init($radius, $hw, $rotate, $spiral)  {
		this.radius=$radius;  this.hw=$hw;
		this.height=this.width=0;
		var i, $j=count($hw.width),  h=0,  c=$radius/2,
				$rotate= radian(-(this.rotation=readAngle($rotate.graph, 'deg', 'rad'))),
				p1={}, p2={};
		for (i=0; i<j; i++, h+=$hw.overspan[i])  {
			p1.x= -( p2.x= $hw.width[i]/2 );
			p1.y=p2.y=h-c;
			rotate(p1, $rotate);  rotate(p2, $rotate);
			this.height=max(round(abs(p1.y))*2+1, round(abs(p2.y))*2+1, this.height);
			this.width =max(round(abs(p1.x))*2+1, round(abs(p2.x))*2+1, this.width);  }
		this.setCenter($radius);  }

	getColorIndex($column, $row)  {
		var clr, i, j, w,
				p=this.getCoord({x:$column, y:$row});  p.y=round(p.y);
		if (this.doExtend)  {
			p.y=this.extender(p.y, this.radius, false, true);
			if (p.y===null)  return;  }
		else if (p.y<0  ||  p.y > this.radius)  return;
		clr=p.y; j=count(this.hw.width);
		for (i=1; i<j; i++)  {if (y<=this.hw.overSpan[i])  break;  else  y-=this.hw.overSpan[i];}
		return ((x= abs(x*2)) > (w= this.hw.width[i-1]+(this.hw.width[i]-this.hw.width[i-1])*(y/this.hw.overSpan[i])))  ?

//  *****  THIS WILL FAIL AND NEEDS ATTENTION!  →→→→→→→→→→→→↓↓↓↓↓↓

			((this.isSplitBlock && this.doExtend)  ?  round((this.extender(x, w, true)/w)*this.radius)  :  null)
		: (this.isSplitBlock  ?  round((x/w)*this.radius)  :  clr);  }  }

BasicGradient.prototype.name='Linear';



/*   **********  that’s it for the Shapes  **********   */




class MosaicTiler extends Tile {  //note you could build mosaics from other mosaics.......

	tiles;          // ← array of Tiles
	doExpand;       // ← Boolean
	sector;         // ← angle-value of a sector in radians
	totalSectors;   // ← integer
	rotation;       // ← in radians
	hwRatio;
	//If an extentional class composites the colors from multiple Tiles (Nebula, Spokes do this)
	//the paintOn() method needs to accomodate this.
	//If they don’t composite, it is faster to ignore this possibiility.
	//Note that Mosaics can contain other mosiacs,
	//and even if this Mosaic does not composite, the other mosaics may…
	doesComposite=false;

// $tiles is a numerically indexed array of NAMES of Tile object instances.
// $mosaic is an array of data specs for the desired mosic pattern.
	constructor($name, $tiles, $mosaic)  {
		super($name);
		if (new.target===MosaicTiler)
			throw new TypeError('A simple MosaicTiler class instance is insufficient. You must use a class extention.');
		if ($tiles instanceof Array)  {
			while ($tiles.length<$mosaic.sectors)  {$tiles=$tiles.concat($tiles);}
			$tiles.length=$mosaic.sectors;  }
		else  $tiles=Array($mosaic.sectors).fill($tiles);
		this.tiles=new Array;
		for (const tileName of $tiles)  {
			if (tileName===this.name)  throw new Error("Mosaics can not be made of themselves.  Tilename:",tileName);
			if (tileName==undefined)  this.tiles.push(new Tile);
			else  {
				const tile=RainbowMaker.tiles[tileName];
				/* NOTE: nesting Mosaics within Mosaics is fine…
				 * Nested Mosics may reference Tiles that match this Mosaic’s name, but…
				 * they all must be constructed first to be included in this Mosaic,
				 * and once constructed, the same-named tile is baked into the nested Mosaic, and names no longer matter.
				 * In that case, this tile replaces the tile with the same name in the RainbowMaker.tiles array/object,
				 * but said replaced tile still exists as part of the nested Mosiac.
				 * This allows RainbowMaker.wizard “plans” to be built from multiple files,
				 * and each file may use the same names without conflict, if they are ordered correctly internally.
				 */
				if (this===tile)  throw new Error("Mosaics can not be made of themselves.  Tilename:",tileName);
				if (tile instanceof Tile)  {
					if (tile.doExpand)  this.doExpand=true;
					if (tile.doesComposite)  this.doesComposite=true; }
				else throw new TypeError("Unrecognized Tile in MosaicTiler.  Tilename:",tileName);
				this.tiles.push(tile);  }  }
		this.sector=_2PI/$mosaic.sectors;
		this.totalSectors=$mosaic.sectors;
		this.rotation=readAngle($mosaic.rotate, 'deg', 'rad');
		this.hwRatio=$mosaic.hwRatio;  }

	paintOn($context)  {
		$context.preparePixelBlock(this.attendedPixels);
		if (this.doesComposite)
			for (let row=this.attendedPixels.top;  row<this.attendedPixels.bottom;  row++)  {
				for (let column=this.attendedPixels.left;  column<this.attendedPixels.right;  column++)  {
					const c=this.getColorAt(column, row);
					if (c instanceof Color_Composite)  for (const c_ of c)  {$context.setPixel5Ch(column, row, c_);}
					else  if (null!==c)  $context.setPixel5Ch(column, row, c);  }  }
		else
			for (let row=this.attendedPixels.top;  row<this.attendedPixels.bottom;  row++)  {
				for (let column=this.attendedPixels.left;  column<this.attendedPixels.right;  column++)  {
					const c=this.getColorAt(column, row);
					if (null!==c)  $context.setPixel5Ch(column, row, c);  }  }
		$context.replacePixelBlock();  }  }

MosaicTiler.prototype.name="Mosaic Tiler";
MosaicTiler.prototype.getAttendedPixels=getAttendedPixels;  // this trait is a method used by Shape and MosaicTiler


class PolarTiler extends MosaicTiler  {

	novaFactor=new Array;
	originOff;

	constructor($name, $tiles, $mosaic)  {
		if (new.target===PolarTiler)
			throw new TypeError('A simple PolarTiler class instance is insufficient. You must use a class extention.');
		super($name, $tiles, $mosaic);

		var tallest=0,
				biggest=0, i;
		for (i=0; i<this.totalTiles; i++)  {
			const tile=this.tiles[i];
			tallest=max(tallest, tile.height);
			this.novaFactor[i] = max(tile.height, tile.width);
			biggest=max(biggest, this.novaFactor[i]);
			this.novaFactor[i] *= $mosaic.shift+1; }
		this.originOff = -(biggest/2)*$mosaic.shift;

		tallest*=$mosaic.size*($mosaic.shift+=1);
		if ($mosaic.hwRatio>1)  {
			this.height=( (this.Yradius= round(tallest))*2 -1);
			this.width =( (this.Xradius= round(tallest/$mosaic.hwRatio))*2 -1);  }
		else  {
			this.width =( (this.Xradius= round(tallest))*2 -1);
			this.height=( (this.Yradius= round(tallest*$mosaic.hwRatio))*2 -1);  }

		this.center.x=floor(this.width/2);
		this.center.y=floor(this.height/2);  }  }

PolarTiler.prototype.name='Polor Tiler';


class Color_Composite extends Array {}
Color_Composite.prototype.mode='over';
// ¿¿¿¿¿ maybe this functionality should be moved to: canvas.context.composite(); ?????
Color_Composite.prototype.setPixelOfContext=function($column, $row, $context)  {
	/* usually, the “mode” relates to the entirety of compositing just 2 images,
	 * but here it relates to a single pixel with 2 or more compositing colors…
	 */
	switch (this.mode)  {
		case 'over':
		break;
		case 'in':
			for (const c of this)  {if (c[3]===0)  return;}
			if ($context.getPixelAt($column, $row)[3]===0)  return;
		break;
		case 'out':
			if ($context.getPixelAt($column, $row)[3]!==0)  return;
		break;
		case 'atop':
			if ($context.getPixelAt($column, $row)[3]===0)  return;
		break;
		case 'xor':
			const a= ($context.getPixelAt($column, $row)[3]!==0);
			for (const c of this)  {if ((c[3]!==0) ^ a)  return;}
		break;
		default: throw new Error('Unknown “mode” in Color_Composite');  }
	for (const c of this)  {$context.setPixel5Ch($column, $row, c);}  }

RainbowMaker.Color_Composite=Color_Composite;


class Nebula extends PolarTiler {
	// Similar to a SuperNova, except we set every pixel(n-1)*2 times (where n is the number of sectors in the nova)
	//  starting from the furthest out pixels.  This allows “underlaps” to show through transparency gradients.
	// This process takes the longest by far:
	//  almost 5 minutes for an 891×875 pixel image with 7 sectors on
	//  a 2GHtz i7-processor (turbo boosted to near 3GHtz) 6GB-RAM machine
	//  to create a nebula from a starlet with the colorband reflected (reflected takes slightly longer than repeated).
	//  That's 9,355,500 times we run through each SERIES of calculations.
	//  Not a good one for an overworked public server!

	doesComposite=true;
	overlap;

	constructor($name, $tiles, $mosaic)  {
		super($name, $tiles, $mosaic);
		this.overlap=($mosaic.overlap==='clockwise') ? 1 : (-1);  }

	getColorAt($column, $row)  {
		const p={x:$column-this.center.x,  y:this.center.y-$row};
		if (this.rotation)  rotate(p, this.rotation);
		const angle=getAngle(p.x, p.y, this.hwRatio),
					ellipticRadius=hypot(this.Xradius*cos(angle), this.Yradius*sin(angle)),
					y=this.originOff - ((hypot(p.x, p.y)/ellipticRadius) - .5)*this.novaFactor[tilenum],
					x= -((fmod(angle+_90deg, this.sector)/this.sector) - .5)*this.novaFactor[tilenum];
		var tilenum=floor((angle-_90deg+this.sector/2)/this.sector),
				i=(-1),
				flag=true,
				colors_array=new Color_Composite;
		while (++i < this.totalSectors)  {
			if (flag= !flag)  i--;  //why do we do this?
			const
				c=((x>0) ^ flag) ? (x+this.novaFactor[tilenum]*i) : (x-this.novaFactor[tilenum]*i),
				r=y,
				clr=this.tile[tilenum].getColorAt(c,r);
			if (clr instanceof Color_Composite)    // the tile was itself a Mosaic
				colors_array=clr.concat(colors_array);
			else if (clr!==null  &&  clr[3]!==0)  // ← ¡if we want to use different compositing modes besides 'over', we need to keep colors with full transparency!
				colors_array.unshift(clr);
			if (colors_array[0][3]===1)  break //this color is fully opaque, so no need to keep the underlying pixels
			tilenum=Math.sawtooth(this.totalSectors, tilenum-this.overlap);  }
		return colors_array.length ? colors_array : null;  }  }

/*
	getColorAt($column, $row)  {
		const p={x:$column-this.center.x,  y:this.center.y-$row};
		if (this.rotation)  rotate(p, this.rotation);
		const angle=getAngle(p.x, p.y, this.hwRatio),
					ellipticRadius=hypot(this.Xradius*cos(angle), this.Yradius*sin(angle)),
					y=this.originOff - ((hypot(p.x, p.y)/ellipticRadius) - .5)*this.novaFactor[tilenum],
					x= -((fmod(angle+_90deg, this.sector)/this.sector) - .5)*this.novaFactor[tilenum];
		var tilenum=floor((angle-_90deg+this.sector/2)/this.sector),
				i=this.totalSectors,
				flag=true,
				color_array=new Color_Composite;
// we need to reverse the process here: look at the current sector first, then the closest till the farthest
// we cache each color in an array
// we check each color at each sector to see if it is fully opaque (opacity=1), and stop there is so, else continue
// once we have an array of colors, calculate the applied color from the array… … … just to figure the formula for that …
// if the opacity=1 for out "last" color, no problem: the formula is strait-forward and the fimal opacity=1
// but if all colors have opacity<1, then how do we calculate the final opacity?
// if we can not come up with a formula for “order-independent-opacity”
// we need to simply return the array of colors in a custom “ColorApplicationArray”
// and let the painton() method deal with it.
		while (--i >= 0)  {
			if (flag= !flag)  i++;
			const
				c=((x_>0) ^ flag) ? (x_+this.novaFactor[tilenum]*i) : (x_-this.novaFactor[tilenum]*i),
				r=y;
			const clr=this.tile[tilenum].getColorAt(c,r));
			if (clr instanceof Tiler_Array)  {  // the tile was itself a Mosaic
				if (clr[0][3]===1)  color_array=clr;           // the first color in this array is fully opaque so no need to keep the underlying pixels
				else  color_array=color_array.concat(clr);  }
			else if (clr[3]===1)  color_array=new Tiler_Array(clr); //this color is fully opaque, so no need to keep the underlying pixels
			else  color_array.push(clr);
			tilenum+=this.overlap;  }
		return color_array;  }  }
*/

Nebula.prototype.name='Nebula';






	// with Nova, SuperNova, and Quasars, we take a given shape and tile it on a polar grid.
	// Each tile is sized to fit the sector; if it reflects or repeats the colorband, that will overflow the sector.
	// With SuperNova and Quasars, the overflow into other sectors is allowed; with nova it is blocked.
	// SuperNova gives precedence to the the image in the sector, and sets each pixel to be that color.
	//  If no color is active for that pixel, it looks to each adjacent sector in sequence from the closest to farthest
	//  to see if it overflows and hence “underlaps” into the sector in question.
	// For Nova, SuperNova, Quasars, once a pixel is set, it moves on to the next pixel.
	// Quasars give precedence to the pixels in the farthest sector on one side or the other first (which is really the
	//  one closest on the other side) in sequence back through the sector in question to the one farthest away.
	//  This yeilds an “overlap” effect like a deck of cards spread into a circle one over the other,
	//   the first over the next over the next..., the last over the first.
	// Note that with SuperNova and Quasars, we multiply the number of calculations done on each pixel several times.
	//  Quasars in particular take longer when the grapk does not overflow more that a few sectors.
	//  The more sectors in the SuperNova or Quasar, the greater the chances we calculate more times...
	//  however, the grafk itself has a lot to do with this: the more sparce it is, the more calculations done,
	//  so any grafk that repeats or reflects a greater number (to ∞) of times will run faster.
function novae_quasar_getColorAt($column, $row)  {
	const point={x:$column-this.center.x, y:this.center.y-$row};
	if (this.rotation)  rotate(point, this.rotation);
	const
		angle=getAngle(p.x, p.y, this.hwRatio),
		ellipticRadius=hypot(this.Xradius*cos(angle), this.Yradius*sin(angle)),
		tilenum=floor((angle-_90deg+this.sector/2)/this.sector),
		_r_=this.originOff - ((hypot(x, y)/ellipticRadius) - .5)*this.novaFactor[tilenum],
		_c_= -((fmod(angle+_90deg, this.sector)/this.sector) - .5)*this.novaFactor[tilenum];
	var
		i=(this.isQuasar ?  this.totalSectors : (this.isSupernova ? 0 : 1)),
		clr=null,  flag=true,
		r=_r_,  c=_c_;
	if (this.isNova)  clr=this.tile[timenum].getColorAt(c,r);
	else  while (--i >= this.stop)  {
		const tile=this.tile[tilenum];  //why was this placed AFTER the following conditional block?
		clr=tile.getColorAt(c, r);
		if (this.isQuasar)  {
			if (clr===null  ||  tile.timesOut > tile.maxExtend)  {
				c=_c_+this.novaFactor[tilenum]*i*this.overlap;
				r=_r_;  }
			else  break;  }
//		const tile=this.tile[tilenum];
//		clr=tile.getColorAt(c, r);
		//if (this.isNova)  break;
		tilenum+=this.overlap;
		if (tilenum<0)  tilenum+=this.totalTiles;
		else tilenum=tilenum%this.totalTiles;
//		else tilenum=fmod(tilenum, this.totalTiles);
		if (this.isSupernova)  {
			if (tile.timesOut > tile.maxExtend  ||  clr===null)  {
				if (flag= !flag)  i++;
				c=((_c_>0) ^ flag) ? (_c_+this.novaFactor[tilenum]*i) : (_c_-this.novaFactor[tilenum]*i);
				r=_r_;  }
			else  break;  }  }
	return clr;  }



class Nova extends PolarTiler {}

Nova.prototype.name='Nova';
Nova.prototype.isNova=true;
Nova.prototype.stop=0;
Nova.prototype.getColorAt=novae_quasar_getColorAt;



class SuperNova extends PolarTiler {

	stop;

	constructor($name, $tiles, $mosaic)  {
		super($name, $tiles, $mosaic);
		this.stop=1-$mosaic.sectors;  }  }

SuperNova.prototype.name='SuperNova';
SuperNova.prototype.isSuperNova=true;
SuperNova.prototype.getColorAt=novae_quasar_getColorAt;



class Quasar extends PolarTiler {

	stop;
	overlap;

	constructor($name, $tiles, $mosaic)  {
		super($name, $tiles, $mosaic);
		this.stop=1-$mosaic.sectors;
		this.overlap=($mosaic.overlap==='clockwise') ? 1 : (-1);  }  }

Quasar.prototype.name='Quasar';
Quasar.prototype.isQuasar=true;
Quasar.prototype.getColorAt=novae_quasar_getColorAt;



/*
	For tiles used by the “Encircler” super-class, the co-ordinate system is slightly different than usual.
The X-coordinate is normalized to zero (0) in the cartesian co-ordinate system; in other words,
it refers to the center row of the tile, not the left edge.  As such, this method essentially adjusts
the tile’s center['x'] (to 0 for Shapes), and also adjusts the margin, accordingly.
	It should be noted that the tile’s margins represent a margin within an individual “tilespace”
of the greater mosaic, NOT from the edge of the overall mosaic or from the GD-image edge.
The “tilespace” may be wider and/or taller than an individual tile, if multiple tiles are of different sizes,
and all tiles are centered within their “tilespace”.
Also, only the top and left margins of tiles are valid.
	The Mosaic’s margins are relative to the GD-image edge, however, and all 4 margins are valid.
 */
class Encircler extends MosaicTiler {

	halfsector=this.sector/2;
	whRatio;  // width/height = 1/hwRatio
	Xradius;
	Yradius;
	height;
	width;
	center;

	constructor($name, $tiles, $mosaic)  {
		if (new.target===Encircler)
			throw new TypeError('A simple Encircler class instance is insufficient. You must use a class extention.');
		super($name, $tiles, $mosaic);

		var maxwidth=0,
				maxheight=0;
		for (tile of this.tiles)  { //calcualte the needed “tilespace”
			maxheight=max(maxheight, tile.height);
			maxwidth =max(maxwidth,  tile.width);  }

		for (tile of this.tiles)  {
			switch (tile.align)  {
			case 'top':
				tile.margin.top=0;
				break;
			case 'bottom':
				tile.center.y += (tile.margin.top=maxheight-tile.height);
				break;
			case 'center':
			default:
				tile.center.y += (tile.margin.top=floor((maxheight-tile.height)/2));  }
			if (tile instanceof FountainShape)
				tile.center.b += tile.margin.top;
			if (tile instanceof Shape)  {
				tile.center.x = 0;  tile.margin.left= -floor((maxwidth-tile.width)/2);  }
			else
				tile.center.x += (tile.margin.left=floor((maxwidth-tile.width)/2));  }

		this.halfsector=this.sector/2;
		this.whRatio=1/$mosaic.hwRatio;

		const
			rot= -(this.rotation);
//			rot= -readAngle($mosaic.rotate, 'deg', 'rad');

		this.rotation=_360deg-radian(_90deg+rot);  // we rotate 90° to place one of an odd-number of shapes at the top.
		baseOff=((maxwidth/2)/tan(sector/2)) * (1+$mosaic.shift);  //distance from mosaic’s center to shape’s bottom center
		maxRadius=hypot(baseOff+maxheight, maxwidth/2);  //distance from mosaic’s center to shape’s top corners when mosaic is circular (h/w ratio = 1)
		if ($mosaic.hwRatio>1)  {
			this.Yradius= baseOff;
			this.Xradius= baseOff/$mosaic.hwRatio;  }
		else  {
			this.Xradius= baseOff;
			this.Yradius= baseOff*$mosaic.hwRatio;  }
		var height=0, width=0, a, s, da, x1, y1, x2, y2;
		for (a=_90deg; a<_450deg; a+=sector)  {
			var
				s=ellipseAngle(a, $mosaic.hwRatio);
			const
				maxRadius=hypot(hypot(this.Xradius*cos(a), this.Yradius*sin(a))+maxheight, maxwidth/2),  //distance from mosaic’s center to shape’s top corners
				da=asin((maxwidth/2)/maxRadius),
				p1={x:maxRadius*cos(s+da), y:maxRadius*sin(s+da)}  // coordinate of top-left corner;
			rotate(p1, rot);  // radian(rot)
			s=radian(s-da);
			const
				p2={x:maxRadius*cos(s), y:maxRadius*sin(s)};  // coordinate of top-right corner;
			rotate(p2, rot);  // radian(rot)
			height=max(height, abs(p1.y*2)+1, abs(p2.y*2)+1);
			width =max(width,  abs(p1.x*2)+1, abs(p2.x*2)+1);  }
		this.height=round(height);
		this.width =round(width);

		this.center.x=floor(this.width/2);  //center of mosaic
		this.center.y=floor(this.height/2);  //center of mosaic

	}  }  //  close  Encircler

Encircler.prototype.name='Encircler';



	// “Spokes” is like “Nebula”.
	// Instead it tiles the shape circularly by rotation on the Cartesain grid.
	// Please see those comments above in the PolarTiles section.
class Spokes extends Encircler  {

	doesComposite=true;

	constructor($name, $tiles, $mosaic)  {
		super($name, $tiles, $mosaic);
		this.totalSectors -= 1;  }

	getColorAt($column, $row)  {
		const point={x:$column-this.center.x, y:this.center.y-$row};
		if (this.rotation)  rotate(point, this.rotation);
		const
			angle=getAngle(point.x, point.y, this.whRatio),
			s=angle%this.sector,
			lhand=(s>this.halfsector),
			sector= (angle-s) + (lhand ? this.sector : 0);
		var
			i=(-1),
			flag=true,
			colors_array=new Color_Composite;
		while (++i < this.totalSectors)  {
			if (flag= !flag)  i--;
			const
				p=Object.create(point),
				_sector_= (flag ^ lhand) ? (sector+this.sector*i) : (sector-this.sector*i);
			rotate(p, radian(_90deg-ellipseAngle(_sector_, whRatio)));  //we off-rotate 90° to place odd-tile-up
			p.y-=this.baseOff-hypot(cos(_sector_)*this.Yradius, sin(_sector_)*this.Xradius);  //note we swap the Xradius and Yradius because we off-rotated 90deg
			const
//				clr=this.tiles[fmod(i, this.tiles.length)].getColorAt(p.x, p.y);  // ←this.totalTiles
				clr=this.tiles[i%this.tiles.length].getColorAt(p.x, p.y);  // ←this.totalTiles
			if (clr instanceof Color_Composite)    // the tile was itself a Mosaic
				colors_array=clr.concat(colors_array);
			else if (clr!==null  &&  clr[3]!==0)  // ← ¡if we want to use different compositing modes besides 'over', we need to keep colors with full transparency!
				colors_array.unshift(clr);
			if (colors_array[0]  &&  colors_array[0][3]===1)  break //this color is fully opaque, so no need to keep the underlying pixels
		}
		return colors_array.length ? colors_array : null;  }  }

/*
	getColorAt($column, $row)  {
		const point={x:$column-this.center.x, y:this.center.y-$row};
		if (this.rotation)  rotate(point, this.rotation);
		const
			angle=getAngle(point.x, point.y, this.whRatio),
			s=fmod(angle, this.sector),
			lhand=(s>this.halfsector),
			sector= (angle-s) + (lhand ? this.sector : 0);
		var
			i=this.totalSectors,
			flag=true,
			colors_array=new Colors_Composite;
		while (--i >= 0)  {
			if (flag= !flag)  i++;
			const
				p=Object.create(point),
				_sector_= (flag ^ lhand) ? (sector+this.sector*i) : (sector-this.sector*i);
			rotate(p, radian(_90deg-ellipseAngle(_sector_, whRatio)));  //we off-rotate 90° to place odd-tile-up
			p.y-=this.baseOff-hypot(cos(_sector_)*this.Yradius, sin(_sector_)*this.Xradius);  //note we swap the Xradius and Yradius because we off-rotated 90deg
			const
				clr=this.tiles[fmod(i, this.tiles.length)].getColorAt(p.x, p.y);  // ←this.totalTiles

			if (clr instanceof Color_Composite)    // the tile was itself a Mosaic
				colors_array=clr.concat(colors_array);
			else if (clr!==null  &&  clr[3]!==0)  // ← ¡if we want to use different compositing modes besides 'over', we need to keep colors with full transparency!
				colors_array.unshift(clr);
			if (colors_array[0][3]===1)  break //this color is fully opaque, so no need to keep the underlying pixels

			//$context.setPixel5Ch($column, $row, tile.getColorAt(p.x, p.y));
			}
		return null;  }  }
*/


Spokes.prototype.name="Spokes";



class Hub extends Encircler {}

Hub.prototype.name='Hub';
Hub.prototype.start=0;
Hub.prototype.stop=1;
Hub.prototype.getColorAt=hub_wheel_fan_getColorAt;



class Wheel extends Encircler  {
	constructor($name, $tiles, $mosaic)  {
		super($name, $tiles, $mosaic);
		this.stop=$mosaic.sectors;  }  }

Wheel.prototype.isWheel=true;
Wheel.prototype.start=0;
Wheel.prototype.getColorAt=hub_wheel_fan_getColorAt;



class Fan extends Encircler  {
	constructor($name, $tiles, $mosaic)  {
		super($name, $tiles, $mosaic);
		this.overlap= (this.clockwise=($mosaic.overlap==='clockwise')) ? 1 : (-1);
		this.start=1-$mosaic.sectors;
		this.stop=$mosaic.sectors;  }  }

Fan.prototype.isFan=true;
Fan.prototype.getColorAt=hub_wheel_fan_getColorAt;



	// “Hub” is like “Nova”.  “Wheel” is like “Supernova”.  “Fan” is like “Quasar”.
	// Instead these tile the shape circularly by rotation on the Cartesain grid.
	// Please see those comments above in the Fountain method.
function hub_wheel_fan_getColorAt($column, $row)  {
	const point={x:$column-this.center.x, y:this.center.y-$row};
	if (this.rotation)  rotate(point, this.rotation);
	const angle=getAngle(point.x, point.y, this.whRatio);
	var
		sector=fmod(angle, this.sector),
		i=this.start,
		tile, p, clr=null;
	const
		lhand=(sector>this.halfsector),
		overlap= this.isWheel ? (lhand ? 1 : (-1)) : 0;
	sector= (angle-sector) + (lhand ? this.sector : 0);
	do {
		p=Object.create(point);
		const
			_sector_=sector-this.sector*i*overlap;
		rotate(p, radian(_90deg-ellipseAngle(_sector_, this.whRatio)));  //we off-rotate 90° to place odd-tile-up
		p.y-=this.baseOff-hypot(cos(_sector_)*this.Yradius, sin(_sector_)*this.Xradius);  //note we swap the Xradius and Yradius because we off-rotated 90deg
		tile=this.tiles[fmod((i<0) ? i+this.totalSectors : i, this.tiles.length-1)];  }  // ← this.totalTiles
	while ( ( i++<0  &&  this.isFan  &&  ((p.x>=0) ^ this.clockwise) )
// here we need to nix $context
//	||  ( !$context.setPixel5Ch($column, $row, tile.getColorAt(p.x, p.y))  &&  i<this.stop ) );  }
	||  ( !(clr=tile.getColorAt(p.x, p.y))  &&  i<this.stop ) );
	return clr;  }



/*
	For tiles used by the “enspiral” method, the co-ordinate system is slightly different than usual.
The X-coordinate is normalized to zero (0) in the cartesian co-ordinate system; in other words,
it refers to the center row of the tile, not the left edge.  As such, this method essentially adjusts
the tile’s center['x'] (to 0 for Shapes). (Remember, $center[x,y] is the placement of the tile on the
image using the GD coordinate system.)
 */
class Enspiral extends MosaicTiler {

	constructor($name, $tiles, $mosaic)  {
		super($name, $tiles, $mosaic);
		const
			spiral=$mosaic.spiral;
		var
			archemedian=false,
			logarithmic=false;
		switch (spiral.style.toLowerCase())  {
		case 'archemedian spiral':
		case 'spiral':
		case 'spiral•1': archemedian=true;
			break;
		case 'logarithmic spiral':
		case 'vortex':
		case 'spiral•2': logarithmic=true;
			break;  }

//		             = Number.parsePercent(spiral. );  ←should we even be parsing these values here?  should they be parsed in the formulator?
		spiral.magnify /= 100; //the overall size of the spiral: percent of “natural”; (also “rotates” the spiral)
		spiral.expand /= 100;  //the rate that the spiral’s radius increases with each revolution; a “golden spiral” when spiral.expand=100%
		spiral.shrink /= 100;  //one end of the spiral will have full size tiles - the other end will be sized to this percent.

		var sector, _b, eFactor, totalD;
		if (logarithmic)  b=0.3063489625104*spiral.expand;  //  0.3063489625104 ≈ logₑ(Φ)/Π ≈ log(1.6180339887, 2.71828)/3.1415926535   i.e. a “golden spiral” when spiral.expand=1
		if (logarithmic  &&  spiral.equidistant)  {
			_b=1/b,
			eFactor=cos(atan(_b));
			let radius=spiral.magnify * pow(Math.E, b*spiral.twists*_2PI);   //radius at end of spiral
			totalD=abs(radius/eFactor);  //total distance along spiral path
			}
		else  sector= (spiral.twists*_2PI) / spiral.sectors;
		for (let r, a, i=0; i<spiral.sectors; i++)  {
			const tile=this.tiles[fmod((spiral.start==='center') ? i : (spiral.sectors-i-1), this.tiles.length-1)]; // ←this.totalTiles
			if (logarithmic  &&  spiral.equidistant)  {
				r=abs(totalD*((i+1)/spiral.sectors)*eFactor);
				a=(r) ? _b*log(r/magnify) : 0;  }
			else  {
				a=i*sector;
				r=spiral.magnify * (archemedian ?  a  :  pow(Math.E, b*a));  }
			this.tilespace[i].tile=tile;
			switch (spiral.orient)  {
			case 'to vortex center':  this.tilespace[i].offRotate=radian(_90deg-a);  break;
			case 'to vortex edge':    this.tilespace[i].offRotate=radian(_90deg+a);  break;
			case 'to mosaic bottom':
			default:  this.tilespace[i].offRotate=false;  }
			this.tilespace[i].shrink=shrink= 1 - i*( (1-spiral.shrink) / (spiral.sectors-1) );
			this.tilespace[i].left= (this.tilespace[i].center.x = r*cos(a)) - floor(tile.width*shrink/2);
			this.tilespace[i].right= this.tilespace[i].left.x + round(tile.width*shrink);
			this.tilespace[i].top=  (this.tilespace[i].center.y = r*sin(a)) - floor(tile.height*shrink/2);
			this.tilespace[i].bottom=this.tilespace[i].top.y + round(tile.height*shrink);  }

		}  //  close  enspiral constructor

	getColorAt($column, $row)  {
		const point={x:$column-this.center.x, y:this.center.y-$row};
		if (this.rotation)  rotate(point, this.rotation);
		for (var i=0;  i<this.tilespace.length;  i++)  {
			const p=Object.create(point);
			if (this.tilespace[$i].offRotate)
				rotateAround(p, this.tilespace[i].offRotate, this.tilespace[i].center);
			if (p.x>this.tilespace[i].left  &&  p.x<this.tilespace[i].right
			&&  p.y>this.tilespace[i].top   &&  p.y<this.tilespace[i].bottom)  {
				var clr;
				if (this.tilespace[i].shrink  &&  (clr=this.tilespace[i].tile.getColorAt(
					(p.x-this.tilespace[i].center.x)/this.tilespace[i].shrink,
					(this.tilespace[i].center.y-p.y)/this.tilespace[i].shrink)))
						return clr;  }
		return null;  }  }  }

Enspiral.prototype.name="Enspiraler"

//  ******************  that’s it for the Tiles  ***************************************************



class RainbowSculptorError extends Error {
	constructor(code, message) {
		super(message);
		this.code=code;  }  }


/*  accept an Array scheme of Tiles,
 *  generate an appropriately sized canvas if none is supplied,
 *  and paint those Tiles on the canvas.
 */
function sculptor($scheme, $context, $doResize=true)  {
	var canvas;
	if ($context  &&  !$doResize)  canvas=$context.canvas;
	else {
		var maxW=0, maxH=0;
		for (const tile of $scheme)  { if (!tile.sizeTo)  continue;
			if (tile.margin.left==='center')
				maxW=max(maxW, tile.width);
			else
				maxW=max(maxW,  (tile.margin.left==='auto' ? 0 : tile.margin.left)
											+ tile.width
											+ (tile.margin.right==='auto' ? 0 : tile.margin.right));
			if (tile.margin.top==='center')
				maxH=max(maxH, tile.height);
			else
				maxH=max(maxH,  (tile.margin.top==='auto' ? 0 : tile.margin.top)
											+ tile.width
											+ (tile.margin.bottom==='auto' ? 0 : tile.margin.bottom));  }
		if (maxW===0  ||  maxH===0)
			throw new RainbowSculptorError('autosize', 'You must supply a canvas, or at least one non-empty Tile or any Tile with positive margins, to autosize a canvas to, for RainbowMaker.sculptor()')
		if ($context
		&&  $context.canvas.width>=maxW
		&&  $context.canvas.height>=maxH)
			canvas=$context.canvas;
		else  {
			canvas=document.createElement('canvas');
			canvas.width=maxW;  canvas.height=maxH;
			if ($context)  {
				const cntx=canvas.getContext('2d');
				cntx.drawImage($context.canvas, floor((maxW-$context.canvas.width)/2), floor((maxH-$context.canvas.height)/2));
				$context=cntx;  }
			else
				$context=canvas.getContext('2d');  }  }

	for (const layer of $scheme)  {
		const tile=layer.tile,  margin=layer.margin;
		if (margin.left==='center'
		||  (margin.left==='auto'  &&  margin.right==='auto'))  {
			const half=(canvas.width-tile.width)/2;
			margin.left=floor(half);
			margin.right=ceil(half);  }
		else
		if  (margin.left==='auto')  margin.left= canvas.width - tile.width - margin.right;
		else
		if  (margin.right==='auto')  margin.right= canvas.width - tile.width - margin.left;

		if (margin.top==='center'
		||  (margin.top==='auto'  &&  margin.bottom==='auto'))  {
			const half=(canvas.height-tile.height)/2;
			margin.top=floor(half);
			margin.bottom=ceil(half);  }
		else
		if  (margin.top==='auto')  margin.top= canvas.width - tile.width - margin.bottom;
		else
		if  (margin.bottom==='auto')  margin.bottom= canvas.width - tile.width - margin.top;

		tile.getAttendedPixels($context, margin);
		tile.paintOn($context);  }  }



// ======================================================================================== \\

class ColorBand  {

//  colors are defined as: [R, G, B, Ap, Ab]  →  R,G,B = (Red, Green, Blue) = (0-255);
//                                                  Ap = The Alpha of the resulting pixel
//                                                  Ab = Alpha-blend into curent pixel
	static defaultColorArray=[0,0,0,0,0];
	static defaultColorObject={'R':0, 'G':0, 'B':0, 'Ap':0, 'Ab':0};
	static  {
		Object.defineProperty(ColorBand.defaultColorObject, 'channels', {value:['R', 'G', 'B', 'Ap', 'Ab']});
		Object.freeze(ColorBand.defaultColorArray);
		Object.freeze(ColorBand.defaultColorObject);
		Object.freeze(ColorBand.defaultColorObject.channels);  }
	static defaultColorObjectConstructor=function(R,G,B,Ap,Ab)  {
		this.R=R;  this.G=G;  this.B=B;  this.Ap=Ap;  this.Ab=Ab;  };

	// these values are used by extentions’ instances as they are constructed
	static defaultColorConstructor=Array;  //  ↓ set the proper userColorChanels if you use a custom constructor ↓
	static userColorChannels=undefined; // =['R', 'G', 'B', 'Ap', 'Ab']  ← an optional array that maps channel numbers (0-4) to user’s channel names

	static replaceOldRainbows=true;

	constructor(name)  {
		if (new.target===ColorBand)
			throw new TypeError('A simple ColorBand class instance is insufficient. You must use a class extention.');
		if (RainbowMaker.rainbows[name])  {
			if (ColorBand.replaceOldRainbows)  {
				const i=RainbowMaker.rainbows.findIndex(t=>t.name===name);
				if (i>=0)  RainbowMaker.rainbows.splice(i,1);  }
			else throw new Error('A RainbowMaker Rainbow already exists with the name “'+name+'”.');  }
		this.name=name;  }  }

ColorBand.prototype.name="ColorBand";
ColorBand.prototype.defaultColor=ColorBand.defaultColorArray;




class Paletted_ColorBand extends ColorBand {
	palette;
	defaultColor;

	constructor(name, paletteCount, colors, cSpace)  {
		super(name);
		if (paletteCount instanceof Array)  this.palette=paletteCount;
		else  {
			if (paletteCount<1)  throw new RangeError(this.name+this.__proto__.name+' palettes must have at least 1 slot.');
			if (paletteCount>10000)  console.warn(this.name+this.__proto__.name+' palettes are recommended to have 10000 or less slots.');
			if (colors)  {
				if (colors.gradientType==='Paletted')  {

				}
				else {
					this.defaultColor=colors;
					this.palette=Array(paletteCount).fill(this.defaultColor);  }  }  }
		if (cSpace)  this.cSpace=cSpace;  }

	colorAt(offset)  {return this.palette[Math.round(this.palette.length*offset)];}  }

Paletted_ColorBand.prototype.name="Paletted_ColorBand";
Paletted_ColorBand.prototype.cSpace='rgb';



class Paletted_Gradient extends Paletted_ColorBand {

	colorStops=new Array;
	colorConstructor=ColorBand.defaultColorConstructor // ↓ if you use a user’s custom colorObject, define the channels Array ↓
	channels=ColorBand.userColorChannels; // =['R', 'G', 'B', 'Ab', 'Ap']  ← an optional array that maps channel numbers (0-4) to user’s channel names

	addColorStop(offset, color, doReady=true)  {
		if ((offset=round(offset))<0)  throw new RangeError('Paletted_Gradient.addColorStop() “offset” must not be negative after rounding.');
		if (offset>=palette.length)  throw new RangeError('Paletted_Gradient.addColorStop() “offset” after rounding must not be greater than the number of palette slots.');
		this.colorStops[offset]=color;
		if (doReady) this.ready();  }

	ready()  {
		var nextSlot=0, prevStop=0, chnlNum;
		this.palette=new Array(this.colorStops.length).foreach((s,i,a) => {a[i]=new this.colorConstructor;});
		for (chnlNum=0;  chnlNum<5;  chnlNum++)  {
			let target;
			if (chnlNum<3)  target='color';
			else if (chnlNum===3)  target='Ap';
			else target='Ab';
			const channel= this.channels ? this.channels[chnlNum] : chnlNum;
			this.colorStops.forEach((c, stop) =>  {
				if (c[channel]===null)  {
					if (stop===0  ||  stop===this.colorStops.length-1)  throw new Gradient5ChError(this.name, 'The first and last stops in a Paletted_Gradient should never have null channels; found in: ',this.name);
					//else  continue;
					else return;
					}
				if (stop===0)  return; //continue;
				const span=stop-prevStop;
				for (var i=nextSlot; i<=stop; i++)  {
					const ci= this.colorStops[prevStop][curve] ?
							(nextSlot+curveIndex(this.colorStops[prevStop]['curve'][target]['type'], i-nextSlot, span, this.colorStops[prevStop]['curve'][target]['shift']))
						: i;
					this.palette[i][channel]=  //low+(high-low)*f
						this.colorStops[prevStop][channel] + (c[channel]-this.colorStops[prevStop][channel]) * ((ci-prevStop)/span);  }
				prevStop=stop;
				nextSlot=stop+1;  });  }  }

	//This is for user external reference only. Replacing it does nothing.
	static curveIndex=curveIndex;  }

Paletted_Gradient.prototype.isGradient=true;
Paletted_Gradient.prototype.name="Paletted_Gradient";
Paletted_Gradient.prototype.addColorStops=addColorStops;



	// Given (0 < $i < $span), and given ($shift > 0),
	//  this can “curve” the value of $i toward 0 [zero] (to start), torward $span (to end), or the half-way point (to center).
	//  Shift values over 1 [one] increase the shift, while values less than 1 will actually be a shift in the opposite direction.
function curveIndex($type, $i, $span, $shift)  { switch ($type)  {
	case 'to start': return sin(atan(tan( ($i/$span) * _PI_2 ) / $shift) + _3PI_2) + 1;
	case 'to end':   return sin(atan(tan( ($i/$span) * _PI_2 ) * $shift));
	case 'to center': return (tan( atan(tan( ($i/$span) * _PI - _PI_2) / $shift) /2 ) + 1)/2;  //  return (tan( ≈PI÷2 * ($y/$span) - ≈PI÷4 ) + 1)/2;
	case 'none':
	default: return $i;  }  }



// this is common for gradients
function addColorStops($stops)  {
	for (const stop in $stops)  {this.addColorStop(stop, $stops[stop], false);}
	this.readyPalette;  }



class TrueColor_Gradient extends ColorBand {

	static interpColorArray=interpColorArray;  //This is for user external reference only. Replacing it does nothing.

	static interpColorObject=interpColorObject;  //This is for user external reference only. Replacing it does nothing.

	static defaultColorInterpolator=interpColorArray;

	constructor(name, color)  {
		super(name);
		this.interpColor= TrueColor_Gradient.defaultColorInterpolator;
		this.pseudoColorStops=new Array;
		this.colorStops=new Array;
		if (color)  this.defaultColor=color;
		this.colorStops[0]=this.defaultColor;
		this.colorStops[10000]=this.defaultColor;  }

	addColorStop(offset, color, doReady=true)  {
		if (offset<0)  throw new RangeError('TrueColor_Gradient.addColorStop() “offset” must not be negative.');
		if (offset>1)  throw new RangeError('TrueColor_Gradient.addColorStop() “offset” must not be greater than 1.');
		this.pseudoColorStops[Math.round(offset*10000)]=color;
		if (doReady) this.ready();  }

	ready()  {  //fill in “empty” colors or alpha-values of slots in the pseudoColorStop array and output to the colorStops array
		this.colorStops=Array.from(this.pseudoColorStops);
		var prevStop, chnlNum;
		for (chnlNum=0;  chnlNum<5;  chnlNum++)  {
			const channel= this.channels ? this.channels[chnlNum] : chnlNum,
						empties=new Array;
			this.colorStops.forEach((c, stop) =>  { // note we depend on the Array being iterated over in “order”
				if (c[channel]===null)  {
					if (stop===0  ||  stop===this.colorStops.length-1)  throw new Gradient5ChError(this.name, 'The first and last stops in a TrueColor_Gradient should never have null channels; found in: ',this.name);
					else  empties.push(stop);  }
				else {
					if (empties.length>0)  {
						const span=stop-prevStop;
						for (const i of empties)  {
							this.colorStops[i][channel]= //low+(high-low)*f
								this.colorStops[prevStop][channel] + (c[channel]-this.colorStops[prevStop][channel]) * ((i-prevStop)/span);  }
						empties.length=0;  }
					prevStop=stop;  }  });  }  }

	colorAt(offset)  {
		offset=Math.round(offset*10000); // built for speed, not error-resistant
		var low,  // note we depend on the Array being iterated over in “order”
				high=this.colorStops.findIndex(function(c, stop)  {  // findIndex() passes numeric values for indices.
					if (stop===offset)  {low=stop;  return true;}
					if (stop<offset)  {low=stop;  return false;}
					return true;  });
		return (low===high) ?
				this.colorStops[low]
			: this.interpColor(this.colorStops[low], this.colorStops[high], (offset-low)/(high-low));  }  }

TrueColor_Gradient.prototype.isGradient=true;
TrueColor_Gradient.prototype.name="TrueColor_Gradient";
TrueColor_Gradient.prototype.addColorStops=addColorStops;


/* for all color-spaces */
function interpColorArray(low, high, f)  {return low.map((l,i)=>{l===undefined ? high[i] : (high[i]===undefined ? l : l+f*(high[i]-l))});}
/* for only the RGBAbAp color space * /
function interpColorArray(low, high, f)  { return [
	low[0]+f*(high[0]-low[0]),
	low[1]+f*(high[1]-low[1]),
	low[2]+f*(high[2]-low[2]),
	low[3]+f*(high[3]-low[3]),
	low[4]+f*(high[4]-low[4]) ];  }
 */

function interpColorObject(low, high, f)  { return {
	'R': low['R']+f*(high['R']-low['R']),
	'G': low['G']+f*(high['G']-low['G']),
	'B': low['B']+f*(high['B']-low['B']),
	'Ap': low['Ap']+f*(high['Ap']-low['Ap']),
	'Ab': low['Ab']+f*(high['Ab']-low['Ab']) };  }


class Gradient5ChError extends Error {
	constructor(name, message) {
		super(message);
		this.targetName=name;  }  }


// ======================================================================================== \\



class RainbowWizardError extends Error {
	constructor(code, message) {
		super(message);
		this.code=code;  }  }


/*  accept an Object encoded plan (from the RainbowMaker.formulator() or JSON.decode()),
 *  generate the specified Rainbows and Tiles,
 *  and return an Array scheme of Tiles suitable for RainbowMaker.sculptor()
 */
function wizard($plan)  {
	const
		scheme=[],
		rainbows=RainbowMaker.rainbows,
		tiles=RainbowMaker.tiles;
	var _tile_;

	for (const name in $plan.rainbows)  {
		const rainbow=$plan.rainbows[name];
		switch (rainbow.type)  {
		case "Paletted ColorBand":
			rainbows[name]=new Paletted_ColorBand(name, rainbow.colors);
		break;
		case "Paletted Gradient":
			rainbows[name]=new Paletted_Gradient(name, rainbow.size, rainbow.defaultColor);
			rainbows[name].addColorStops(rainbow.colorstops);
		break;
		case "TrueColor Gradient":
			rainbows[name]=new TrueColor_Gradient(name, rainbow.defaultColor);
			rainbows[name].addColorStops(rainbow.colorstops);
		break;
		default: throw new RainbowWizardError('rainbow', 'Unknown rainbow type “'+rainbow.type+'” of “'+name+'” for the Rainbow Wizard');  }  }

	for (const name in $plan.tiles)  { const tile=$plan.tiles[name];
		tilemaker:  { switch (tile.type)  {
		case "Tile": _tile_=new Tile;
		break tilemaker;
		case "Image": var img=document.getElementById(tile.imageID);
			if (!img  && tile.imageURL)  fromURL:  {
				for (const docImg of document.images)  {if (docImg.src===tile.imageURL)  {img=docImg;  break fromURL;}}
				img=new Image;  img.src=tile.imageURL;
				img.onerror=function() {throw new RainbowWizardError('image', 'Image failed to load for the Rainbow Wizard.')};  }
			if (img)  _tile_=new ImageTile(name, img, tile.composite, tile.alpha, tile.scale, tile.crop);
			else  throw new RainbowWizardError('image', 'Image (ID=“'+tile.imageID+'”) not found in document for the Rainbow Wizard.');
		break tilemaker;
		default:  {
			const rainbow=rainbows[tile.rainbow];
			if (!rainbow)
				throw new RainbowWizardError('rainbow', 'No rainbow ColorBand/Gradient named “'+tile.rainbow+'” found for '+tile.type+' in the Rainbow Wizard');
			switch (tile.type)  {
			case "Circle": _tile_=new Radial(name, rainbow);
			break;
			case "Ellipse": _tile_=new Ellipse(name, rainbow);
			break;
			case "Vectored Polygon": _tile_=new Polygonic(name, rainbow, VectoredPolygon.plugins[tile.polygon]);
			break;
			case "Regular Polygon": _tile_=new RegularPolygon(name, rainbow, tile.isStar);
			break;
			case "Twisted Shimmering Star": _tile_=new TwistedShimmeringStar(name, rainbow, tile.star);
			break;
			case "Flower": _tile_=new Flower(name, rainbow);
			break;
			case "Radial Mask": _tile_=new RadialMask(name, rainbow, document.getElementById(tile.imageID));
			break;
			case "Geiser": _tile_=new Geiser(name, rainbow);
			break;
			case "Linear": _tile_=new BasicGradient(name, rainbow, tile.isSplitblock);
			break;
			case "Nova": _tile_=new Nova(name, tile.tileList, tile.mosaic);
			break tilemaker;
			case "SuperNova": _tile_=new SuperNova(name, tile.tileList, tile.mosaic);
			break tilemaker;
			case "Quasar": _tile_=new Quasar(name, tile.tileList, tile.mosaic);
			break tilemaker;
			case "Nebula": _tile_=new Nebula(name, tile.tileList, tile.mosaic);
			break tilemaker;
			case "Hub": _tile_=new Hub(name, tile.tileList, tile.mosaic);
			break tilemaker;
			case "Wheel": _tile_=new Wheel(name, tile.tileList, tile.mosaic);
			break tilemaker;
			case "Fan": _tile_=new Fan(name, tile.tileList, tile.mosaic);
			break tilemaker;
			case "Spokes": _tile_=new Spokes(name, tile.tileList, tile.mosaic);
			break tilemaker;
			case "Enspiraler": _tile_=new Enspiral(name, tile.tileList, tile.mosaic);
			break tilemaker;
			default:  throw new RainbowWizardError('tile', 'Unknown tile type requested in the Rainbow Wizard: '+tile.type);  }  }  }

			_tile_.init(tile.radius, tile.hw, tile.rotate, tile.spiral);
			}  // close tilemaker:

    _tile_.margin=tile.margin;
		tiles[name]=_tile_;
		}  // close loop

//	if ($rainbows===null)  // we need a better test if we want to differentiate between scupltor & MosicTiler schemes
	for (const layer in $plan.scheme)  {scheme.push({tile: tiles[layer], margin: $plan.scheme[layer]});}
//	else  // tiles for mosaics don’t have margins  - wait - yes they do
//		for (const layer of $plan.scheme)  {scheme.push(tiles[layer]);}

	return scheme;  }


/*	read the HTML form (¿ or sub-section of the form ?),
 *	convert “name”s to build an Object heirarchy holding values,
 *	and return the Object encoded plan
 *	that is suitable for  Rainbowmaker.wizard()  and  JSON.encode()
 */
function formulator($form)  {}

/*  call the formulator to create a plan
 *  then send that plan to the wizard to create a set of schemes
 *  then send each of those schemes to the sculptor to be drawn.
 *  do anything with the canvases and HTML that need high-level attention in this process
 */
function executor()  {}


/**** export the classes and relevant functions to the global NameSpace  ****/

	// all other tile types are an extention of Tile
	// a simple Tile instance w/no extensions is a blank used by MosaicTiler
SoftMoon.WebWare.RainbowMaker.Tile= Tile;
SoftMoon.WebWare.RainbowMaker.ImageTile= ImageTile;
SoftMoon.WebWare.RainbowMaker.Circle= Radial;
SoftMoon.WebWare.RainbowMaker.Ellipse= Ellipse;
SoftMoon.WebWare.RainbowMaker.Polygonic= Polygonic;  // note this class uses the plugin:  Polygonic.VectoredPolygon  class
SoftMoon.WebWare.RainbowMaker.Polygonic.VectoredPolygon= VectoredPolygon;
SoftMoon.WebWare.RainbowMaker.RegularPolygon= RegularPolygon;   // for typical regular convex polygons; as well as regular stars
SoftMoon.WebWare.RainbowMaker.TwistedShimmeringStar= TwistedShimmeringStar;
SoftMoon.WebWare.RainbowMaker.Flower= Flower;
SoftMoon.WebWare.RainbowMaker.RadialMask= RadialMask;
SoftMoon.WebWare.RainbowMaker.Geiser= Geiser;
SoftMoon.WebWare.RainbowMaker.Linear= BasicGradient;  // to become Ribbon= SimpleRibbon
// these below are MosaicTiler Tiles — Tiles made from multiple other Tiles
SoftMoon.WebWare.RainbowMaker.Nova= Nova;
SoftMoon.WebWare.RainbowMaker.SuperNova= SuperNova;
SoftMoon.WebWare.RainbowMaker.Quasar= Quasar;
SoftMoon.WebWare.RainbowMaker.Nebula= Nebula;
SoftMoon.WebWare.RainbowMaker.Hub= Hub;
SoftMoon.WebWare.RainbowMaker.Wheel= Wheel;
SoftMoon.WebWare.RainbowMaker.Fan= Fan;
SoftMoon.WebWare.RainbowMaker.Spokes= Spokes;
SoftMoon.WebWare.RainbowMaker.Enspiraler= Enspiral;
		// these are parent “abstract” classes that can not stand on their own
		// but you can extend them or use  instanceof  if you need to
SoftMoon.WebWare.RainbowMaker.Shape= Shape;  // most other tiles are an extension of Shape; except for ImageTile
SoftMoon.WebWare.RainbowMaker.Fountain= Fountain;
SoftMoon.WebWare.RainbowMaker.MosaicTiler= MosaicTiler;
SoftMoon.WebWare.RainbowMaker.PolarTiler= PolarTiler;
SoftMoon.WebWare.RainbowMaker.Encircler= Encircler;



SoftMoon.WebWare.RainbowMaker.tileTypes={
	// all other tile types are an extention of Tile
	// a simple Tile instance w/no extensions is a blank used by MosaicTiler
	"Tile": Tile,
	"Image Tile": ImageTile,
	"Circle": Radial,
	"Ellipse": Ellipse,
	"Vectored Polygon": Polygonic,  // note this class uses the plugin:  Polygonic.VectoredPolygon  class
	"Regular Polygon": RegularPolygon,   // for typical regular convex polygons, as well as regular stars
	"Twisted Shimmering Star": TwistedShimmeringStar,
	"Flower": Flower,
	"Radial Mask": RadialMask,
	"Geiser": Geiser,
	"Linear": BasicGradient,  // to become "Ribbon": SimpleRibbon
	// these below are MosaicTiler Tiles — Tiles made from multiple other Tiles
	"Nova": Nova,
	"SuperNova": SuperNova,
	"Quasar": Quasar,
	"Nebula": Nebula,
	"Hub": Hub,
	"Wheel": Wheel,
	"Fan": Fan,
	"Spokes": Spokes,
	"Enspiraler": Enspiral,
	subtypes: {
		// these are parent “abstract” classes that can not stand on their own
		// but you can extend them or use  instanceof  if you need to
		"Shape": Shape,  // most other tiles are an extension of Shape, except for ImageTile
		"Fountain": Fountain,
		"Mosaic Tiler": MosaicTiler,
		"Polar Tiler": PolarTiler,
		"Encircler": Encircler  }  }
SoftMoon.WebWare.RainbowMaker.sculptor=sculptor; // paints Tiles on a canvas according to a scheme
SoftMoon.WebWare.RainbowMaker.wizard=wizard;   // creates a scheme of Tiles according to a plan
SoftMoon.WebWare.RainbowMaker.formulator=formulator;  // creates a plan from the HTML form
SoftMoon.WebWare.RainbowMaker.executor=executor;  // drives it all

SoftMoon.WebWare.RainbowMaker.ColorBand=ColorBand;  //  this is an “abstract” root super-class — good for “instanceof”
SoftMoon.WebWare.RainbowMaker.Paletted_ColorBand=Paletted_ColorBand;
SoftMoon.WebWare.RainbowMaker.Paletted_Gradient=Paletted_Gradient;
SoftMoon.WebWare.RainbowMaker.TrueColor_Gradient=TrueColor_Gradient;
SoftMoon.WebWare.RainbowMaker.Gradient5ChError=Gradient5ChError;

window.rainbowSculptor=sculptor;
window.rainbowWizard=wizard;

window.RainbowSculptorError=RainbowSculptorError;
window.RainbowWizardError=RainbowWizardError;

}  // close this file’s private NameSpace
