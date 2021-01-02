import cfg from "../timelineconfig";
import paintCloseIcon from "./checkboxpainter";

const paintOverlayRes = (ctx, startX, endX, startY, endY) => {
    ctx.fillStyle = "rgba(120, 120, 120, 0.8)";
    ctx.shadowColor = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const curveRadius = 10;
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, startY);
    ctx.lineTo(endX, Math.max(endY - curveRadius, startY));
    ctx.quadraticCurveTo(endX, endY, Math.max(endX - curveRadius, startX), endY);
    ctx.lineTo(startX, endY);
    ctx.fill();
}

const paintResource = (ctx, timelineHeaderHeight, res, resHeaderHeight, resHeight, resStartY, icon, headerType, printLayout, positionCollector) => {
    //Beschriftung

        let resEndY = Math.min(resStartY + resHeight, ctx.canvas.height);



        if (!headerType || headerType === 'default') {
            if (res.getMarkingColor() !== null) {
                ctx.strokeStyle = res.getMarkingColor();
                ctx.beginPath();
                ctx.moveTo(10, resEndY - 10);
                ctx.lineTo(resHeaderHeight - imgWidth - 10, resEndY - 10);
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.rect(0, resStartY, resHeaderHeight, resHeight);
            ctx.clip();

            let textStartY = Math.max(resStartY, timelineHeaderHeight);
            ctx.fillStyle = "#000000";
            ctx.font = cfg.resMainFont;
            ctx.fillText(res.getName(),   5, textStartY + 20);
            ctx.font = cfg.resSubFont;
            ctx.fillStyle = res.secLabelColor ? res.secLabelColor : "#CCC";
            ctx.fillText(res.secname,  5, textStartY + 38);

            let iconPos = {};
            if(!printLayout) {
                const y = Math.max(resStartY + resHeight - cfg.OVERLAY_CHECKBOX_Y, textStartY + 50);
                paintCloseIcon(ctx, cfg.OVERLAY_CHECKBOX_X, y);
                iconPos = {x: cfg.OVERLAY_CHECKBOX_X, y: y};
                ctx.fillStyle = "#CCC";
                ctx.fillText("mehr...", resHeaderHeight - 40, y+15);
            }
            positionCollector.set(res.id, {
                x: 0,
                y: resStartY,
                width: resHeaderHeight,
                height: resHeight,
                iconX: iconPos.x,
                iconY: iconPos.y
            });


            let imgWidth = 0;
            let imgHeight = 0;
            if (icon && icon.width) {
                try {
                    imgWidth = Math.min(Math.max(Math.round(resHeaderHeight / 2), 32), icon.width); //Maximal so breit, wie das Image im Origional ist, ansonsten mindestens 32 Pixel breit
                    imgHeight = Math.round(icon.height * imgWidth / icon.width);
                    if (imgHeight > resHeight) {
                        imgHeight = resHeight;
                        imgWidth = Math.round(icon.width * imgHeight / icon.height);
                    }
                    ctx.drawImage(icon, resHeaderHeight - imgWidth - 5, resEndY - imgHeight - 15, imgWidth, imgHeight);
                } catch (e) {
                    console.log("Exception beim Zeichnen von Icon");
                    console.log(icon);
                    console.log(e);
                }
            }
        } else if (headerType === 'overlay') {
            let textStartY = Math.max(resStartY, timelineHeaderHeight);
            const startY = textStartY + 1;
            const endY = textStartY + Math.min(resEndY - textStartY, cfg.OVERLAYHEADERHEIGHT);
            const startX = 0;
            const endX = resHeaderHeight;

            paintOverlayRes(ctx, startX, endX, startY, endY);

            ctx.beginPath();
            ctx.rect(0, resStartY, resHeaderHeight, endY - resStartY);
            ctx.clip();

            ctx.fillStyle = "#000000";
            ctx.font = cfg.resMainFont;
            ctx.fillText(res.getName(),   5, textStartY + 20);
            ctx.font = cfg.resSubFont;
            ctx.fillStyle = res.secLabelColor ? res.secLabelColor : "#CCC";
            ctx.fillText(res.secname,  5, textStartY + 38);

            let iconPos = {};
            if(!printLayout) {
                const y = textStartY + 50;
                paintCloseIcon(ctx, cfg.OVERLAY_CHECKBOX_X, y);
                iconPos = {x: cfg.OVERLAY_CHECKBOX_X, y: y};
                ctx.fillStyle = "#CCC";
                ctx.fillText("mehr...", resHeaderHeight - 40, y+15);
            }

            positionCollector.set(res.id, {
                x: 0,
                y: resStartY,
                width: resHeaderHeight,
                height: resHeight,
                iconX: iconPos.x,
                iconY: iconPos.y
            });

            let imgWidth = 0;
            let imgHeight = 0;
            if (icon && icon.width) {
                try {
                    imgWidth = Math.max(Math.round((endY - startY - 20) / 2), 32); //Maximal so breit, wie das Image im Origional ist, ansonsten mindestens 32 Pixel breit
                    imgHeight = Math.round(icon.height * imgWidth / icon.width);
                    if (imgHeight > resHeight) {
                        imgHeight = resHeight;
                        imgWidth = Math.round(icon.width * imgHeight / icon.height);
                    }
                    ctx.drawImage(icon, resHeaderHeight - imgWidth - 5, endY - imgHeight - 20, imgWidth, imgHeight);
                } catch (e) {
                    console.log("Exception beim Zeichnen von Icon");
                    console.log(icon);
                    console.log(e);
                }
            }
        } else if (headerType === 'inline') {
            ctx.fillStyle = "rgba(120, 120, 120, 0.8)";
            ctx.fillRect(0, resStartY, resHeaderHeight, cfg.INLINE_RES_HEIGHT);

            let x = 10;

            let iconPos = {};
            if(!printLayout) {
                paintCloseIcon(ctx, x, resStartY + 8);
                iconPos = {x, y: resStartY + 8};
                positionCollector.set(res.id, {x: cfg.x, y: resStartY + 8});
                x+=30;
            }

            let imgWidth = 0;
            let imgHeight = 0;
            if (icon && icon.width) {
                try {
                    imgHeight = cfg.INLINE_RES_HEIGHT - 4;
                    imgWidth = Math.round(icon.width * imgHeight / icon.height);

                    ctx.drawImage(icon, x, resStartY + 2, imgWidth, imgHeight);
                    x += imgWidth + 10;
                } catch (e) {
                    console.log("Exception beim Zeichnen von Icon");
                    console.log(icon);
                    console.log(e);
                }
            }

            ctx.fillStyle = "#FFF";
            ctx.font = cfg.resMainFont;
            ctx.fillText(res.getName(),  x, resStartY + 20);
            x+=ctx.measureText(res.getName()).width + 10;
            ctx.font = cfg.resSubFont;
            ctx.fillStyle = res.secLabelColor ? res.secLabelColor : "#CCC";
            ctx.fillText(res.secname,  x, resStartY + 20);

            positionCollector.set(res.id, {
                x: 0,
                y: resStartY,
                width: resHeaderHeight,
                height: cfg.INLINE_RES_HEIGHT,
                iconX: iconPos.x,
                iconY: iconPos.y
            });


        }


}

export {paintResource};