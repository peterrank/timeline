import paintBaseline from "./baseline";

const paintSpeechBubble = (ctx, x, y, width, height, col, borderCol, xStart, xEnd) => {
    ctx.save();
    let rad1;
    let arrowHeight = height/3;

    let bubbleHeight = height - arrowHeight;
    if(bubbleHeight < 1) bubbleHeight = 1;
    if (typeof(rad1) == "undefined") rad1 = 5;
    if(rad1 > Math.min(bubbleHeight, width)/2) rad1 = Math.min(bubbleHeight, width)/2;
    let halfArrowWidth = Math.min(arrowHeight, width/2 - rad1);

    paintBaseline(ctx,borderCol || col, xStart, xEnd, y, height, y + height);

    ctx.moveTo(x+rad1, y);
    ctx.arcTo(x+width, y,    x+width, y+bubbleHeight, rad1);
    ctx.arcTo(x+width, y+bubbleHeight, x,    y+bubbleHeight, rad1);
    ctx.lineTo(x+width/2 + halfArrowWidth, y+bubbleHeight);
    ctx.lineTo(x+width/2, y+bubbleHeight+arrowHeight);
    ctx.lineTo(x+width/2 - halfArrowWidth, y+bubbleHeight);
    ctx.arcTo(x,   y+bubbleHeight, x,    y,    rad1);
    ctx.arcTo(x,    y,    x+width, y,    rad1);

    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = borderCol || col;
    ctx.stroke();

    ctx.restore();
};
export default paintSpeechBubble;