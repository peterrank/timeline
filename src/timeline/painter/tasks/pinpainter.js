const paintPin = (ctx, task, xStart, xEnd, resStartY, height, col, paintDot) => {
    if(height < 2) {
        height = 2;
    }
    let radius = height / 2;

    if(col) {
        ctx.beginPath();
        ctx.moveTo(xStart, resStartY + height);
        ctx.lineTo(xEnd, resStartY + height);
        ctx.strokeStyle = col;
        ctx.stroke();
    }

    let mid_x = (xStart + xEnd)/2;
    ctx.beginPath();
    ctx.moveTo(mid_x, resStartY);
    ctx.bezierCurveTo(mid_x - radius, resStartY, mid_x - radius, resStartY + height / 2, mid_x, resStartY + height);
    ctx.bezierCurveTo(mid_x + radius, resStartY + height / 2, mid_x + radius, resStartY, mid_x, resStartY);

    if (col) {
        ctx.fillStyle = col;
        ctx.fill();
        if (paintDot) {
            ctx.beginPath();
            ctx.arc(mid_x, resStartY + height / 4, height / 10, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = "white";
            ctx.fill();
        }
    }
}
export default paintPin;