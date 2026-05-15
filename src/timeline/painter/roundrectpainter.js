const roundedRect = (ctx, x, y, width, height, rad1) => {
    if(height < 1) height = 1;
    if (typeof(rad1) == "undefined") rad1 = 5;
    if(rad1 > Math.min(height, width)/2) rad1 = Math.min(height, width)/2;

    ctx.moveTo(x+rad1, y);
    ctx.arcTo(x+width, y,    x+width, y+height, rad1);
    ctx.arcTo(x+width, y+height, x,    y+height, rad1);
    ctx.arcTo(x,   y+height, x,    y,    rad1);
    ctx.arcTo(x,    y,    x+width, y,    rad1);
};
export default roundedRect;