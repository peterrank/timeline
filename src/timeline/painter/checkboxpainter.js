const paintCloseIcon = (ctx, x, y) => {
  ctx.fillStyle = "#AAA";
  ctx.beginPath();

  ctx.strokeStyle = "#333";
  ctx.arc(x + 8, y + 8, 8, 0, 2 * Math.PI);
  ctx.fill();
  ctx.moveTo(x + 4, y + 4);
  ctx.lineTo(x + 12, y + 12);
  ctx.moveTo(x + 12, y + 4);
  ctx.lineTo(x + 4, y + 12);
  ctx.stroke();

}
export default paintCloseIcon;