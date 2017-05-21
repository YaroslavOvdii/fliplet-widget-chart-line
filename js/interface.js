var data = Fliplet.Widget.getData() || {
  dataSourceQuery: undefined,
  showDataValues: true,
  dataFormat: 'number',
  yAxisTitle: '',
  xAxisTitle: '',
  showTotalEntries: '',
  autoRefresh: ''
};

var dsQueryData = {
  settings: {
    dataSourceLabel: 'Select a data source',
    filters: false,
    columns: [
      {
        key: 'xAxis',
        label: 'Select a column for the X-axis',
        type: 'single'
      },
      {
        key: 'yAxis',
        label: 'Select a column for the Y-axis',
        type: 'single'
      }
    ]
  },
  result: data.dataSourceQuery
};

var $dataFormat = $('select#select-data-format');

var dsQueryProvider = Fliplet.Widget.open('com.fliplet.data-source-query', {
  selector: '.data-source-query',
  data: dsQueryData
});

dsQueryProvider.then(function(result){
  Fliplet.Widget.save({
    dataSourceQuery: result.data,
    dataFormat: $dataFormat.find(':selected').val(),
    showDataValues: $('#show_data_values:checked').val() === "show",
    yAxisTitle: $('#y_axis_title').val(),
    xAxisTitle: $('#x_axis_title').val(),
    showTotalEntries: $('#show_total_entries:checked').val() === "show",
    autoRefresh: $('#auto_refresh:checked').val() === "refresh"
  }).then(function () {
    Fliplet.Widget.complete();
    Fliplet.Studio.emit('reload-page-preview');
  });
});

// Fired from Fliplet Studio when the external save button is clicked
Fliplet.Widget.onSaveRequest(function () {
  dsQueryProvider.forwardSaveRequest();
});

// LOAD CHART SETTINGS
if (data) {
  $dataFormat.val(data.dataFormat || 'number').trigger('change');
  $('#show_data_values').prop('checked', data.showDataValues);
  $('#y_axis_title').val(data.yAxisTitle);
  $('#x_axis_title').val(data.xAxisTitle);
  $('#show_total_entries').prop('checked', data.showTotalEntries);
  $('#auto_refresh').prop('checked', data.autoRefresh);
}
