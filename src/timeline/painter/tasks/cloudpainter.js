const getXOffset = (num, width) => {
    return (23+num)/260*width;
}

const getYOffset = (num, height) => {
    return (30+num)/155*height;
}

const paintCloud = (context, x, y, width, height, col) => {
    if(height < 1) height = 1;
    // draw cloud
    context.save();
    context.beginPath();
    context.moveTo(x + getXOffset(0), y+getYOffset(30));
    context.bezierCurveTo(x + getXOffset(-20, width), y + getYOffset(60,height), x + getXOffset(-40, width), y + getYOffset(100,height), x + getXOffset(60, width), y + getYOffset(100,height));
    context.bezierCurveTo(x + getXOffset(80, width), y + getYOffset(130,height), x + getXOffset(150, width), y + getYOffset(130,height), x + getXOffset(170, width), y + getYOffset(100,height));
    context.bezierCurveTo(x + getXOffset(240, width), y + getYOffset(100,height), x + getXOffset(250, width), y + getYOffset(70,height), x + getXOffset(220, width), y + getYOffset(50,height));
    context.bezierCurveTo(x + getXOffset(240, width), y + getYOffset(-10,height), x + getXOffset(200, width), y + getYOffset(-20,height), x + getXOffset(170, width), y + getYOffset(0,height));
    context.bezierCurveTo(x + getXOffset(150, width), y + getYOffset(-45,height), x + getXOffset(80, width), y + getYOffset(-30,height), x + getXOffset(80, width), y + getYOffset(0,height));
    context.bezierCurveTo(x + getXOffset(30, width), y + getYOffset(-45,height), x + getXOffset(-20, width), y + getYOffset(-30,height), x + getXOffset(0, width), y + getYOffset(30,height));
    context.closePath();
    context.lineWidth = Math.max(1, Math.min(4, Math.round(height / 10)));
    context.fillStyle = col;
    context.fill();
    context.strokeStyle = context.fillStyle;
    context.stroke();
    context.restore();
};
export default paintCloud;