import paintBaseline from "./baseline";

const paintCircle = (ctx, xStart, xEnd, resStartY, baselineY, radius, height, col) => {
    if(radius < 1) radius = 1;

    paintBaseline(ctx, col, xStart, xEnd, resStartY, height, baselineY);

    let mid_x = (xStart + xEnd)/2;

    ctx.beginPath();
    //Zeitpunkt zeichnen (Kreis)
    ctx.moveTo(mid_x - radius, resStartY + radius);
    ctx.arc(mid_x, resStartY + radius, radius, Math.PI, 4 * Math.PI);

    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.stroke();
    //ctx.restore();
}
export default paintCircle;