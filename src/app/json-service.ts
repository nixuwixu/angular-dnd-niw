import { Injectable } from '@angular/core';
import {HttpClient } from '@angular/common/http';

@Injectable()
export class JsonService {
  constructor(private http: HttpClient) { }

  getSchedule() {
    return this.http.get('../assets/GetSchedule.json');
  }

  getActivityMovablePeriods() {
    return this.http.get('../assets/GetActivityMovablePeriods.json');
  }

}
