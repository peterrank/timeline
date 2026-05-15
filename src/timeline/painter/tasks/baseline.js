const paintBaseline = (ctx, col, xStart, xEnd, resStartY, height, baselineY) => {
  if(col && !isNaN(xStart) && !isNaN(xEnd)) {
    ctx.beginPath();
    if(resStartY + height < baselineY) {
      const x = Math.round((xEnd + xStart) / 2);
      ctx.moveTo(x, baselineY);
      ctx.lineTo(x, resStartY + height);
    }

    ctx.moveTo(xStart, baselineY);
    ctx.lineTo(xEnd, baselineY);
    ctx.strokeStyle = col;
    ctx.stroke();
  }
}

export default paintBaseline;