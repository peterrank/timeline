import React, { useEffect, useMemo, useState } from 'react';
import InstrumentedTimeline from '../../src/timeline/instrumentedtimeline';
import Resource from '../../src/data/resource';
import LCal from '../../src/calendar/lcal';
import Task from '../../src/data/task';
import TaskModel from '../../src/model/taskmodel';
import SliderHelper from '../../src/slider/sliderhelper';
import { SPEECHBUBBLE, PIN_INTERVAL } from '../../src/index';

export default {
  title: 'timeline',
  component: InstrumentedTimeline,
};

const yr = (year) => new LCal().initYMDHM(year, 6, 1, 0, 0, 'UTC', 9);

const buildData = () => {
  const resources = [];
  const tasks = [];
  let id = 1;

  // Separate resource for Cain-lineage point events (shown at top)
  const eventsRes = new Resource(1, "Cain's Descendants", '', false);
  // Single resource for all lifespan bars – stacker handles vertical layout
  const lifespansRes = new Resource(2, 'Lifespans', '', false);
  resources.push(eventsRes);
  resources.push(lifespansRes);

  const addBar = (name, startYear, endYear, color) => {
    const t = new Task(id++, yr(startYear), yr(endYear), 2, name, '', null);
    t.getDisplayData().setColor(color);
    t.getDisplayData().setShape(PIN_INTERVAL);
    tasks.push(t);
  };

  const addEvent = (name, year) => {
    const t = new Task(id++, yr(year), yr(year), 1, name, '', null);
    t.getDisplayData().setColor('#E8D000');
    t.getDisplayData().setShape(SPEECHBUBBLE);
    tasks.push(t);
  };

  // Lifespan bars using Ussher chronology (BC years as negative)
  addBar("Adam's Lifespan",      -4004, -3074, '#3399FF');
  addBar("Cain's Lifespan",      -4003, -3053, '#FFE600');
  addBar("Abel's Lifespan",      -4002, -3952, '#CC0033');
  addBar("Seth's Lifespan",      -3874, -2962, '#22BB44');
  addBar("Enosh's Lifespan",     -3769, -2864, '#9933CC');
  addBar("Kenan's Lifespan",     -3679, -2769, '#00BBCC');
  addBar("Mahalalel's Lifespan", -3609, -2714, '#1A6B3C');
  addBar("Jared's Lifespan",     -3544, -2582, '#CC5500');
  addBar("Enoch's Lifespan",     -3382, -3017, '#CC1111');
  addBar("Methuselah",           -3317, -2348, '#AA44BB');
  addBar("Lamech's Lifespan",    -3130, -2353, '#888800');
  addBar("Noah's Lifespan",      -2948, -1998, '#2244EE');

  // Cain-lineage point events (approximate dates)
  addEvent('Methushael',  -3855);
  addEvent('Lamech',      -3825);
  addEvent('Jabal',       -3792);
  addEvent('Jubal',       -3788);
  addEvent('Tubal-Cain',  -3783);

  return { resources, tasks };
};

export const _42GenesisLifespans = () => {
  const [instrumentedTimeline, setInstrumentedTimeline] = useState(null);

  const data = useMemo(() => buildData(), []);

  const model = useMemo(() => {
    const m = new TaskModel();
    m.getResourceModel().setAll(data.resources);
    m.setAll(data.tasks);
    m.barSize = 35;
    return m;
  }, [data]);

  const sliderValues = useMemo(() => SliderHelper.getSliderValues(model.getAll()), [model]);

  const displStart = useMemo(() => yr(-4200), []);
  const displEnd   = useMemo(() => yr(-1800), []);

  useEffect(() => {
    if (instrumentedTimeline) {
      instrumentedTimeline.zoomAll(true, null);
    }
  }, [instrumentedTimeline]);

  return (
    <InstrumentedTimeline
      width={window.innerWidth * 0.95}
      height={window.innerHeight * 0.9}
      paintShadows={false}
      brightBackground={false}
      showWaitOverlay={false}
      model={model}
      start={displStart}
      end={displEnd}
      timeZone="UTC"
      sliderValues={sliderValues}
      yearPositions={12}
      backgroundImage={null}
      instrumentedTimelineCallback={(it) => setInstrumentedTimeline(it)}
    />
  );
};
