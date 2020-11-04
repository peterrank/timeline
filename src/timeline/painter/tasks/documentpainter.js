import paintBaseline from "./baseline";

const paintDocument = (ctx, task, xStart, xEnd, resStartY, baselineY, height, col) => {
    if(height < 2) {
        height = 2;
    }

    paintBaseline(ctx, col, xStart, xEnd, resStartY, height, baselineY);

    ctx.beginPath();

    //Zeitpunkt zeichnen (Dokument)
    const rectWidth = height/1.414;
    const rectHeight = height;
    const knikWidth = rectWidth / 2;
    const lineInset = rectWidth / 6;
    const mid_xStart = (xStart + xEnd) / 2 - rectWidth / 2;

    ctx.moveTo(mid_xStart, resStartY);
    ctx.lineTo(mid_xStart + rectWidth - knikWidth, resStartY);
    ctx.lineTo(mid_xStart + rectWidth, resStartY + knikWidth);
    ctx.lineTo(mid_xStart + rectWidth, resStartY + rectHeight);
    ctx.lineTo(mid_xStart, resStartY + rectHeight);
    ctx.lineTo(mid_xStart, resStartY);

    ctx.moveTo(mid_xStart + rectWidth - knikWidth, resStartY);
    ctx.lineTo(mid_xStart + rectWidth - knikWidth, resStartY + knikWidth);
    ctx.lineTo(mid_xStart + rectWidth, resStartY + knikWidth);

    //ctx.rect(mid_x - rectWidth/2, resStartY, rectWidth, rectHeight);

    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.stroke();

    //Schriftzeilen zeichnen
    ctx.beginPath();
    for(let n=2; n<5; n++) {
        ctx.moveTo(mid_xStart + lineInset, resStartY + rectHeight / 5 * n);
        ctx.lineTo(mid_xStart + rectWidth - lineInset, resStartY + rectHeight / 5 * n);
    }
    ctx.lineWidth=2;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
}
export default paintDocument;