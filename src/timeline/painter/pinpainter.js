const paintPin = (ctx, task, cx, cxEnd, resStartY, height, col, paintDot) => {
    if(height < 2) {
        height = 2;
    }
    let radius = height / 2;

    ctx.moveTo(cx, resStartY);
    ctx.bezierCurveTo(cx - radius, resStartY, cx - radius, resStartY + height / 2, cx, resStartY + height);
    ctx.bezierCurveTo(cx + radius, resStartY + height / 2, cx + radius, resStartY, cx, resStartY);

    if (col) {
        ctx.fillStyle = col;
        ctx.fill();
        if (paintDot) {
            ctx.beginPath();
            ctx.arc(cx, resStartY + height / 4, height / 10, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = "white";
            ctx.fill();
        }
    }
}
export default paintPin;