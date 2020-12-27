const paintStar = (ctx, task, cx, cxEnd, resStartY, height, col) => {
    if(height < 2) {
        height = 2;
    }
    let halfHeight = Math.round(height / 2);
    //Zeitpunkt zeichnen
    let spikes = 6;
    let outerRadius = halfHeight;
    let innerRadius = halfHeight / 2;

    let cy = resStartY + halfHeight;
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y)
        rot += step

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y)
        rot += step
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    //ctx.strokeStyle = "white";
    //ctx.stroke();
    if (col) {
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = ctx.fillStyle;
        ctx.stroke();
    }
}
export default paintStar;