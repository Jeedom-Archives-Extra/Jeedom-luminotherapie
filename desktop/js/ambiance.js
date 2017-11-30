$("#SeqList").sortable({axis: "y", cursor: "move", items: ".SequenceGroup", placeholder: "ui-state-highlight", tolerance: "intersect", forcePlaceholderSize: true});
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
function addSequence(_sequence) {
	var tr = $('<tr class="SequenceGroup">');
	tr.append($('<td>')
		  .append($('<input type="checkbox" class="expressionAttr" data-l1key="enable" checked/>')));
	tr.append($('<td>')
		.append($('<div class="input-group">')
			.append($('<span class="input-group-btn">')
				.append($('<a class="btn btn-default sequenceAttr btn-sm" data-action="remove">')
					.append($('<i class="fa fa-minus-circle">'))))
			.append($('<select class="expressionAttr form-control input-sm" data-l1key="expression"/>')
			       .append($('<option value="constant">')
				      .text('{{Constant}}'))
			       .append($('<option value="rampe">')
				      .text('{{Rampe}}'))
			       .append($('<option value="sin">')
				      .text('{{Sinusoide}}'))
			       .append($('<option value="carre">')
				      .text('{{Carré}}')))));
	tr.append(addParameter(_sequence.expression));
	$('#SeqList tbody').append(tr);
	$('#SeqList tbody').find('tr:last').setValues(_sequence, '.expressionAttr');	
	$('.sequenceAttr[data-action=remove]').off().on('click',function(){
		$(this).closest('tr').remove();
	});
	$('.expressionAttr[data-l1key=expression]').off().on('change',function(){
		$(this).closest('tr').find('td:last').html('');
		$(this).closest('tr').find('td:last').append(addParameter($(this).val()));
	});
  
}
function addParameter(type) {
	var td=$('<td>');
	td.append($('<div class="form-group">')
		.append($('<label class="col-sm-2 control-label">')
			.append('{{Durée du segment}}')
			.append($('<sup>')
				.append($('<i class="fa fa-question-circle tooltips" title="Saisissez la duree du segment (min)">'))))
		.append($('<div class="col-md-8 input-group">')
			.append($('<input type="text" class="expressionAttr form-control" data-l1key="duree" placeholder="Saisissez la duree du segment (min)">'))));
	td.append($('<div class="form-group">')
		.append($('<label class="col-sm-2 control-label">')
			.append('{{Offset}}')
			.append($('<sup>')
				.append($('<i class="fa fa-question-circle tooltips" title="Saisissez l\'offset de votre rampe">'))))
		.append($('<div class="col-md-8 input-group">')
			.append($('<input type="text" class="expressionAttr form-control" data-l1key="offset" placeholder="Saisissez l\'offset de votre segment">'))));
	switch (type){
		case "rampe":
			td.append($('<div class="form-group">')
				.append($('<label class="col-sm-2 control-label">')
					.append('{{Pente}}')
					.append($('<sup>')
						.append($('<i class="fa fa-question-circle tooltips" title="Saisissez la pente de votre rampe">'))))
				.append($('<div class="col-md-8 input-group">')
					.append($('<input type="text" class="expressionAttr form-control" data-l1key="pente" placeholder="Saisissez la pente de votre rampe">'))));
		break;
		case"carre":
		case "sin":
			td.append($('<div class="form-group">')
				.append($('<label class="col-sm-2 control-label">')
					.append('{{Fréquence}}')
					.append($('<sup>')
						.append($('<i class="fa fa-question-circle tooltips" title="Saisissez la frequence de votre sinusoide">'))))
				.append($('<div class="col-md-8 input-group">')
					.append($('<input type="text" class="expressionAttr form-control" data-l1key="frequance" placeholder="Saisissez la frequence de votre sinusoide">'))));
			td.append($('<div class="form-group">')
				.append($('<label class="col-sm-2 control-label">')
					.append('{{Amplitude}}')
					.append($('<sup>')
						.append($('<i class="fa fa-question-circle tooltips" title="Saisissez l\'amplitude de votre segement">'))))
				.append($('<div class="col-md-8 input-group">')
					.append($('<input type="text" class="expressionAttr form-control" data-l1key="amplitude" placeholder="Saisissez l\'amplitude de votre segement">'))));
		break;
	}		
	return td;
}
$('.sequenceAttr[data-action=add]').off().on('click',function(){
	addSequence({});
});
function UpdateSequenceGraph() {
	$.ajax({
		type: 'POST',
			async:true,
		url: 'plugins/luminotherapie/core/ajax/luminotherapie.ajax.php',
		data: {
			action:'getSimulaitonPoint',
			id:$(".eqLogicAttr[data-l1key=id]").val()
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
			drawSimpleGraph('SeqGraph', Series);
		}
	});
}
