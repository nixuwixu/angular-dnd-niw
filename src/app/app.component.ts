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
import { Activity, TimelineItem, MovablePeriod } from './models'

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit{

  @ViewChild(CdkDropListGroup) listGroup: CdkDropListGroup<CdkDropList>;
  @ViewChild(CdkDropList) placeholder: CdkDropList;

  public activtyHeightPx = 1;
  public timelineInterval: number = 1;

  public activitys: Array<Activity> = [];
  public timeline: Array<TimelineItem> = [];
  public movablePeriods: Array<MovablePeriod> = [];
  public timelineStart;
  public timelineSteps = ['00','30'];

  public target: CdkDropList = null;
  public targetIndex: number;
  public source: CdkDropList = null;
  public sourceIndex: number;
  public dragIndex: number;
  public activeContainer;

  constructor(private viewportRuler: ViewportRuler, private jsonService: JsonService) {}

  public ngOnInit(): void {

    this.jsonService.getActivityMovablePeriods()
      .subscribe((movablePeriods: any): void => {
        this.generateMovablePeriodsArray(movablePeriods);
      });
  }

  ngAfterViewInit() {
    let phElement = this.placeholder.element.nativeElement;
    phElement.style.display = "none";
    phElement.parentElement.removeChild(phElement);
  }

  generateMovablePeriodsArray(movablePeriods) {
    movablePeriods.forEach((movablePeriod) => {
      let movablePeriod2 = new MovablePeriod(
        moment(movablePeriod.StartTime).format('HH:mm'),
        moment(movablePeriod.EndTime).format('HH:mm'),
        !movablePeriod.Movable
      )
      this.movablePeriods.push(movablePeriod2);
    });

    this.jsonService.getSchedule()
      .subscribe((data: any): void => {
        this.generateActivitysArray(data);
      });
  }

  generateActivitysArray(data) {

    data.Schedule.Periods.forEach((period) => {
      let activityLength = moment(period.EndTime).diff(moment(period.StartTime), 'minutes');
      let nActivitySlices = activityLength / this.timelineInterval;

      if(period.IsMovable){

        let activity = new Activity(
        period.Title,
        this.activtyHeightPx * nActivitySlices,
        period.IsMovable,
        period.Color,
        moment(period.StartTime).format('HH:mm'),
        moment(period.EndTime).format('HH:mm'),
        this.timelineInterval * nActivitySlices,
        period.IsLunch,
        period.IsShortBreak,
        false
        )
        this.activitys.push(activity);
        
      } else {

        for(var n = 0; n < nActivitySlices; n++){

          let periodStart = moment(period.StartTime)
            .add(this.timelineInterval * n,'minutes')
            .format('HH:mm');

          let periodEnd = moment(period.StartTime)
            .add(this.timelineInterval * n + this.timelineInterval,'minutes')
            .format('HH:mm');

          let movablePeriod = this.movablePeriods.filter(movablePeriod => movablePeriod.starttime === periodStart && movablePeriod.endtime === periodEnd);


          let activity = new Activity(
          period.Title,
          this.activtyHeightPx,
          period.IsMovable,
          period.Color,
          periodStart,
          periodEnd,
          this.timelineInterval,
          period.IsLunch,
          period.IsShortBreak,
          movablePeriod[0].movable
          )
          this.activitys.push(activity);
        }
      }
    
    });

    this.timelineStart = moment(this.activitys[0].starttime,'HH:mm').clone();
    this.generateTimelineArray();
  }

  generateTimelineArray() {
    let timelineMinutes = moment(this.activitys[this.activitys.length-1].endtime,'HH:mm')
    .diff(this.timelineStart, 'minutes');
    let nTimelineItems = timelineMinutes / this.timelineInterval;

    for(var n = 0; n <= nTimelineItems; n++){
      let timelineTime = moment(this.timelineStart).add(this.timelineInterval * n ,'minutes')
      .format('HH:mm')
      let timelineItem = new TimelineItem(
        timelineTime,
        this.timelineSteps.indexOf(timelineTime.slice(3,5)) != -1,
        false
      )
      this.timeline.push(timelineItem);
    }
  }

  dragMoved(e: CdkDragMove) {
    let point = this.getPointerPositionOnPage(e.event);
    this.listGroup._items.forEach(dropList => {
      if (__isInsideDropListClientRect(dropList, point.x, point.y)) {
        this.activeContainer = dropList;
        this.updateActveTimeline(this.targetIndex,this.sourceIndex);
        return;
      }
    });
  }

  updateActveTimeline(targetIndex,sourceIndex){

    if(targetIndex) {
      let activityStart = this.activitys[targetIndex].starttime;
      let activityEnd = moment(activityStart,'HH:mm')
            .add(this.activitys[sourceIndex].activityLength,'minute').format('HH:mm');

      this.hideTimeline();

      for(var index = 0; index < this.timeline.length; index++){

        if(this.timeline[index] && this.timeline[index].time == activityStart){
          this.timeline[index].isActive = true;
          this.timeline[index].isVisible = true;
        }

        if(this.timeline[index] && this.timeline[index].time == activityEnd){
          this.timeline[index].isActive = true;
          this.timeline[index].isVisible = true;
        }

      }

    }
  }

  hideTimeline(){
    for(let index in this.timeline)
      this.timeline[index].isVisible = false;
  }

  showTimeline(){
    for(let index in this.timeline){
      this.timeline[index].isActive = false;
      this.timeline[index].isVisible = this.timelineSteps
      .indexOf(this.timeline[index].time.slice(3,5)) != -1
    }
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

    if (this.sourceIndex != this.targetIndex && this.isActivityMoveAllowed(this.sourceIndex, this.targetIndex) ){

      moveItemInArray(this.activitys, this.sourceIndex, this.targetIndex);
      this.updateTime();

    }
  }

  isActivityMoveAllowed(sourceIndex, targetIndex){

    // is locked
    if(this.activitys[targetIndex].isLocked) {
        console.log('Move not allowed, Target is locked');
        return false;
    }

    // Lunch rules
    if(this.activitys[sourceIndex].isLunch) {
      if(targetIndex==0 ) {
        console.log('Move not allowed, Lunch cant be at day start');
        return false;
      }
      if(targetIndex==this.activitys.length-1) {
        console.log('Move not allowed, Lunch cant be at day end');
                return false;
      }
      return true;
    }

    // Short break rules
    if(this.activitys[sourceIndex].isShortBreak) {
      if(targetIndex==0 ) {
        console.log('Move not allowed, Short break cant be at day start');
        return false;
      }
      if(targetIndex==this.activitys.length-1) {
        console.log('Move not allowed, Short break cant be at day end');
                return false;
      }
      return true;
    }

    return true;
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
    this.showTimeline();
  }

  getActivityTimeDebug(index){
    if(index == 0 || this.activitys[index].title != this.activitys[index-1].title){
      return this.activitys[index].title + ' '
       + this.activitys[index].starttime + ' - ' 
       + this.activitys[index].endtime;
    }
    return this.activitys[index].starttime + ' - ' + this.activitys[index].endtime;
  }

  getActivityTime(index){
    if(index == 0 || this.activitys[index].title != this.activitys[index-1].title){
      let endTime;
      for(var n = index; n < this.activitys.length; n++){
        if(this.activitys[n].title != this.activitys[index].title){
          endTime = this.activitys[n-1].endtime;
          break
        } else {
          endTime = this.activitys[this.activitys.length-1].endtime;
        }
      }

      return this.activitys[index].title + ' '
       + this.activitys[index].starttime + ' - ' 
       + endTime;
    }
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
