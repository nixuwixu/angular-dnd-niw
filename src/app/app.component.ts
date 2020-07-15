import { Component, NgModule, ViewChild, OnInit } from "@angular/core";
import {
  CdkDrag,
  CdkDragStart,
  CdkDropList,
  CdkDropListGroup,
  CdkDragMove,
  CdkDragEnter,
  moveItemInArray
} from "@angular/cdk/drag-drop";
import { ViewportRuler } from "@angular/cdk/overlay";
import { JsonService } from './json-service';
import moment from 'moment';
import { Activity } from './models'

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit{

  @ViewChild(CdkDropListGroup) listGroup: CdkDropListGroup<CdkDropList>;
  @ViewChild(CdkDropList) placeholder: CdkDropList;

  public activtyHeightPx = 20;
  public timelineInterval: number = 15;

  public activitys: Array<Activity> = [];
  public timeline: Array<any> = this.generateTimelineArray2();
  public timelineStart ;

  public target: CdkDropList = null;
  public targetIndex: number;
  public source: CdkDropList = null;
  public sourceIndex: number;
  public dragIndex: number;
  public activeContainer;

  constructor(private viewportRuler: ViewportRuler, private jsonService: JsonService) {}

  public ngOnInit(): void {
    this.jsonService.getSchedule()
      .subscribe((data: any): void => {
        this.generateActivitysArray(data);
      });
  }

  ngAfterViewInit() {
    let phElement = this.placeholder.element.nativeElement;
    phElement.style.display = "none";
    phElement.parentElement.removeChild(phElement);
  }

/* Activitys array rules

- 'Short break' not allowed before or after another 'Short break' in array.
- 'Short break' not allowed at first or last index in array.
- if 'Activty' is movable it's height should be nActivitySlices * activtyHeight

nActivitySlices = ActivityLengthInMinutes / timelineInterval

- 60 / timelineInterval(30) = 2
- 30 / timelineInterval(30) = 1
- 15 / timelineInterval(30) = 0.5 ( RULE: timelineInterval can't be > ActivityLengthInMinutes )
( shortestActivty decides min for timelineInterval )

- 60 / timelineInterval(15) = 4
- 30 / timelineInterval(15) = 2
- 15 / timelineInterval(15) = 1

- Functions

getActivityTimeFromArray(index)

isActivityMoveAllowed(indexFrom, indexTo)

mapActivyToTimeline ?

*/
  generateActivitysArray(data) {

    data.Schedule.Periods.forEach((period) => {
      let activityLength = moment(period.EndTime).diff(moment(period.StartTime), 'minutes');
      let nActivitySlices = activityLength / this.timelineInterval;
      console.log('diffMin ' + nActivitySlices);

      if(period.IsMovable){

        let activity = new Activity(
        period.Title,
        this.activtyHeightPx * nActivitySlices,
        period.IsMovable,
        period.Color,
        moment(period.StartTime).format('HH:mm'),
        moment(period.EndTime).format('HH:mm'),
        this.timelineInterval * nActivitySlices
        )
        this.activitys.push(activity);
        
      } else {

        for(var n = 0; n < nActivitySlices; n++){
          let activity = new Activity(
          period.Title,
          this.activtyHeightPx,
          period.IsMovable,
          period.Color,
          moment(period.StartTime)
          .add(this.timelineInterval * n,'minutes')
          .format('HH:mm'),
          moment(period.StartTime)
          .add(this.timelineInterval * n + this.timelineInterval,'minutes')
          .format('HH:mm'),
          this.timelineInterval
          )
          this.activitys.push(activity);
        }
      }
    
    });

    this.timelineStart = moment(this.activitys[0].starttime,'HH:mm').clone();
  }

/* Timeline array construction
- timeLineSpanMinutes = last Activity endtime (22:30) - first Activity starttime (12:00) * 60 =>  10 ½ => 630
- 630 / timelineInterval(30) = 21
- 630 / timelineInterval(15) = 42

( shortestActivty decides min for timelineInterval )

*/
  generateTimelineArray() {
    for(var time = 0; time < this.activitys.length; time++){
      let timelineItem = new TimelineItem{
        this.timelineStart,
        true
      }

    }
  }

  generateTimelineArray2() {
    return [
    { title: '12:00' },
    { title: '12:30' },
    { title: '13:00' },
    { title: '13:30' },
    { title: '14:00' },
    { title: '14:30' },
    { title: '15:00' },
    { title: '15:30' },
    { title: '16:00' },
    { title: '16:30' },
    { title: '17:00' },
    { title: '17:30' },
    { title: '18:00' },
    { title: '18:30' },
    { title: '19:00' },
    { title: '19:30' },
    { title: '20:00' },
    { title: '20:30' },
    { title: '21:00' },
    { title: '21:30' },
    { title: '22:00' },
    { title: '22:30' }
  ];

  }

  dragMoved(e: CdkDragMove) {
    let point = this.getPointerPositionOnPage(e.event);

    this.listGroup._items.forEach(dropList => {
      if (__isInsideDropListClientRect(dropList, point.x, point.y)) {
        this.activeContainer = dropList;
        return;
      }
    });
  }

  dropListDropped() {
    if (!this.target) return;

    let phElement = this.placeholder.element.nativeElement;
    let parent = phElement.parentElement;

    phElement.style.display = "none";

    parent.removeChild(phElement);
    parent.appendChild(phElement);
    parent.insertBefore(
      this.source.element.nativeElement,
      parent.children[this.sourceIndex]
    );

    this.target = null;
    this.source = null;

    if (this.sourceIndex != this.targetIndex){
      moveItemInArray(this.activitys, this.sourceIndex, this.targetIndex);
      this.updateTime();
    }
  }

  updateTime(){
    for(var index = 0; index < this.activitys.length; index++){
      if (index == 0) {
        this.activitys[index].starttime = this.timelineStart.format('HH:mm');
      } else {
        this.activitys[index].starttime = this.activitys[index-1].endtime 
      }
      this.activitys[index].endtime = moment(this.activitys[index].starttime,'HH:mm')
      .add(this.activitys[index].activityLength,'minute').format('HH:mm');
    }
  }

  getActivityTime(index){
    if(index == 0 || this.activitys[index].title != this.activitys[index-1].title){
      return this.activitys[index].title + ' '
       + this.activitys[index].starttime + ' - ' 
       + this.activitys[index].endtime;
    }
    return this.activitys[index].starttime + ' - ' + this.activitys[index].endtime;
  }

  dropListEnterPredicate = (drag: CdkDrag, drop: CdkDropList) => {
    if (drop == this.placeholder) return true;

    if (drop != this.activeContainer) return false;

    let phElement = this.placeholder.element.nativeElement;
    let sourceElement = drag.dropContainer.element.nativeElement;
    let dropElement = drop.element.nativeElement;

    let dragIndex = __indexOf(
      dropElement.parentElement.children,
      this.source ? phElement : sourceElement
    );
    let dropIndex = __indexOf(dropElement.parentElement.children, dropElement);

    if (!this.source) {
      this.sourceIndex = dragIndex;
      this.source = drag.dropContainer;

      phElement.style.width = sourceElement.clientWidth + "px";
      phElement.style.height = sourceElement.clientHeight + "px";

      sourceElement.parentElement.removeChild(sourceElement);
    }

    this.targetIndex = dropIndex;
    this.target = drop;

    phElement.style.display = "";
    dropElement.parentElement.insertBefore(
      phElement,
      dropIndex > dragIndex ? dropElement.nextSibling : dropElement
    );

    this.placeholder.enter(
      drag,
      drag.element.nativeElement.offsetLeft,
      drag.element.nativeElement.offsetTop
    );
    return false;
  };

  /** Determines the point of the page that was touched by the user. */
  getPointerPositionOnPage(event: MouseEvent | TouchEvent) {
    // `touches` will be empty for start/end events so we have to fall back to `changedTouches`.
    const point = __isTouchEvent(event)
      ? event.touches[0] || event.changedTouches[0]
      : event;
    const scrollPosition = this.viewportRuler.getViewportScrollPosition();

    return {
      x: point.pageX - scrollPosition.left,
      y: point.pageY - scrollPosition.top
    };
  }
}

function __indexOf(collection, node) {
  return Array.prototype.indexOf.call(collection, node);
}

/** Determines whether an event is a touch event. */
function __isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  return event.type.startsWith("touch");
}

function __isInsideDropListClientRect(
  dropList: CdkDropList,
  x: number,
  y: number
) {
  const {
    top,
    bottom,
    left,
    right
  } = dropList.element.nativeElement.getBoundingClientRect();
  return y >= top && y <= bottom && x >= left && x <= right;
}
