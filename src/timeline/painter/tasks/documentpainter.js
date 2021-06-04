const paintDocument = (ctx, task, xStart, xEnd, resStartY, height, col) => {
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
    let rectWidth = height/1.414;
    let rectHeight = height;
    ctx.rect(mid_x - rectWidth/2, resStartY, rectWidth, rectHeight);

    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.stroke();

    //Schriftzeilen zeichnen
    ctx.beginPath();
    for(let n=1; n<4; n++) {
        ctx.moveTo(mid_x - rectWidth/2 + 2, resStartY + rectHeight / 5 * n);
        ctx.lineTo(mid_x + rectWidth/2 - 2, resStartY + rectHeight / 5 * n);
    }
    ctx.strokeStyle = '#000000';
    ctx.stroke();
}
export default paintDocument;