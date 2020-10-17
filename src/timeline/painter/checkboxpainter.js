const paintCheckBox = (ctx, x, y, checked) => {
    if (checked) {
        ctx.fillStyle = "#FF3D00";
        ctx.fillRect(x, y, 20, 20);
        ctx.strokeStyle = "#FFF";
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 10);
        ctx.lineTo(x + 7, y + 15);
        ctx.lineTo(x + 15, y + 5);
        ctx.stroke();
    } else {
        ctx.fillStyle = "#FF3D00";
        ctx.fillRect(x, y, 20, 20);
    }
}
export default paintCheckBox;