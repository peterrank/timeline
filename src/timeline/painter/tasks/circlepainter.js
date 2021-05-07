const paintCircle = (ctx, xStart, xEnd, resStartY, radius, col) => {
    if(radius < 1) radius = 1;

    if(col) {
        ctx.beginPath();
        ctx.moveTo(xStart, resStartY + 2 * radius);
        ctx.lineTo(xEnd, resStartY + 2 * radius);
        ctx.strokeStyle = col;
        ctx.stroke();
    }

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