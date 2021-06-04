const paintCross = (ctx, task, xStart, xEnd, resStartY, height, col) => {
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

    ctx.beginPath();
    //Zeitpunkt zeichnen (Dokument)
    const crossWidth = height/1.414;
    const crossHeight = height;
    const crossBarWidth = height / 5;
    const crossPos = height /2.5;
    const halfCrossBarWidth = crossBarWidth/2;

    ctx.moveTo(mid_x - halfCrossBarWidth, resStartY);
    ctx.lineTo(mid_x + halfCrossBarWidth, resStartY);
    ctx.lineTo(mid_x + halfCrossBarWidth, resStartY + crossPos - halfCrossBarWidth);
    ctx.lineTo(mid_x + halfCrossBarWidth + crossWidth / 2, resStartY + crossPos - halfCrossBarWidth);
    ctx.lineTo(mid_x + halfCrossBarWidth + crossWidth / 2, resStartY + crossPos + halfCrossBarWidth);
    ctx.lineTo(mid_x + halfCrossBarWidth, resStartY + crossPos + halfCrossBarWidth);
    ctx.lineTo(mid_x + halfCrossBarWidth, resStartY + crossHeight);
    ctx.lineTo(mid_x - halfCrossBarWidth, resStartY + crossHeight);
    ctx.lineTo(mid_x - halfCrossBarWidth, resStartY + crossPos + halfCrossBarWidth);
    ctx.lineTo(mid_x - halfCrossBarWidth - crossWidth / 2 , resStartY + crossPos + halfCrossBarWidth);
    ctx.lineTo(mid_x - halfCrossBarWidth - crossWidth / 2 , resStartY + crossPos - halfCrossBarWidth);
    ctx.lineTo(mid_x - halfCrossBarWidth, resStartY + crossPos - halfCrossBarWidth);
    ctx.moveTo(mid_x - halfCrossBarWidth, resStartY);

    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.stroke();
}
export default paintCross;