export class Activity {
  title: string;
  height: number;
  movable: boolean;
  color: string;
  starttime: string;
  endtime: string;
  activityLength: number;

  constructor(
    title: string,
    height: number,
    movable: boolean,
    color: string,
    starttime: string,
    endtime: string,
    activityLength: number) {

      this.title = title;
      this.height = height;
      this.movable = movable;
      this.color = color;
      this.starttime = starttime;
      this.endtime = endtime;
      this.activityLength = activityLength;
      
    }
}