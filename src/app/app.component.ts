import { Component, NgModule, ViewChild } from "@angular/core";
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

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  @ViewChild(CdkDropListGroup) listGroup: CdkDropListGroup<CdkDropList>;
  @ViewChild(CdkDropList) placeholder: CdkDropList;

/* Timeline array construction
- timeLineSpanMinutes = last Activity endtime (22:30) - first Activity starttime (12:00) * 60 =>  10 ½ => 630
- 630 / timelineRangeMinutes(30) = 21
- 630 / timelineRangeMinutes(15) = 42

( shortestActivty decides min for timelineRangeMinutes )

*/

private timelineRangeMinutes = 30;

  public timeline: Array<any> = [
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

/* Activitys array rules

- 'Short break' not allowed before or after another 'Short break' in array.
- 'Short break' not allowed at first or last index in array.
- if 'Activty' is movable it's height should be nActivitySlices * activtyHeight

nActivitySlices = ActivityLengthInMinutes / timelineRangeMinutes

- 60 / timelineRangeMinutes(30) = 2
- 30 / timelineRangeMinutes(30) = 1
- 15 / timelineRangeMinutes(30) = 0.5 ( RULE: timelineRangeMinutes can't be > ActivityLengthInMinutes )
( shortestActivty decides min for timelineRangeMinutes )

- 60 / timelineRangeMinutes(15) = 4
- 30 / timelineRangeMinutes(15) = 2
- 15 / timelineRangeMinutes(15) = 1

- Functions

getActivityTimeFromArray(index)

isActivityMoveAllowed(indexFrom, indexTo)

mapActivyToTimeline ?

*/

private activtyHeightPx = 20;

  public activitys: Array<any> = [
    { title: 'Administration', height:  this.activtyHeightPx , movable: false, color: '192,192,255', starttime: '12:00', endtime: '12:30' },
    { title: 'Administration', height:  this.activtyHeightPx , movable: false, color: '192,192,255', starttime: '12:30', endtime: '13:00' },
    { title: 'Administration', height:  this.activtyHeightPx , movable: false, color: '192,192,255', starttime: '13:00', endtime: '13:30' },
    { title: 'Administration', height:  this.activtyHeightPx , movable: false, color: '192,192,255', starttime: '13:30', endtime: '14:00' },
    { title: 'Short break', height:  this.activtyHeightPx , movable: true, color: '255,0,0', starttime: '14:00', endtime: '14:30' },
    { title: 'Phone', height:  this.activtyHeightPx , movable: false, color: '128,255,128', starttime: '14:30', endtime: '15:00' },
    { title: 'Phone', height:  this.activtyHeightPx , movable: false, color: '128,255,128', starttime: '15:00', endtime: '15:30' },
    { title: 'Phone', height:  this.activtyHeightPx , movable: false, color: '128,255,128', starttime: '15:30', endtime: '16:00' },
    { title: 'Lunch', height:  this.activtyHeightPx*2 , movable: true, color: '255,255,0', starttime: '16:00', endtime: '17:00' },
    { title: 'Phone', height:  this.activtyHeightPx , movable: false, color: '128,255,128', starttime: '17:00', endtime: '17:30' },
    { title: 'Phone', height:  this.activtyHeightPx , movable: false, color: '128,255,128', starttime: '17:30', endtime: '18:00' },
    { title: 'Phone', height:  this.activtyHeightPx , movable: false, color: '128,255,128', starttime: '18:00', endtime: '18:30' },
    { title: 'Phone', height:  this.activtyHeightPx , movable: false, color: '128,255,128', starttime: '18:30', endtime: '19:00' },
    { title: 'Short break', height:  this.activtyHeightPx , movable: true, color: '255,0,0', starttime: '19:00', endtime: '19:30' },
    { title: 'Phone', height:  this.activtyHeightPx , movable: false, color: '128,255,128', starttime: '19:30', endtime: '20:00' },
    { title: 'Phone', height:  this.activtyHeightPx , movable: false, color: '128,255,128', starttime: '20:00', endtime: '20:30' },
    { title: 'Phone', height:  this.activtyHeightPx , movable: false, color: '128,255,128', starttime: '20:30', endtime: '21:00' },
    { title: 'Phone', height:  this.activtyHeightPx , movable: false, color: '128,255,128', starttime: '21:00', endtime: '21:30' },
    { title: 'Phone', height:  this.activtyHeightPx , movable: false, color: '128,255,128', starttime: '21:30', endtime: '22:00' },
    { title: 'Phone', height:  this.activtyHeightPx , movable: false, color: '128,255,128', starttime: '22:00', endtime: '22:30' }
  ];


  public target: CdkDropList = null;
  public targetIndex: number;
  public source: CdkDropList = null;
  public sourceIndex: number;
  public dragIndex: number;
  public activeContainer;

  private timelineStart = this.activitys[0].starttime;
  private timelineEnd = this.activitys[this.activitys.length-1].endtime;

  constructor(private viewportRuler: ViewportRuler) {}

  ngAfterViewInit() {
    let phElement = this.placeholder.element.nativeElement;

    phElement.style.display = "none";
    phElement.parentElement.removeChild(phElement);

    console.log('timelineStart ' + this.timelineStart);
    console.log('timelineEnd ' + this.timelineEnd);
  }

  dragMoved(e: CdkDragMove) {
    let point = this.getPointerPositionOnPage(e.event);

    this.listGroup._items.forEach(dropList => {
      if (__isInsideDropListClientRect(dropList, point.x, point.y)) {
        this.activeContainer = dropList;
        return;
      }
    });
    console.log('dragMoved ');
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
      this.updateActivitysTimes(this.sourceIndex, this.targetIndex)
      moveItemInArray(this.activitys, this.sourceIndex, this.targetIndex);
      console.log('dropListDropped, from ' + this.sourceIndex + ' to '+ this.targetIndex);
    }
  }

  updateActivitysTimes(sourceIndex,targetIndex){
      const sourceStart = this.activitys[this.sourceIndex].starttime;
      const sourceEnd = this.activitys[this.sourceIndex].endtime;
      this.activitys[this.sourceIndex].starttime = this.activitys[this.targetIndex].starttime + 'ss';
      this.activitys[this.sourceIndex].endtime = this.activitys[this.targetIndex].endtime + 'es';
      this.activitys[this.targetIndex].starttime = sourceStart + 'st';
      this.activitys[this.targetIndex].endtime = sourceEnd + 'et';
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
