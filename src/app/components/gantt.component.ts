import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TaskService } from '../services/task.service';
import { LinkService } from '../services/link.service';
import { Task } from '../models/task';
import { Link } from '../models/link';

import 'dhtmlx-gantt';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'gantt',
  styleUrls: ['./gantt.component.css'],
  providers: [TaskService, LinkService],
  template: `<div #gantt_here class='gantt-chart'></div>`,
})
export class GanttComponent implements OnInit {
  @ViewChild('gantt_here') ganttContainer: ElementRef;

  constructor(private taskService: TaskService, private linkService: LinkService) { }

  ngOnInit() {

    gantt.config.date_format = "%d-%m-%Y %H:%i";
    gantt.config.date_grid = "%H:%i";
    gantt.config.min_column_width = 20;
    gantt.config.duration_unit = "minute";
    gantt.config.duration_step = 1;
    gantt.config.scale_height = 75;

    gantt.config.scales = [
      { unit: "hour", step: 1, format: "%g %a" },
      { unit: "day", step: 1, format: "%j %F, %l" },
      { unit: "minute", step: 5, format: "%i" }
    ];

    function formatEndDate(date, template) {
      // get 23:59:59 instead of 00:00:00 for the end date
      return template(new Date(date.valueOf() - 1));
    }

    gantt.config.columns = [
      { name: "text", label: "Task name", tree: true, min_width: 150, max_width: 400, resize: true },
      { name: "start_date", label: "Start", align: "center", width: 100, resize: true },
      {
        name: "end_date", label: "End", align: "center", width: 100,
        template: function (task) {
          return formatEndDate(task.end_date, gantt.templates.date_grid);
        }, resize: true
      },
      { name: "duration", label: "Duration", align: "center", width: 120 },
      { name: "add", label: "" }
      // more columns
    ];

    gantt.init(this.ganttContainer.nativeElement);
    var formatFunc = gantt.date.date_to_str("%Y-%m-%d %H:%i");
    gantt.templates.tooltip_text = function (start, end, task) {
      return "<b>Task:</b> " + task.text + "<br/><b>Start date:</b> " +
        formatFunc(task.start_date) + "<br/><b>End date:</b> " +
        formatEndDate(task.end_date, formatFunc);
    };

    const dp = gantt.createDataProcessor({
      task: {
        update: (data: Task) => this.taskService.update(data),
        create: (data: Task) => this.taskService.insert(data),
        delete: (id) => this.taskService.remove(id)
      },
      link: {
        update: (data: Link) => this.linkService.update(data),
        create: (data: Link) => this.linkService.insert(data),
        delete: (id) => this.linkService.remove(id)
      }
    });

    Promise.all([this.taskService.get(), this.linkService.get()])
      .then(([data, links]) => {
        gantt.parse({ data, links });
      });
  }
}
