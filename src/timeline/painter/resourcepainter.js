import cfg from "../timelineconfig";
import paintCloseIcon from "./checkboxpainter";

const paintResource = (ctx, timeline, res, resHeaderHeight, resHeight, resStartY, icon, paintOverlayRes) => {
    //Beschriftung
    if (timeline.props.horizontalOrientation) {
        let resEndY = Math.min(resStartY + resHeight, ctx.canvas.height);
        let textStartY = Math.max(resStartY, timeline.timelineHeaderHeight);
        let imgWidth = 0;

        if (!timeline.props.overlayheader) {
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
        }


        if (timeline.props.overlayheader) {
            const startY = textStartY + 1;
            const endY = textStartY + Math.min(resEndY - textStartY, cfg.OVERLAYHEADERHEIGHT);
            const startX = 0;
            const endX = resHeaderHeight;

            paintOverlayRes(startX, endX, startY, endY);
        }
        ctx.beginPath();
        ctx.rect(0, resStartY, resHeaderHeight, resHeight);
        ctx.clip();

        ctx.font = cfg.resMainFont;
        ctx.fillStyle = res.labelColor ? res.labelColor : (timeline.props.overlayheader ? "#FFF" : "#000000");
        ctx.fillText(res.getName(), 2, textStartY + 20);
        ctx.font = cfg.resSubFont;
        ctx.fillStyle = res.secLabelColor ? res.secLabelColor : "#CCC";
        ctx.fillText(res.secname, 2, textStartY + 38);
        if (timeline.props.overlayheader && !timeline.props.printLayout) {
            //Checkbox zeichnen
            paintCloseIcon(ctx, cfg.OVERLAY_CHECKBOX_X, textStartY + cfg.OVERLAY_CHECKBOX_Y);

            ctx.fillStyle = "#CCC";
            ctx.fillText("mehr...", 90, textStartY + 60);
        }

    } else {
        const TRANS_X = 20;
        ctx.translate(TRANS_X, resStartY + resHeight - 3);
        ctx.rotate(-Math.PI / 2);

        let textStartX = Math.max(resStartY + resHeight - ctx.canvas.width, 0);
        let resEndX = Math.min(resStartY + resHeight - timeline.timelineHeaderHeight, resHeight);

        let imgWidth = 0;
        if (!timeline.props.overlayheader && icon) {
            try {
                imgWidth = Math.min(Math.max(Math.round(resHeight / 2), 32), icon.width);  //Maximal so breit, wie das Image im Origional ist, ansonsten mindestens 32 Pixel breit
                let imgHeight = Math.round(icon.height * imgWidth / icon.width);
                if (imgHeight > resHeaderHeight / 2) {
                    imgHeight = Math.round(resHeaderHeight / 2);
                    imgWidth = Math.round(icon.width * imgHeight / icon.height);
                }
                ctx.drawImage(icon, resEndX - imgWidth - 5, resHeaderHeight - imgHeight - 25, imgWidth, imgHeight);
            } catch (e) {
                console.log("Exception beim Zeichnen der Icons");
                console.log(e);
            }
        }


        if (timeline.props.overlayheader) {
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

        ctx.fillStyle = (timeline.props.overlayheader ? "#FFF" : "#000000");
        ctx.font = cfg.resMainFont;
        ctx.fillText(res.getName(), textStartX + 2, 0);
        ctx.font = cfg.resSubFont;
        ctx.fillStyle = res.secLabelColor ? res.secLabelColor : "#CCC";
        ctx.fillText(res.secname, textStartX + 2, 18);
        if (timeline.props.overlayheader && !timeline.props.printLayout) {
            //Checkbox zeichnen
            paintCloseIcon(ctx, textStartX + cfg.OVERLAY_CHECKBOX_X, cfg.OVERLAY_CHECKBOX_Y - TRANS_X);

            ctx.fillStyle = "#CCC";
            ctx.fillText("mehr...", textStartX + 90, 60 - TRANS_X);
        }
    }
}

export {paintResource};