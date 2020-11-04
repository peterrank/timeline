import paintBaseline from "./baseline";

const paintCross = (ctx, task, xStart, xEnd, resStartY, baselineY, height, col) => {
    if(height < 2) {
        height = 2;
    }

    paintBaseline(ctx, col, xStart, xEnd, resStartY, height, baselineY);

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