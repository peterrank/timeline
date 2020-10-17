const paintCurlyBrace = (ctx, alignedStart, alignedEnd, resStartY, height, col) => {
    if(height < 1) height = 1;
    const halfWay = alignedStart + (alignedEnd - alignedStart) / 2;
    //Die Klammer nimmt 2/3 der Höhe ein
    const braceHeight = height * 2 / 3;
    //Der max. Radius ist damit die Hälfte der Höhe
    const radius = braceHeight / 2;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    if (alignedEnd - alignedStart < 4 * radius) {
        ctx.moveTo(alignedStart, resStartY + radius);
        ctx.lineTo(alignedEnd, resStartY + radius);
        ctx.moveTo(halfWay, resStartY + radius);
        ctx.lineTo(halfWay, resStartY + 2 * radius);
    } else {
        ctx.moveTo(alignedStart, resStartY);
        ctx.arcTo(alignedStart, resStartY + radius, alignedStart + radius, resStartY + radius, radius);
        ctx.lineTo(halfWay - radius, resStartY + radius);
        ctx.arcTo(halfWay, resStartY + radius, halfWay, resStartY + 2 * radius, radius);
        ctx.arcTo(halfWay, resStartY + radius, halfWay + radius, resStartY + radius, radius);
        ctx.lineTo(alignedEnd - radius, resStartY + radius);
        ctx.arcTo(alignedEnd, resStartY + radius, alignedEnd, resStartY, radius);
    }
    ctx.stroke();
    ctx.restore();
};

export default paintCurlyBrace;