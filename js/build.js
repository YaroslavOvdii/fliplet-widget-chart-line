(function(){
  window.ui = window.ui || {}
  ui.flipletCharts = ui.flipletCharts || {};

  function init() {
    $('[data-chart-line-id]').each(function (i, el) {
      var chartId = $(this).data('chart-line-id');
      var data = Fliplet.Widget.getData(chartId);
      var $container = $(el);
      var refreshTimeout = 5000;
      var updateDateFormat = 'hh:mm:ss a';

      function resetData() {
        data.entries = [];
        data.totalEntries = 0;
      }

      function refreshData() {
        if (typeof data.dataSourceQuery !== 'object' && !data.dataSourceId) {
          data.entries = [
            {x: 1, y: 2},
            {x: 2, y: 1.5},
            {x: 3, y: 4},
            {x: 4, y: 1},
            {x: 5, y: 2},
            {x: 6, y: 2.5}
          ];
          data.xAxisTitle = 'X-axis';
          data.yAxisTitle = 'Y-axis';
          data.totalEntries = 6;
          return Promise.resolve()
        }

        return Fliplet.Hooks.run('beforeQueryChart', data.dataSourceQuery).then(function() {
          return Fliplet.DataSources.fetchWithOptions(data.dataSourceQuery)
        }).then(function(result){
          return Fliplet.Hooks.run('afterQueryChart', result).then(function() {
            resetData();
            if (result.dataSource.columns.indexOf(data.dataSourceQuery.columns.xAxis) < 0 || result.dataSource.columns.indexOf(data.dataSourceQuery.columns.yAxis) < 0) {
              return Promise.resolve();
            }
            result.dataSourceEntries.forEach(function(row) {
              var x;
              if (data.dataFormat === 'timestamp') {
                x = new Date(row[data.dataSourceQuery.columns.xAxis] || 0).getTime()
              } else {
                x = parseInt(row[data.dataSourceQuery.columns.xAxis], 10) || 0;
              }
              var y = parseInt(row[data.dataSourceQuery.columns.yAxis], 10) || 0;
              data.entries.push([x, y]);
            });
            data.entries = _.sortBy(data.entries, function(entry){
              return entry[0];
            });
            // SAVES THE TOTAL NUMBER OF ROW/ENTRIES
            data.totalEntries = data.entries.length;

            return Promise.resolve();
          }).catch(function(error){
            return Promise.reject(error);
          });
        })
      }

      function refreshChartInfo() {
        // Update total count
        $container.find('.total').html(data.totalEntries);
        // Update last updated time
        $container.find('.updatedAt').html(moment().format(updateDateFormat));
      }

      function refreshChart() {
        // Retrieve chart object
        var chart = ui.flipletCharts[chartId];
        // Update values
        chart.series[0].setData(data.entries);
        refreshChartInfo();
      }

      function getLatestData() {
        setTimeout(function(){
          refreshData().then(function(){
            refreshChart();
            if (data.autoRefresh) {
              getLatestData();
            }
          });
        }, refreshTimeout);
      }

      function drawChart() {
        var colors = [
          '#337AB7', '#5BC0DE', '#5CB85C', '#F0AD4E', '#C9302C',
          '#293954', '#2E6F82', '#3D7A3D', '#B07623', '#963732'
        ];
        colors.forEach(function eachColor (color, index) {
          if (!Fliplet.Themes) {
            return;
          }
          colors[index] = Fliplet.Themes.Current.get('chartColor'+(index+1)) || color;
        });
        var chartOpt = {
          chart: {
            type: 'line',
            zoomType: 'xy',
            renderTo: $container.find('.chart-container')[0],
            style: {
              fontFamily: (Fliplet.Themes && Fliplet.Themes.Current.get('bodyFontFamily')) || 'sans-serif'
            },
            events: {
              load: function(){
                refreshChartInfo();
                if (data.autoRefresh) {
                  getLatestData();
                }
              }
            }
          },
          colors: colors,
          title: {
            text: ''
          },
          subtitle: {
            text: ''
          },
          xAxis: {
            title: {
              text: data.xAxisTitle || data.dataSourceQuery.columns.xAxis,
              enabled: data.xAxisTitle !== ''
            },
            labels: {
              formatter: function(){
                if (data.dataFormat === 'timestamp') {
                  return moment(this.value).format('YYYY-MM-DD');
                }
                return this.value;
              }
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
          },
          yAxis: {
            title: {
              text: data.yAxisTitle || data.dataSourceQuery.columns.yAxis,
              enabled: data.yAxisTitle !== ''
            }
          },
          tooltip: {
            enabled: data.showDataValues,
            headerFormat: '',
            pointFormat: [
              '<strong>',
              (data.xAxisTitle !== ''
                ? data.xAxisTitle
                : data.dataSourceQuery.columns.xAxis),
              '</strong> ',
              (data.dataFormat === 'timestamp'
                ? '{point.x:%Y-%m-%d %H:%M:%S}'
                : '{point.x}'),
              '<br><strong>',
              (data.yAxisTitle !== ''
                ? data.yAxisTitle
                : data.dataSourceQuery.columns.yAxis),
              '</strong>: {point.y}'
            ].join('')
          },
          series: [{
            data: data.entries,
            events: {
              click: function () {
                Fliplet.Analytics.trackEvent({
                  category: 'chart',
                  action: 'data_point_interact',
                  label: 'line'
                });
              },
              legendItemClick: function () {
                Fliplet.Analytics.trackEvent({
                  category: 'chart',
                  action: 'legend_filter',
                  label: 'line'
                });
              }
            }
          }],
          legend: {
            enabled: false
          },
          credits: {
            enabled: false
          }
        };
        // Create and save chart object
        ui.flipletCharts[chartId] = new Highcharts.Chart(chartOpt);
      }

      if (Fliplet.Env.get('interact')) {
        // TinyMCE removes <style> tags, so we've used a <script> tag instead,
        // which will be appended to <body> to apply the styles
        $($(this).find('.chart-styles').detach().html()).appendTo('body');
      } else {
        $(this).find('.chart-styles').remove();
      }

      refreshData().then(drawChart).catch(function(error){
        console.error(error);
      });
    });
  }

  Fliplet().then(function(){
    var debounceLoad = _.debounce(init, 500, { leading: true });
    Fliplet.Studio.onEvent(function (event) {
      if (event.detail.event === 'reload-widget-instance') {
        debounceLoad();
      }
    });

    init();
  });
})();
