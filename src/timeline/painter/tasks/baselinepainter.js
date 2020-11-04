import paintBaseline from "./baseline";

const paintOnlyBaseline = (ctx, x, y, width, height, col, borderCol, xStart, xEnd) => {
    ctx.save();

    paintBaseline(ctx,borderCol || col, xStart, xEnd, y, height, y + height);

    ctx.rect(x, y, width, height);

    ctx.restore();
};
export default paintOnlyBaseline;