const paintArrow = (ctx, task, xStart, xEnd, resStartY, height, col, direction) => {
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


    ctx.beginPath();
    //Zeitpunkt zeichnen (Dokument)
    const inverter = (direction==='left' ? -1 : 1);
    const arrowWidth = height * inverter;
    const arrowStart =  Math.round(((xStart + xEnd)/2)-(height/2)) + (direction==='left' ? height : 0);
    const halfAarrowLineWidth = height/4;
    const mid_x = height/2 * inverter;
    const mid_y = height/2;



    ctx.moveTo(arrowStart, resStartY + mid_y - halfAarrowLineWidth);
    ctx.lineTo(arrowStart + mid_x, resStartY + mid_y - halfAarrowLineWidth);
    ctx.lineTo(arrowStart + mid_x, resStartY);
    ctx.lineTo(arrowStart + arrowWidth, resStartY + mid_y);
    ctx.lineTo(arrowStart + mid_x, resStartY + height);
    ctx.lineTo(arrowStart + mid_x, resStartY + mid_y + halfAarrowLineWidth);
    ctx.lineTo(arrowStart, resStartY + mid_y + halfAarrowLineWidth);
    ctx.lineTo(arrowStart, resStartY + mid_y - halfAarrowLineWidth);

    /*let mid_x = (xStart + xEnd)/2;

    ctx.beginPath();
    //Zeitpunkt zeichnen (Dokument)
    let rectWidth = height;
    let rectHeight = height;
    ctx.rect(mid_x - rectWidth/2, resStartY, rectWidth, rectHeight);*/

    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.stroke();

    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.stroke();
}
export default paintArrow;