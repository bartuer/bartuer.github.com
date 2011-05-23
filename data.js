var progress_bar_data = {
  days: {
    '2011-02-27 Sun': [{
      name: 'hack this json',
      schedule: '2011-02-22 Tue 02:15',
      effort: 1.0,
      beg: '2011-02-22 Tue 10:31',
      end: '2011-02-22 Tue 15:21',
      value_v: 0.13,
      beg_v: 0.4375,
      end_v: 0.6375
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
    }],
    '2011-02-28 Mon': [{
      name: 'org files parse',
      schedule: '2011-02-20 Sun 03:30',
      effort: 3.0,
      beg: null,
      end: null
    }]
  },
  weeks: {
    '8': {
      days: [ '2011-02-28 Mon', '2011-03-01 Tue', '2011-03-02 Wed', '2011-03-03 Thu', '2011-03-04 Fri', '2011-03-05 Sat', '2011-03-06 Sun'],
      values_v: [0.13, 0.8, null, 0.75, null, 1.0, null],
      tasks_v: [3, 1, 2, 5, 4, 3, 0]
    },
    '9': {
      days: ['2011-03-07 Mon', '2011-03-08 Tue', '2011-03-09 Wed', '2011-03-10 Thu', '2011-03-11 Fir', '2011-03-08 Sat', '2011-03-12 Sun'],
      values_v: [0.2, 0.3, 0.72, null, null, 1.0, null],
      tasks_v : [2, 2, 4, 5, 3, 1, 2]
    }
  },
  months: {
    'Feb': {
      weeks: ['8'],
      tasks_v: [18],
      values_v: [0.06]
    },
    'March': {
      weeks: ['9', '10', '11', '12'],
      tasks_v: [21, 13, 17, 19],
      values_v: [0.13, 0.17, 0.23, 0.29]
    },
    'Apr': {
      weeks: ['13', '14', '15', '16', '17'],
      tasks_v: [5, 12, 11, 0, 0],
      values_v: null
    }
  }
};