//Zeichnet nur den Pfad der Klammer (ohne Stroke/Fill), damit er auch für die Hilfslinien-Füllung
//(die sich an die Klammerform anschmiegen soll) wiederverwendet werden kann.
export const traceCurlyBrace = (ctx, alignedStart, alignedEnd, resStartY, height, direction, continueFromCurrentPoint = false) => {
    height = Math.max(height, 1);
    const halfWay = alignedStart + (alignedEnd - alignedStart) / 2;
    //"up": Klammerenden oben, Spitze zeigt nach unten. "down": gespiegelt - Klammerenden unten, Spitze zeigt nach oben.
    const radius = height / 2;
    const armY = direction === 'down' ? resStartY + height : resStartY;
    const tipY = direction === 'down' ? resStartY : resStartY + height;
    //continueFromCurrentPoint: der Pfad wird an einen bestehenden Pfad angehängt (z.B. die Füllfläche), statt
    //selbst ein neues Subpath per moveTo zu beginnen - sonst würde ein moveTo hier den Anschluss zerreißen.
    if (alignedEnd - alignedStart < 2 * radius) {
        if (continueFromCurrentPoint) {
            ctx.lineTo(alignedStart, resStartY + radius);
        } else {
            ctx.moveTo(alignedStart, resStartY + radius);
        }
        ctx.lineTo(alignedEnd, resStartY + radius);
        ctx.moveTo(halfWay, resStartY + radius);
        ctx.lineTo(halfWay, tipY);
    } else {
        if (continueFromCurrentPoint) {
            ctx.lineTo(alignedStart, armY);
        } else {
            ctx.moveTo(alignedStart, armY);
        }
        ctx.arcTo(alignedStart, resStartY + radius, alignedStart + radius, resStartY + radius, radius);
        ctx.lineTo(halfWay - radius, resStartY + radius);
        ctx.arcTo(halfWay, resStartY + radius, halfWay, tipY, radius);
        ctx.arcTo(halfWay, resStartY + radius, halfWay + radius, resStartY + radius, radius);
        ctx.lineTo(alignedEnd - radius, resStartY + radius);
        ctx.arcTo(alignedEnd, resStartY + radius, alignedEnd, armY, radius);
    }
};

const paintCurlyBrace = (ctx, alignedStart, alignedEnd, resStartY, height, col, borderCol, direction) => {
    if (height < 1) height = 1;
    //Der max. Radius ist damit die Hälfte der Höhe
    ctx.save();
    ctx.strokeStyle = borderCol || col;
    ctx.lineWidth = Math.max(1, Math.min(5, Math.round(height / 4)));
    ctx.lineCap = "round";
    traceCurlyBrace(ctx, alignedStart, alignedEnd, resStartY, height, direction);
    ctx.stroke();
    ctx.restore();
};

export default paintCurlyBrace;