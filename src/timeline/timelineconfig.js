const getTaskBarInsetByCollapseState = (isCollapsed) => {
     if(isCollapsed) {
          return 2;
     }
     return 5;
}

const config = {
     ARROWHEADLENGTH : 20,
     OVERLAYHEADERWIDTH : 150,
     OVERLAYHEADERHEIGHT : 70,
     OVERLAY_CHECKBOX_X : 10,
     OVERLAY_CHECKBOX_Y : 20,
     CHART_INSET : 25,
     INLINE_RES_HEIGHT: 40,

     currentDateOnMousePositionFont : "14px Roboto, sans-serif",
     resMainFont : "14px Roboto, sans-serif",
     resMainFontColor: "#000",
     timelineMainFont : "16px Roboto, sans-serif",
     timelineMainFontColor: "#000",
     timelineSubFont : "12px Roboto, sans-serif",
     timelineSubFontColor: "#555",
     resourceMainFont : "12px Roboto, sans-serif",
     resSubFont : "12px Roboto, sans-serif",
     resSubFontColor: "#CCC",
     overlayMessageFont : "16px Roboto, sans-serif",
     positionDecorationFont : "Roboto, sans-serif",

     timelineHeaderColor : "#F7F7F7",
     timelineHeaderMainTickColor: "rgba(50,50,50,0.5)",
     timelineMainTickColor: "rgba(200,200,200,0.8)",
     timelineSubTickColor: "rgba(200,200,200,0.5)",
     resourceOverlayInlineColor: "rgba(120, 120, 120, 0.8)",
     saturdayColor : "rgba(255, 240, 240, 0.2)",
     sundayColor : "rgba(255, 220, 220, 0.2)",
     currentDateOnMousePositionColor: "rgba(44,60,80,0.7)",
     currentDateOnMousePositionBorderColor: "#FFF",

     hideResourceHeaderIfOnlyOneRes: true,

     getTaskBarInset : (model, task)=> {
          return getTaskBarInsetByCollapseState(model.isCollapsed(model.getGroupWithResource(task)));
     },

     getTaskBarInsetByCollapseState: (a) => {return getTaskBarInsetByCollapseState(a)}
}
export default config;