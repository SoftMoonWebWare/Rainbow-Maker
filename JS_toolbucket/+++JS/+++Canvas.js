//  character encoding: UTF-8 UNIX   ¡tab-spacing: 2  important!   word-wrap: no
/*  +++Canvas.js     June 26, 2023
		Copyright © 2023 Joe Golembieski, SoftMoon Webware

		This program is a work of fictional imagination.
		Any resemblence to any real-life code or variables is purely coincidental.
 */




/* note that you can call  getPixel()  without calling  preparePixelBlock()  first
 *  (and the whole canvas will be available to probe)
 * but you must first call  preparePixelBlock() (or getPixel())  to use  setPixel5Ch()
 */
CanvasRenderingContext2D.prototype.preparePixelBlock= function($b, $c, $r)  {
	$b={left:$b.left, top:$b.top, right:$b.right, bottom:$b.bottom};
	for (const s in $b)  { const v=$b[s];
		if ( (!Number.isNumeric(v)  ||  0>v)
		||   ($b[s]=Number(v), 0>$b[s]) )
			throw new TypeError(
			'CanvasRenderingContext2D.prototype.preparePixelBlock requires positive numeric values for the block definition.\n'+
			'\t'+v+' (typeof '+(typeof v)+') passed for '+s+'.');  }
	if ($b.left>this.canvas.width   ||  $b.top>this.canvas.height
	||  $b.right>this.canvas.width  ||  $b.bottom>this.canvas.height
	||  $b.left>=$b.right  ||  $b.top>=$b.bottom)
		throw new RangeError('Improper value for the block definition in CanvasRenderingContext2D.prototype.preparePixelBlock');
	$b.block=this.getImageData($b.left, $b.top, $b.right-$b.left, $b.bottom-$b.top);
	const data=$b.block.data,
				width=$b.block.width,
				top=$b.top,
				left=$b.left;
	//note that getPixel() is a closure and can work without referencing the CanvasRenderingContext2D instance
	this.getPixel=function($column, $row)  {
		const p=(($row-top)*width+$column-left)*4;
		return [data[p], data[p+1], data[p+2], data[p+3]];  };
	this.pixels=$b;
	if (arguments.length>=3)  return this.getPixel($c, $r);  }

CanvasRenderingContext2D.prototype.getPixel= function($column, $row)  {
	this.preparePixelBlock( {left:0, top:0,
													 right: this.canvas.width, bottom: this.canvas.height},
													$column, $row );  }

CanvasRenderingContext2D.prototype.replacePixelBlock= function($doDlt=true, $b)  {
	if (typeof $b !== 'object')  b$=this.pixels;
	this.putImageData(this.pixels.block, $b.left, $b.top);
	if ($doDlt)  this.releasePixelBlock();  }

CanvasRenderingContext2D.prototype.releasePixelBlock= function()  {
		delete this.pixels.block;
		delete this.pixels;
		delete this.getPixel;  // fall back on the prototype
		}

CanvasRenderingContext2D.prototype.setPixel5Ch= function($column, $row, $c, $alphaBlender)  {
	// note that validity of $column & $row is not checked (for speed) and can result in weirdness...
	//  c[0] = red
	//  c[1] = green
	//  c[2] = blue
	//  c[3] = alpha-blend rate (undefined=no color blended;  0=color fully transparent;  255=color fully opaque)
	//  c[4] = pixel-alpha value (after blending in color) or undefined to leave pixel-alpha as-is.
	// this.pixels.block.data is an  Uint8ClampedArray
	//  so values added to/in it are automatically clamped, rounded integers from 0-255
	//  and therefore colors “in-between” and “outside” the sRGB colorspace are automatically corrected.
	var   p=this.pixels;
	const b=p.block,
				d=b.data;
	p=4*(($row-p.top)*b.width + $column-p.right);
	if ($c[3]===undefined)  {
		if ($c[0] !== undefined)  d[p]=$c[0];
		if ($c[1] !== undefined)  d[p+1]=$c[1];
		if ($c[2] !== undefined)  d[p+2]=$c[2];
		if ($c[4] !== undefined)  d[p+3]=$c[4];  }
	else  {
		//  note that the colors are blended into the canvas at rate(i)
		//  but the color-TRANSPARENCY is added to the canvas-TRANSPARENCY at rate(i)
		const i=$c[3]/255;
		if ($c[0] !== undefined)  d[p]+=($c[0]-d[p++])*i;
		if ($c[1] !== undefined)  d[p]+=($c[1]-d[p++])*i;
		if ($c[2] !== undefined)  d[p]+=($c[2]-d[p++])*i;
		if ($c[4] !== undefined)  {
			if ($alphaBlender)  d[p]=$alphaBlender($c[4], $c[3], d[p]);
			else  d[p]=$c[4];  }  }  }

// These static functions can be passed into setPixel5Ch as the $alphaBlender
//  Ap = Alpha to set in the pixel;  Ab = blend rate into existing alpha;  Ac = pre-existing Alpha of the canvas' pixel
CanvasRenderingContext2D.addOpacity=function(Ap, Ab, Ac) {return Ap + (1-Ap)*Ac*Ab;}
CanvasRenderingContext2D.subtractTransparency=function(Ap, Ab, Ac) {return  Ap - Ap*(1-Ac)*Ab;}


CanvasRenderingContext2D.prototype.line= function(sp, ep, w, style)  {
	this.beginPath();
	this.moveTo(sp.x, sp.y);
	this.lineWidth=w;
	this.strokeStyle=style;
	this.lineTo(ep.x, ep.y);
	this.stroke();  }

