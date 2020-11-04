const getTaskBarInsetByCollapseState = (isCollapsed) => {
     if(isCollapsed) {
          return 2;
     }
     return 5;
}

const cfg = {
     ARROWHEADLENGTH : 20,
     OVERLAYHEADERWIDTH : 150,
     OVERLAYHEADERHEIGHT : 70,
     OVERLAY_CHECKBOX_X : 10,
     OVERLAY_CHECKBOX_Y : 45,
     CHART_INSET : 25,

     currentDateOnMousePositionFont : "14px Roboto, sans-serif",
     resMainFont : "14px Roboto, sans-serif",
     timelineMainFont : "16px Roboto, sans-serif",
     timelineMainFontMini : "12px Roboto, sans-serif",
     timelineSubFont : "12px Roboto, sans-serif",
     resourceMainFont : "12px Roboto, sans-serif",
     resSubFont : "12px Roboto, sans-serif",
     overlayMessageFont : "16px Roboto, sans-serif",

     timelineHeaderColor : "#F7F7F7",
     saturdayColor : "rgba(255, 240, 240, 0.2)",
     sundayColor : "rgba(255, 220, 220, 0.2)",

     getTaskBarInset : (model, task)=> {
          return getTaskBarInsetByCollapseState(model.isCollapsed(model.getGroupWithResource(task)));
     },

     getTaskBarInsetByCollapseState: (a) => {return getTaskBarInsetByCollapseState(a)}
}
export default cfg;