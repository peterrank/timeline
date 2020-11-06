const paintCloud = (context, x, y, width, height, col) => {
    if(height < 1) height = 1;
    // draw cloud
    const getXOffset = (num) => {
        return (23+num)/260*width;
    }
    const getYOffset = (num) => {
        return (40+num)/160*height;
    }
    context.save();
    context.beginPath();
    context.moveTo(x + getXOffset(0), y+getYOffset(30));
    context.bezierCurveTo(x + getXOffset(-40), y + getYOffset(50), x + getXOffset(-40), y + getYOffset(100), x + getXOffset(60), y + getYOffset(100));
    context.bezierCurveTo(x + getXOffset(80), y + getYOffset(130), x + getXOffset(150), y + getYOffset(130), x + getXOffset(170), y + getYOffset(100));
    context.bezierCurveTo(x + getXOffset(250), y + getYOffset(100), x + getXOffset(250), y + getYOffset(70), x + getXOffset(220), y + getYOffset(50));
    context.bezierCurveTo(x + getXOffset(260), y + getYOffset(-10), x + getXOffset(200), y + getYOffset(-20), x + getXOffset(170), y + getYOffset(0));
    context.bezierCurveTo(x + getXOffset(150), y + getYOffset(-45), x + getXOffset(80), y + getYOffset(-30), x + getXOffset(80), y + getYOffset(0));
    context.bezierCurveTo(x + getXOffset(30), y + getYOffset(-45), x + getXOffset(-20), y + getYOffset(-30), x + getXOffset(0), y + getYOffset(30));
    context.closePath();
    context.lineWidth = Math.max(1, Math.min(4, Math.round(height / 10)));
    context.fillStyle = col;
    context.fill();
    context.strokeStyle = context.fillStyle;
    context.stroke();
    context.restore();
};
export default paintCloud;