//                                                      centerpoint ↓    ↓ height,width before rotation
CanvasRenderingContext2D.prototype.regularPolygon=function(vCount, x,y, h,w, rotate=0, atVertex)  {
	var i, pX, pY, angle;  //                    # of vertexes ↑   radian value ↑         ↑ optionally pass in function− typically “lineTo”
	const vertexes=[];
	if (typeof atVertex !== 'function')  atVertex=this.lineTo.bind(this);
	if (typeof rotate !== 'number')  rotate=0;
	if (rotate+=_['90°'])  {pX=Math.cos(rotate)*w+x;  pY=y-Math.sin(rotate)*h;}  // place odd-point at top
	else {pX=x+w;  pY=y;}
	this.moveTo(pX, pY);
	angle=rotate;
	for (i=1;  vertexes.push([pX, pY, angle]), i<vCount;  i++)  {
		angle=(_['π×2']/vCount)*i+rotate;
		pX=x+Math.cos(angle)*w;
		pY=y-Math.sin(angle)*h;
		atVertex(pX, pY);  }
	atVertex(vertexes[0][0], vertexes[0][1]);
//	for (i=0; i<vCount; i++)  {out+=vertexes[i][0]+'     '+vertexes[i][1]+'\n';}  alert(out);
	return vertexes;  };


/* this state is expected upon entry for use with undefined colorFilter:
		RGB_Calc.config.RGBA_Factory === Array
		RGB_Calc.config.useHexSymbol === true
 */
//SoftMoon.WebWare.canvas_graphics.rainbowRing=function(canvas, centerX, centerY, outRad, inRad, colorFilter)  {
CanvasRenderingContext2D.prototype.rainbowRing=function(centerX, centerY, outRad, inRad, colorFilter)  {
	var j, x, y, ym, yq, a;
	const ors=outRad*outRad, irs=inRad*inRad++, RGB_Calc=SoftMoon.WebWare.RGB_Calc;
	if (typeof colorFilter !== 'function')  colorFilter=RGB_Calc.to.hex.bind(RGB_Calc.to);
	for (x=-(outRad++); x<outRad; x++)  {
		for (y=Math.round(Math.sqrt(ors-x*x)),  ym=(Math.abs(x)<inRad) ? Math.round(Math.sqrt(irs-x*x)) : 0;  y>=ym;  y--)  {
			for (j=-1; j<2; j+=2)  { yq=y*j;  a=Math.Trig.getAngle(x,yq);
				this.fillStyle=colorFilter(RGB_Calc.from.hue(a / _['π×2']), a);
				this.beginPath();
				this.fillRect(centerX+x, centerY-yq, 1,1);  }  }  }  };


//                            centerpoint & size given as: pixels,angle → →↓→→→→↓   ↓ pass in function− typically “lineTo”
CanvasRenderingContext2D.prototype.polarizedDiamond=function(r,a, h,w, atVertex)  {
	h=h/2; w=w/2;   //alert(r +'\n'+ a +'\n'+ h +'\n'+ w);
	var x, y;
	if (typeof atVertex !== 'function')  atVertex=this.lineTo.bind(this);
	const vertexes=[];  //  , out

	x=r*Math.cos(Math.rad(a-w)); y=r*Math.sin(Math.rad(a-w));
	vertexes.push([x, y]);
	this.moveTo(x, y);

	x=(r+h)*Math.cos(a); y=(r+h)*Math.sin(a);
	vertexes.push([x, y]);
	atVertex(x,y);

	x=r*Math.cos(a+w); y=r*Math.sin(a+w);
	vertexes.push([x, y]);
	atVertex(x,y);

	x=(r-h)*Math.cos(a); y=(r-h)*Math.sin(a);
	vertexes.push([x, y]);
	atVertex(x,y);

	atVertex(vertexes[0][0], vertexes[0][1]);
//	for (i=0; i<4; i++)  {out+=vertexes[i][0]+'     '+vertexes[i][1]+'\n';}  alert(out);
	return vertexes;  };


// drawImage() creates a “smooth” bitmap when the scale>1
// copyPixels() creates a “rough” bitmap when the scale>1
CanvasRenderingContext2D.prototype.copyPixels=function copyPixels(src, sx, sy, sw, sh, dx, dy, dw, dh)  {
	var img, x,y,b,scalerX,scalerY;
	if (src.tagname!=='CANVAS')  {
		img=src;
		src=document.createElement('canvas');
		src.width=img.naturalWidth;  src.height=img.naturalHeight;  }
	src.context??=src.getContext('2d');
	if (img)  src.context.drawImage(img,0,0);
	const
		sPix=src.context.getImageData(sx,sy,sw,sh).data,
		dIDO=this.createImageData(dw,dh),
		dPix=dIDO.data,
		xScale=dw/sw,
		yScale=dh/sh;
	// ↓↑ note the destination should be => the source and the “scale” should be a positive integer; however if scale=1, drawImage is faster!
	for (y=0; y<sh; y++)  { for (scalerY=0; scalerY<yScale; scalerY++) {
		for (x=0; x<sw; x++)  { for (scalerX=0; scalerX<xScale; scalerX++)  {
			for (b=0; b<4; b++)  {
				dPix[((y*yScale+scalerY)*dw + x*xScale+scalerX)*4 + b]  =  sPix[(y*sw + x)*4 + b];  }  }  }  }  }
	this.putImageData(dIDO,dx,dy);
	return dIDO;  }
