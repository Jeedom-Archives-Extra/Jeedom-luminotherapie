$("#table_cmd").sortable({axis: "y", cursor: "move", items: ".cmd", placeholder: "ui-state-highlight", tolerance: "intersect", forcePlaceholderSize: true});
function addCmdToTable(_cmd) {
	var tr =$('<tr class="cmd" data-cmd_id="' + init(_cmd.id) + '">');
	tr.append($('<td>')
		.append($('<input type="hidden" class="cmdAttr form-control input-sm" data-l1key="id">'))
		.append($('<input type="hidden" class="cmdAttr form-control input-sm" data-l1key="type">'))
		.append($('<input type="hidden" class="cmdAttr form-control input-sm" data-l1key="subType">'))
		.append($('<input class="cmdAttr form-control input-sm" data-l1key="name" value="' + init(_cmd.name) + '" placeholder="{{Name}}" title="Name">')));
	var parmetre=$('<td>');	
	if (is_numeric(_cmd.id)) {
		parmetre.append($('<a class="btn btn-default btn-xs cmdAction" data-action="test">')
			.append($('<i class="fa fa-rss">')
				.text('{{Tester}}')));
	}
	parmetre.append($('<a class="btn btn-default btn-xs cmdAction tooltips" data-action="configure">')
		.append($('<i class="fa fa-cogs">')));
	tr.append(parmetre);
	$('#table_cmd tbody').append(tr);
	$('#table_cmd tbody tr:last').setValues(_cmd, '.cmdAttr');
	jeedom.cmd.changeType($('#table_cmd tbody tr:last'), init(_cmd.subType));
}
$('#tab_zones a').click(function(e) {
    e.preventDefault();
    $(this).tab('show');
});

$("body").on('click', ".listCmdAction", function() {
	var el = $(this).closest('.form-group').find('.eqLogicAttr[data-l2key=DawnSimulatorCmd]');
	jeedom.cmd.getSelectModal({cmd: {type: 'action'}}, function (result) {
		el.value(result.human);
	});
});

$("body").on('change', ".eqLogicAttr[data-l2key=DawnSimulatorEngineType]", function() {
	$.ajax({
		type: 'POST',
			async:true,
		url: 'plugins/luminotherapie/core/ajax/luminotherapie.ajax.php',
		data: {
			action:'SimulaitonPoint',
			DawnSimulatorEngineType:$(".eqLogicAttr[data-l2key=DawnSimulatorEngineType]").val(),
			DawnSimulatorEngineStartValue:$(".eqLogicAttr[data-l2key=DawnSimulatorEngineStartValue]").val(),
			DawnSimulatorEngineEndValue:$(".eqLogicAttr[data-l2key=DawnSimulatorEngineEndValue]").val(),
			DawnSimulatorEngineDuration:$(".eqLogicAttr[data-l2key=DawnSimulatorEngineDuration]").val()
			},
		dataType: 'json',
		error: function (request, status, error) {
		    handleAjaxError(request, status, error);
		},
		success: function (data) {		
			var Series = [{
				step: true,
				name: '{{Simulation}}',
				data: data.result,
				type: 'line',
				tooltip: {
					valueDecimals: 2
				},
			}];
			drawSimpleGraph($('#GraphSim'), Series);
		}
	});
});
function drawSimpleGraph(_el, _serie) {
    var legend = {
        enabled: true,
        borderColor: 'black',
        borderWidth: 2,
        shadow: true
    };

    new Highcharts.StockChart({
        chart: {
            zoomType: 'x',
            renderTo: _el,
            height: 350,
            spacingTop: 0,
            spacingLeft: 0,
            spacingRight: 0,
            spacingBottom: 0
        },
        credits: {
            text: 'Copyright Jeedom',
            href: 'http://jeedom.fr',
        },
        navigator: {
            enabled: false
        },
        rangeSelector: {
            buttons: [{
                    type: 'minute',
                    count: 30,
                    text: '30m'
                }, {
                    type: 'hour',
                    count: 1,
                    text: 'H'
                }, {
                    type: 'day',
                    count: 1,
                    text: 'J'
                }, {
                    type: 'week',
                    count: 1,
                    text: 'S'
                }, {
                    type: 'month',
                    count: 1,
                    text: 'M'
                }, {
                    type: 'year',
                    count: 1,
                    text: 'A'
                }, {
                    type: 'all',
                    count: 1,
                    text: 'Tous'
                }],
            selected: 6,
            inputEnabled: false
        },
        legend: legend,
        tooltip: {
            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
            valueDecimals: 2,
        },
        yAxis: {
            format: '{value}',
            showEmpty: false,
            showLastLabel: true,
            min: 0,
            labels: {
                align: 'right',
                x: -5
            }
        },
        scrollbar: {
            barBackgroundColor: 'gray',
            barBorderRadius: 7,
            barBorderWidth: 0,
            buttonBackgroundColor: 'gray',
            buttonBorderWidth: 0,
            buttonBorderRadius: 7,
            trackBackgroundColor: 'none', trackBorderWidth: 1,
            trackBorderRadius: 8,
            trackBorderColor: '#CCC'
        },
        series: _serie
    });
}
