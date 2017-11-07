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
	UpdateGraphSim();
});
$("body").on('change', ".eqLogicAttr[data-l2key=DawnSimulatorEngineEndValue]", function() {
	UpdateGraphSim();
});
$("body").on('change', ".eqLogicAttr[data-l2key=DawnSimulatorEngineDuration]", function() {
	UpdateGraphSim();
});
function UpdateGraphSim() {
	var DawnSimulatorEngineType=$(".eqLogicAttr[data-l2key=DawnSimulatorEngineType]").val();
	var DawnSimulatorEngineEndValue=$(".eqLogicAttr[data-l2key=DawnSimulatorEngineEndValue]").val();
	var DawnSimulatorEngineDuration=$(".eqLogicAttr[data-l2key=DawnSimulatorEngineDuration]").val();
	if(DawnSimulatorEngineDuration == '' ||DawnSimulatorEngineEndValue == '' || DawnSimulatorEngineType == '')
    		return;
	$.ajax({
		type: 'POST',
			async:true,
		url: 'plugins/luminotherapie/core/ajax/luminotherapie.ajax.php',
		data: {
			action:'SimulaitonPoint',
			DawnSimulatorEngineType:DawnSimulatorEngineType,
			DawnSimulatorEngineStartValue:0,
			DawnSimulatorEngineEndValue:DawnSimulatorEngineEndValue,
			DawnSimulatorEngineDuration:DawnSimulatorEngineDuration
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
			drawSimpleGraph('GraphSim', Series);
		}
	});
}
function drawSimpleGraph(_el, _serie) {
    new Highcharts.chart({
      	title:{
          text:"Simulation"
        },
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
        series: _serie
    });
}
