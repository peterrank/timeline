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

     currentDateOnMousePositionFont : "bold 13px Roboto, sans-serif",
     currentDateOnMousePositionDurationFont : "13px Roboto, sans-serif",
     resMainFont : "14px Roboto, sans-serif",
     resMainFontColor: "#000",
     timelineMainFont : "500 14px Inter, Roboto, sans-serif",
     timelineMainFontColor: null,
     timelineSubFont : "300 11px Inter, Roboto, sans-serif",
     timelineSubFontColor: null,
     resourceMainFont : "12px Roboto, sans-serif",
     resSubFont : "12px Roboto, sans-serif",
     resSubFontColor: "#CCC",
     overlayMessageFont : "16px Roboto, sans-serif",
     positionDecorationFont : "Roboto, sans-serif",
     connectionFont: "Roboto, sans-serif",
     timelineHeaderColor : "#F7F7F7",
     timelineHeaderMainTickColor: null,
     timelineMainTickColor: "rgba(255,255,255,0.12)",
     timelineMainTickWidth: 1,
     timelineSubTickColor: "rgba(255,255,255,0.05)",
     resourceOverlayInlineColor: "rgba(120, 120, 120, 0.8)",
     saturdayColor : "rgba(255, 240, 240, 0.2)",
     sundayColor : "rgba(255, 220, 220, 0.2)",
     currentDateOnMousePositionColor: "rgba(12,20,35,0.88)",
     currentDateOnMousePositionBorderColor: null,
     currentDateOnMousePositionDateColor: "#FFFFFF",
     currentDateOnMousePositionDurationColor: "rgba(130,180,255,0.9)",

     hideResourceHeaderIfOnlyOneRes: true,

     getTaskBarInset : (model, task)=> {
          return getTaskBarInsetByCollapseState(model.isCollapsed(model.getGroupWithResource(task)));
     },

     getTaskBarInsetByCollapseState: (a) => {return getTaskBarInsetByCollapseState(a)}
}
export default config;