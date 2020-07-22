export class Activity {

  title: string;
  height: number;
  movable: boolean;
  color: string;
  starttime: string;
  endtime: string;
  activityLength: number;
  isLunch: boolean;
  isShortBreak: boolean;
  isLocked: boolean;

  constructor(
    title: string,
    height: number,
    movable: boolean,
    color: string,
    starttime: string,
    endtime: string,
    activityLength: number,
    isLunch: boolean,
    isShortBreak: boolean,
    isLocked: boolean
  ) {
      this.title = title;
      this.height = height;
      this.movable = movable;
      this.color = color;
      this.starttime = starttime;
      this.endtime = endtime;
      this.activityLength = activityLength;
      this.isLunch = isLunch;
      this.isShortBreak = isShortBreak;
      this.isLocked = isLocked;
    }
}

export class TimelineItem {

  time: string;
  isVisible: boolean;
  isActive: boolean;

  constructor(
    time: string,
    isVisible: boolean,
    isActive: boolean
    ) {
      this.time = time;
      this.isVisible = isVisible;
      this.isActive = isActive;
    }
}

export class MovablePeriod {

  starttime: string;
  endtime: string;
  movable: boolean;

  constructor(
  starttime: string,
  endtime: string,
  movable: boolean
    ) {
      this.starttime = starttime;
      this.endtime = endtime;
      this.movable = movable;
    }
}
