import i18n_res from "./i18n_res.js";
import i18n_res_en from "./i18n_res_en.js";
import i18n_res_ua from "./i18n_res_ua.js";

const i18n = (res, languageCode="") => {
  let retVal;
  switch(languageCode) {
    case "en": retVal = i18n_res_en[res]; break;
    case "ua": retVal = i18n_res_ua[res]; break;
    default: retVal = i18n_res[res];
  }
  if(!retVal) {
    retVal = i18n_res[res];
  }
  /*if(retVal && retVal.includes("v. Chr")) {
    debugger;
  }*/
  return retVal;
}

export default i18n;
