const toLeafStackElement = (task, getTaskBarBoundsForLevelComputation) => {
  const tbb = getTaskBarBoundsForLevelComputation(task);
  let element = {
    id: task.id,
    start: tbb.getMinStartX(),
    end: tbb.getMaxEndX(),
    height: task.getDisplayData().getExpansionFactor(),
    userObject: task,
    type: "event"
  }

  return element;
}

export default toLeafStackElement;