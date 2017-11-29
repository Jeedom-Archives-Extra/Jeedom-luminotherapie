$('#tab_zones a').click(function(e) {
    e.preventDefault();
    $(this).tab('show');
});
$("#table_cmd").sortable({axis: "y", cursor: "move", items: ".cmd", placeholder: "ui-state-highlight", tolerance: "intersect", forcePlaceholderSize: true});
$(".parameter").sortable({axis: "y", cursor: "move", items: ".SequenceGroup", placeholder: "ui-state-highlight", tolerance: "intersect", forcePlaceholderSize: true});
function saveEqLogic(_eqLogic) {
	_eqLogic.configuration.sequence=new Object();
	var SequenceArray= new Array();
	$('#signaltab .SequenceGroup').each(function( index ) {
		SequenceArray.push($(this).getValues('.expressionAttr')[0])
	});
	_eqLogic.configuration.sequence=SequenceArray;
   	return _eqLogic;
}
function printEqLogic(_eqLogic) {
	$('.SequenceGroup').remove();
	if (typeof(_eqLogic.configuration.sequence) !== 'undefined') {
		for(var index in _eqLogic.configuration.sequence) { 
			if( (typeof _eqLogic.configuration.sequence[index] === "object") && (_eqLogic.configuration.sequence[index] !== null) )
				addSequence(_eqLogic.configuration.sequence[index]);
		}
	}
	
}
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
function addSequence(_sequence,_el) {
	var div = $('<div class="SequenceGroup">')
			.append($('<div class="input-group">')
				.append($('<span class="input-group-btn">')
					.append($('<input type="checkbox" class="expressionAttr" data-l1key="enable" checked/>')))
				.append($('<span class="input-group-btn">')
					.append($('<a class="btn btn-default conditionAttr btn-sm" data-action="remove">')
						.append($('<i class="fa fa-minus-circle">'))))
				.append($('<input class="expressionAttr form-control input-sm" data-l1key="name"/>'))
				.append($('<select class="expressionAttr form-control input-sm" data-l1key="expression"/>')
				       .append($('<option value="rampe">')
					      .text('{{Rampe}}'))
				       .append($('<option value="sin">')
					      .text('{{Sinusoide}}'))
				       .append($('<option value="carre">')
					      .text('{{Carré}}'))));
        
	$('.parameter').append(div);
	$('.parameter').find('.SequenceGroup:last').setValues(_sequence, '.expressionAttr');	
	$('.seq_list').append($('<li>').text(_sequence.name));
	$('.sequenceAttr[data-action=remove]').off().on('click',function(){
		$(this).closest('tr').remove();
	});
  
}
$('.sequenceAttr[data-action=add]').off().on('click',function(){
	addSequence({});
});
$("body").on('click', ".listCmdAction", function() {
	var el = $(this).closest('.form-group').find('input');
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
				step: false,
				name: '{{Simulation}}',
				data: data.result,
				type: 'line',
				marker: {
					enabled: false
				},
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
	legend: {
		enabled:false
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
