var progress_bar_data = {
  days: {
    '2011-02-27 Sun': [
      {
        name: 'hack this json',
        schedule: '2011-02-22 Tue 02:15',
        effort: 1.0,
        beg: '2011-02-22 Tue 10:31',
        end: '2011-02-22 Tue 15:21',
        value: 0.13,
        begv: 0.4375,
        endv: 0.6375
      },
      {
        name: 'draw this json',
        schedule: '2011-02-22 Tue 02:15',
        effort: 2,
        beg: '2011-02-23 Tue 10:31',
        end: null
      },
      {
        name: 'generate this json from lisp',
        schedule: '2011-02-19 Sat 15:50',
        effort: 1.5,
        beg: null,
        end: null
      }
    ],
    '2011-02-28 Mon': [
      {
        name: 'org files parse',
        schedule: '2011-02-20 Sun 03:30',
        effort: 3.0,
        beg: null,
        end: null
      }
    ]
  },
  weeks: [{
    days: ['2011-02-27 Sun', '2011-02-28 Mon', '2011-03-01 Tue', '2011-03-02 Wen', '2011-03-03 Thu', '2011-03-04 Fri', '2011-03-05 Sat'],
    values: [0.7, 0.8, null, 0.75, null, 1.0],
    tasks: [3,1,2,5,4,3]
  }],
  months: [{
    name: 'Feb',
    weeks: [1],
    tasks: [18]
  },
  {
    name: 'March',
    weeks: [2, 3, 4, 5],
    tasks: [21, 13, 17, 19]
  },
  {
    name: 'Apr',
    weeks: [6, 7, 8, 9],
    tasks: [5, 12, 11, 0]
  },
  {
    name: 'May',
    weeks: [10, 11],
    tasks: [6, 8]
  }]
};