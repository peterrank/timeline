import paintBaseline from "./baseline";

const paintSpeechBubble = (ctx, x, y, width, height, col, borderCol, xStart, xEnd) => {
    ctx.save();
    let arrowHeight = height/4;

    let bubbleHeight = height - arrowHeight;
    if(bubbleHeight < 1) bubbleHeight = 1;

    // Radius als Prozentsatz der kleineren Seite berechnen
    let rad1 = Math.min(bubbleHeight, width) * 0.2; // z.B. 20% der kleineren Seite
    // Sicherstellen, dass der Radius nicht zu groß wird
    rad1 = Math.min(rad1, Math.min(bubbleHeight, width)/2);

    let halfArrowWidth = Math.min(arrowHeight, width/2 - rad1) / 2;

    paintBaseline(ctx,borderCol || col, xStart, xEnd, y, height, y + height);

    ctx.moveTo(x + rad1, y);

    // Obere Linie zur rechten Ecke
    ctx.lineTo(x + width - rad1, y);

    // Rechte obere Ecke
    ctx.arcTo(x + width, y, x + width, y + rad1, rad1);

    // Rechte Seite
    ctx.lineTo(x + width, y + bubbleHeight - rad1);

    // Rechte untere Ecke
    ctx.arcTo(x + width, y + bubbleHeight, x + width - rad1, y + bubbleHeight, rad1);

    // Untere Linie bis zur Pfeilspitze
    ctx.lineTo(x + width/2 + halfArrowWidth, y + bubbleHeight);

    // Pfeilspitze
    ctx.lineTo(x + width/2, y + bubbleHeight + arrowHeight);
    ctx.lineTo(x + width/2 - halfArrowWidth, y + bubbleHeight);

    // Untere Linie von Pfeilspitze zur linken Ecke
    ctx.lineTo(x + rad1, y + bubbleHeight);

    // Linke untere Ecke
    ctx.arcTo(x, y + bubbleHeight, x, y + bubbleHeight - rad1, rad1);

    // Linke Seite
    ctx.lineTo(x, y + rad1);

    // Linke obere Ecke
    ctx.arcTo(x, y, x + rad1, y, rad1);

    ctx.closePath();

    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = borderCol || col;
    ctx.stroke();

    ctx.restore();
};
export default paintSpeechBubble;