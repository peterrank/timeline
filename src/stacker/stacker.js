/**
 * Stapelt Elemente mit start, end, height aufeinander
 * Hängt das Level an das Element
 * @param elements
 */
const stack = (elements) => {
    // Sortieren nach dem frühesten Start
    sortByStart(elements);

   // Alles durchlaufen und die Levels besetzen
   let levelOccupiedUntil = [];

  elements.start = Number.MAX_SAFE_INTEGER;
  elements.end = Number.MIN_SAFE_INTEGER;
  elements.height = 0;

   for(const el of elements) {
     const levelInfo = occupyLevels(el.start, el.end, el.height, levelOccupiedUntil);
     levelOccupiedUntil = levelInfo.levelOccupiedUntil;
     el.level = levelInfo.level;

     elements.height = Math.max(elements.height, levelInfo.level + el.height);
     elements.start = Math.min(elements.start, el.start);
     elements.end = Math.max(elements.end, el.end);
   }

   return elements;
}


/**
 * Besetzt levelOccupiedUntil und liefert das Level zurück, ab dem besetzt wurde
 * @param minStart
 * @param maxEnd
 * @param height
 * @param levelOccupiedUntil ist ein Array, dessen Index der Level und dessen Wert der Zeitpunkt ist, bis zu dem das Level besetzt ist
 * @returns level und levelOccupiedUntil
 */

const occupyLevels = (minStart, maxEnd, height, levelOccupiedUntil) => {
  levelOccupiedUntil = Object.values(levelOccupiedUntil);
  //Can insert?
  let canInsert = false;
  for (let level = 0; level < levelOccupiedUntil.length; level++) {
    canInsert = true;
    for(let levelOffset=0; levelOffset < height; levelOffset++) {
      let index = level + levelOffset;
      if(index > levelOccupiedUntil.length-1) {
        break;
      }
      let occupiedUntil = levelOccupiedUntil[index];
      if (occupiedUntil > minStart) {
        canInsert = false;
        break;
      }
    }
    if (canInsert) {
      for(let levelOffset=0; levelOffset < height; levelOffset++) {
        let index = level + levelOffset;
        if(index > levelOccupiedUntil.length-1) {
          levelOccupiedUntil.push(maxEnd);
        } else {
          levelOccupiedUntil[index] = maxEnd;
        }
      }
      return {level, levelOccupiedUntil};
    }
  }
  if(!canInsert) {
    for(let expansionOffset=0; expansionOffset < height; expansionOffset++) {
      levelOccupiedUntil.push(maxEnd);
    }
  }

  return {level: levelOccupiedUntil.length - height, levelOccupiedUntil};
}

/*
* Sortierung ist aufsteigend nach Startzeit
*/
const sortByStart = (elements) => {
  elements.sort((i1, i2) => {
    let retVal = i1.start - i2.start;
    if (retVal === 0) {
      retVal = (""+i1.id).localeCompare(""+i2.id);
    }
    return retVal;
  });
}


export default stack;