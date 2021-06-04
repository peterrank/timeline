const paintStar = (ctx, task, xStart, xEnd, resStartY, height, col, spikes) => {
    if(!spikes) {
        spikes = 6;
    }
    if(height < 2) {
        height = 2;
    }

    if(col) {
        ctx.beginPath();
        ctx.moveTo(xStart, resStartY + height);
        ctx.lineTo(xEnd, resStartY + height);
        ctx.strokeStyle = col;
        ctx.stroke();
    }

    let mid_x = (xStart + xEnd)/2;
    let halfHeight = Math.round(height / 2);
    //Zeitpunkt zeichnen
    let outerRadius = halfHeight;
    let innerRadius = halfHeight / 2;

    let cy = resStartY + halfHeight;
    let rot = Math.PI / 2 * 3;
    let x = mid_x;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(x, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
        x = mid_x + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y)
        rot += step

        x = mid_x + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y)
        rot += step
    }
    ctx.lineTo(mid_x, cy - outerRadius);
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