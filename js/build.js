window.ui = window.ui || {}
ui.flipletCharts = {};
function init(){
  Fliplet.Navigator.onReady().then(function(){
    $('[data-chart-line-id]').each(function (i, el) {
      var chartId = $(this).data('chart-line-id');
      var data = Fliplet.Widget.getData( chartId );
      var $container = $(el);
      var refreshTimeout = 5000;
      // var updateDateFormat = 'MMMM Do YYYY, h:mm:ss a';
      var updateDateFormat = 'hh:mm:ss a';

      function resetData() {
        data.entries = [];
        data.totalEntries = 0;
      }

      function refreshData() {
        return Fliplet.DataSources.fetchWithOptions({
          dataSourceId: parseInt(data.dataSourceId, 10),
          columns: [data.dataSourceColumnX, data.dataSourceColumnY]
        }).then(function(result){
          data.entries = [];
          data.totalEntries = 0;
          if (result.dataSource.columns.indexOf(data.dataSourceColumnX) < 0 || result.dataSource.columns.indexOf(data.dataSourceColumnY) < 0) {
            return Promise.resolve();
          }
          result.dataSourceEntries.forEach(function(row) {
            var x;
            if (data.dataFormat === 'timestamp') {
              x = new Date(row[data.dataSourceColumnX] || 0).getTime()
            } else {
              x = parseInt(row[data.dataSourceColumnX], 10) || 0;
            }
            var y = parseInt(row[data.dataSourceColumnY], 10) || 0;
            data.entries.push([x, y]);
          });
          data.entries = _.sortBy(data.entries, function(entry){
            return entry[0];
          });
          // SAVES THE TOTAL NUMBER OF ROW/ENTRIES
          data.totalEntries = data.entries.length;

          return Promise.resolve();
        });
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
            if (data.auto_refresh) {
              getLatestData();
            }
          });
        }, refreshTimeout);
      }

      function drawChart() {
        var chartOpt = {
          chart: {
            type: 'line',
            zoomType: 'xy',
            renderTo: $container.find('.chart-line-container')[0],
            events: {
              load: function(){
                refreshChartInfo();
                if (data.auto_refresh) {
                  getLatestData();
                }
              }
            }
          },
          title: {
            text: ''
          },
          subtitle: {
            text: ''
          },
          xAxis: {
            title: {
              text: data.x_axix_title,
              enabled: data.x_axix_title !== ''
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
              text: data.y_axix_title,
              enabled: data.y_axix_title !== ''
            }
          },
          tooltip: {
            enabled: data.show_data_values,
            headerFormat: '',
            pointFormat: [
              '<strong>',
              (data.x_axix_title !== '' ? data.x_axix_title : 'x'),
              '</strong> ',
              (data.dataFormat === 'timestamp' ? '{point.x:%Y-%m-%d %H:%M:%S}' : '{point.x}'),
              '<br><strong>',
              (data.y_axix_title !== '' ? data.y_axix_title : 'y'),
              '</strong>: {point.y}'
            ].join('')
          },
          series: [{
            data: data.entries,
            color: '#3276b1'
          }],
          legend: {
            enabled: false
          }
        };
        // Create and save chart object
        ui.flipletCharts[chartId] = new Highcharts.Chart(chartOpt);
      }

      refreshData().then(drawChart);
    });
  });
}

var debounceLoad = _.debounce(init, 500);

Fliplet.Studio.onEvent(function (event) {
  if (event.detail.event === 'reload-widget-instance') {
    debounceLoad();
  }
});
init();
