import paintBaseline from "./baseline";

const paintCircleMiddleText = (ctx, x, y, width, height, col, borderCol, xStart, xEnd) => {
    ctx.save();
    let rad1;
    let arrowHeight = height/3;

    let bubbleHeight = height - arrowHeight;
    if(bubbleHeight < 1) bubbleHeight = 1;
    if (typeof(rad1) == "undefined") rad1 = 5;
    if(rad1 > Math.min(bubbleHeight, width)/2) rad1 = Math.min(bubbleHeight, width)/2;

    let circleRad = arrowHeight / 3;

    paintBaseline(ctx,borderCol || col, xStart, xEnd, y, height, y + height);

    let mid_x = x+width/2;

    ctx.beginPath();
    //Zeitpunkt zeichnen (Kreis)
    //ctx.moveTo(mid_x - circleRad, y+bubbleHeight + circleRad);
    ctx.arc(mid_x, y+bubbleHeight + arrowHeight - circleRad, circleRad, Math.PI, 4 * Math.PI);

    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.stroke();


    ctx.rect(x, y, width, height);

    //.fillStyle = col;
    //ctx.fill();
    //ctx.strokeStyle = 'rgba(0,0,0,0)';
    //ctx.stroke();

    ctx.restore();
};
export default paintCircleMiddleText;