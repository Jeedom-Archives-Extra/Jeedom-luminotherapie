$("#SeqList").sortable({axis: "y", cursor: "move", items: ".SequenceGroup", placeholder: "ui-state-highlight", tolerance: "intersect", forcePlaceholderSize: true});
var currentAmbiance='';
$('.ambianceDisplayCard').off().on('click',function(){
	currentAmbiance=$(this).attr('data-ambiance_id');
	$('.eqLogicThumbnailDisplay').hide();	
	$.ajax({
		type: 'POST',
		async:true,
		url: 'plugins/luminotherapie/core/ajax/ambiance.ajax.php',
		data: {
			action:'get',
			name: currentAmbiance
		},
		error: function (error) {
			$('#div_alert').showAlert({message: error.message, level: 'danger'});
		},
		success: function (_data) {
			$('.ambiance').show();
			$('.SequenceGroup').remove();
			if (_data.result.length > 0) {
				for(var index in _data.result.sequence) { 
					if( (typeof _data.result.sequence[index] === "object") && (_data.result.sequence[index] !== null) )
						addSequence(_data.result.sequence[index]);
				}
			}
		}
	});
});
$('.ambianceAction[data-action=save]').off().on('click',function(){
	var SequenceArray= new Array();
	$('#signaltab .SequenceGroup').each(function( index ) {
		SequenceArray.push($(this).getValues('.expressionAttr')[0])
	});
	$.ajax({
		type: 'POST',
		async:true,
		url: 'plugins/luminotherapie/core/ajax/ambiance.ajax.php',
		data: {
			action:'add',
			name:  currentAmbiance,
			ambiance: JSON.stringify(SequenceArray)
		},
		error: function (error) {
			$('#div_alert').showAlert({message: error.message, level: 'danger'});
		},
		success: function (_data) {
			var vars = getUrlVars();
			var url = 'index.php?';
			for (var i in vars) {
				if (i != 'id' && i != 'saveSuccessFull' && i != 'removeSuccessFull') {
					url += i + '=' + vars[i].replace('#', '') + '&';
				}
			}
			modifyWithoutSave = false;
			url += 'id=' + _data.id + '&saveSuccessFull=1';
			loadPage(url);
		}
	});
});
$('.ambianceAction[data-action=remove]').on('click', function () {
        bootbox.confirm('{{Etes-vous sûr de vouloir supprimer l\'ambiance}} ?', function (result) {
            if (result) {
			$.ajax({
				type: 'POST',
				async:true,
				url: 'plugins/luminotherapie/core/ajax/ambiance.ajax.php',
				data: {
					action:'remove',
					name: currentAmbiance,
				},
				error: function (error) {
					$('#div_alert').showAlert({message: error.message, level: 'danger'});
				},
				success: function (_data) {
					var vars = getUrlVars();
					var url = 'index.php?';
					for (var i in vars) {
						if (i != 'id' && i != 'saveSuccessFull' && i != 'removeSuccessFull') {
							url += i + '=' + vars[i].replace('#', '') + '&';
						}
					}
					modifyWithoutSave = false;
					url += 'id=' + _data.id + '&saveSuccessFull=1';
					loadPage(url);
				}
			});
		}
	});
});
$('.ambianceAction[data-action=add]').on('click', function () {
	bootbox.prompt("{{Nom de l'ambiance ?}}", function (result) {
		if (result !== null) {
			$.ajax({
				type: 'POST',
				async:true,
				url: 'plugins/luminotherapie/core/ajax/ambiance.ajax.php',
				data: {
					action:'add',
					ambiance:  result,
				},
				error: function (error) {
					$('#div_alert').showAlert({message: error.message, level: 'danger'});
				},
				success: function (_data) {
					var vars = getUrlVars();
					var url = 'index.php?';
					for (var i in vars) {
						if (i != 'id' && i != 'saveSuccessFull' && i != 'removeSuccessFull') {
							url += i + '=' + vars[i].replace('#', '') + '&';
						}
					}
					modifyWithoutSave = false;
					url += 'id=' + _data.id + '&saveSuccessFull=1';
					loadPage(url);
				}
			});
		}
	});
});
$('.ambianceAction[data-action=copy]').off().on('click',function(){
});
$('.sequenceAttr[data-action=add]').off().on('click',function(){
	addSequence({});
});
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
