requirejs.config({
  //By default load any module IDs from js/lib
  baseUrl: 'static/js/lib',

  //except, if the module ID starts with "app",
  //load it from the js/app directory. paths
  //config is relative to the baseUrl, and
  //never includes a ".js" extension since
  //the paths config could be for a directory.
  paths: {
    summary: '../summary'
  },

  shim: {
    'backbone': {
      //These script dependencies should be loaded before loading
      //backbone.js
      deps: ['underscore', 'jquery'],
      //Once loaded, use the global 'Backbone' as the
      //module value.
      exports: 'Backbone'
    },
    'underscore': {
      exports: '_'
    },
    'jquery': {
      exports: '$'
    },
    'handlebars': {
      exports: 'Handlebars'
    }
  }
});

// Start the main app logic.
requirejs([
    'jquery', 'summary/where', 'summary/whereview', 
    'summary/cstat', 'summary/cstatsview', 
    'summary/query', 'summary/queryview',
    'summary/scorpionquery', 'summary/scorpionview',
    'summary/scorpionresults', 'summary/scorpionresultsview'],
function   (
  $, Where, WhereView, 
  CStat, CStatsView, Query, QueryView, 
  ScorpionQuery, ScorpionQueryView, ScorpionResults, ScorpionResultsView) {

  $("#fm").on("submit", function() {
    var params = {
      db: $("#db").val(),
      table: $("#table").val(),
      nbuckets: $("#nbuckets").val()
    }

    $.post('/json/lookup/', params, function(resp){
      var data = resp.data;
      var rows = $("#facets").empty();
      _.each(data, function(tup){
        var cs = new CStat(tup);
        where.add(cs);
      })

    }, 'json')
    return false;

  });


  var q = new Query();
  var qv = new QueryView({ model: q })
  $("#right").prepend(qv.render().$el);


  var where = new Where;
  var whereview = new WhereView({collection: where, el: $("#where")});
  var csv = new CStatsView({collection: where, el: $("#facets")});
  q.on('change:db change:table', function() {
    where.reset()
    where.fetch({
      data: {
        db: q.get('db'),
        table: q.get('table'),
        nbuckets: 500
      },
      reset: true
    });
  })
  where.on('change:selection', function() {
    q.set('where', where.toSQL());
  });



  var srs = new ScorpionResults()
  var srv = new ScorpionResultsView({
    collection: srs, 
    where: where, 
    query: q
  });
  var sq = new ScorpionQuery({query: q, results: srs});
  var sqv = new ScorpionQueryView({model: sq});
  $("#scorpion-container").append(srv.render().el);
  $("body").append(sqv.render().$el.hide());

  qv.on('change:selection', function(selection) {
    sq.set('selection', selection);
  })




  var intelq = {
    x: 'hr',
    ys: [
      {col: 'temp', expr: "avg(temp)", alias: 'avg'},
      {col: 'temp', expr: "stddev(temp)", alias: 'std'}
    ],
    schema: {
      hr: 'timestamp',
      temp: 'num'
    },
    where: '',
    table: 'readings' ,
    db: 'intel'
  };

  btq = {
    x: 'week_start_date',
    ys: [ { col: 'job_count', expr: 'sum(job_count)'} ],
    schema: {
      week_start_date: 'timestamp',
      job_count: 'num'
    },
    table: 'sample',
    db: 'bt'
  };

  q.set(intelq);

  $("#q-load-bt").click(function() { 
    q.set(btq);
  });
  $("#q-load-intel").click(function() { 
    q.set(intelq);
  });




  window.q = q;
  window.qv = qv;
  window.where = where;



});