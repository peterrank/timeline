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

const paintResource = (ctx, timelineHeaderHeight, res, resHeaderHeight, resHeight, resStartY, icon, horizontalOrientation, headerType, printLayout, positionCollector) => {
    //Beschriftung
    if (horizontalOrientation) {
        let resEndY = Math.min(resStartY + resHeight, ctx.canvas.height);

        let imgWidth = 0;

        if (!headerType || headerType === 'default') {
            if (icon && icon.width) {
                try {
                    imgWidth = Math.min(Math.max(Math.round(resHeaderHeight / 2), 32), icon.width); //Maximal so breit, wie das Image im Origional ist, ansonsten mindestens 32 Pixel breit
                    let imgHeight = Math.round(icon.height * imgWidth / icon.width);
                    if (imgHeight > resHeight) {
                        imgHeight = resHeight;
                        imgWidth = Math.round(icon.width * imgHeight / icon.height);
                    }
                    ctx.drawImage(icon, resHeaderHeight - imgWidth - 5, resEndY - imgHeight - 5, imgWidth, imgHeight);
                } catch (e) {
                    console.log("Exception beim Zeichnen von Icon");
                    console.log(icon);
                    console.log(e);
                }
            }

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
        } else if (headerType === 'overlay') {
            let textStartY = Math.max(resStartY, timelineHeaderHeight);
            const startY = textStartY + 1;
            const endY = textStartY + Math.min(resEndY - textStartY, cfg.OVERLAYHEADERHEIGHT);
            const startX = 0;
            const endX = resHeaderHeight;

            paintOverlayRes(ctx, startX, endX, startY, endY);

            ctx.beginPath();
            ctx.rect(0, resStartY, resHeaderHeight, resHeight);
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
    } else {
        const TRANS_X = 20;
        ctx.translate(TRANS_X, resStartY + resHeight - 3);
        ctx.rotate(-Math.PI / 2);

        let textStartX = Math.max(resStartY + resHeight - ctx.canvas.width, 0);
        let resEndX = Math.min(resStartY + resHeight - timelineHeaderHeight, resHeight);

        let imgWidth = 0;
        if ((!headerType || headerType === 'default') && icon) {
            try {
                imgWidth = Math.min(Math.max(Math.round(resHeight / 2), 32), icon.width);  //Maximal so breit, wie das Image im Origional ist, ansonsten mindestens 32 Pixel breit
                let imgHeight = Math.round(icon.height * imgWidth / icon.width);
                if (imgHeight > resHeaderHeight / 2) {
                    imgHeight = Math.round(resHeaderHeight / 2);
                    imgWidth = Math.round(icon.width * imgHeight / icon.height);
                }
                ctx.drawImage(icon, resEndX - imgWidth - 5, resHeaderHeight - imgHeight - 25, imgWidth, imgHeight);

                ctx.fillStyle = (headerType === 'overlay' ? "#FFF" : "#000000");
                ctx.font = cfg.resMainFont;
                ctx.fillText(res.getName(), textStartX + 2, 0);
                ctx.font = cfg.resSubFont;
                ctx.fillStyle = res.secLabelColor ? res.secLabelColor : "#CCC";
                ctx.fillText(res.secname, textStartX + 2, 18);

            } catch (e) {
                console.log("Exception beim Zeichnen der Icons");
                console.log(e);
            }
        }


        if (headerType === 'overlay') {
            const startY = -30;
            const endY = startY + 30 - TRANS_X + cfg.OVERLAYHEADERHEIGHT;
            const startX = textStartX - 2;
            const endX = Math.min(resEndX, startX + cfg.OVERLAYHEADERWIDTH);

            paintOverlayRes(startX, endX, startY, endY);

            ctx.clip();
        } else if (res.getMarkingColor() !== null) {
            ctx.strokeStyle = res.getMarkingColor();
            ctx.beginPath();
            ctx.moveTo(10, resHeaderHeight - 30);
            ctx.lineTo(resEndX - imgWidth - 10, resHeaderHeight - 30);
            ctx.stroke();
        }

        if (headerType === 'overlay' && !printLayout) {
            //Checkbox zeichnen
            paintCloseIcon(ctx, textStartX + cfg.OVERLAY_CHECKBOX_X, cfg.OVERLAY_CHECKBOX_Y - TRANS_X);
            positionCollector.set(res.id, {x: textStartX + cfg.OVERLAY_CHECKBOX_X, y: cfg.OVERLAY_CHECKBOX_Y - TRANS_X});

            ctx.fillStyle = "#CCC";
            ctx.fillText("mehr...", textStartX + 90, 60 - TRANS_X);
        }
    }
}

export {paintResource};