const paintCircle = (ctx, alignedStart, resStartY, radius, col) => {
    if(radius < 1) radius = 1;
    //Zeitpunkt zeichnen (Kreis)
    ctx.moveTo(alignedStart - radius, resStartY + radius);
    ctx.arc(alignedStart, resStartY + radius, radius, Math.PI, 4 * Math.PI);

    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.stroke();
    //ctx.restore();
}
export default paintCircle;