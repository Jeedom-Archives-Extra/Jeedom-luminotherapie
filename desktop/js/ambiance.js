$(".SeqList").sortable({axis: "y", cursor: "move", items: ".SequenceGroup", placeholder: "ui-state-highlight", tolerance: "intersect", forcePlaceholderSize: true});
var currentAmbiance='';
$('.ambianceDisplayCard').off().on('click',function(){
	currentAmbiance=$(this).attr('data-ambiance_id');
	$('.eqLogicThumbnailDisplay').hide();	
	$.ajax({
		type: 'POST',            
		async: false,
		url: 'plugins/luminotherapie/core/ajax/ambiance.ajax.php',
		data:{
			action: 'get',
			name: currentAmbiance
		},
		dataType: 'json',
		global: false,
		error: function(request, status, error) {},
		success: function(data) {
			if (!data.result){
				return;
			}
			$('.ambianceAction[data-action=partage]').attr('href',"core/php/downloadFile.php?pathfile="+encodeURIComponent("plugins/luminotherapie/core/config/ambiance/"+currentAmbiance+".json"));
			$('.ambiance').show();
			$('.SequenceGroup').remove();
			if (typeof(data.result) != 'undefined') {
				$('body').setValues(data.result.Configuration, '.ConfigurationAttr');	
				for(var index in data.result.Luminosite) { 
					if( (typeof data.result.Luminosite[index] === "object") && (data.result.Luminosite[index] !== null) )
						addSequence(data.result.Luminosite[index],$('#luminotab'));
				}
				for(var index in data.result.Couleur) { 
					if( (typeof data.result.Couleur[index] === "object") && (data.result.Couleur[index] !== null) )
						addSequence(data.result.Couleur[index],$('#colortab'));
				}
			}
			UpdateSequenceGraph();
		} 
	});
});
$('.ambianceAction[data-action=returnToThumbnailDisplay]').off().on('click',function(){
	$('.ambiance').hide();
	$('.eqLogicThumbnailDisplay').show();	
});
$('.ambianceAction[data-action=save]').off().on('click',function(){
	$.ajax({
		type: 'POST',
		async:true,
		url: 'plugins/luminotherapie/core/ajax/ambiance.ajax.php',
		data: {
			action:'save',
			name:  currentAmbiance,
			ambiance: getAmbianceValue()
		},
		error: function (error) {
			$('#div_alert').showAlert({message: error.message, level: 'danger'});
		},
		success: function (_data) {
			UpdateSequenceGraph();
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
					loadPage(url);
				}
			});
		}
	});
});
$('.ambianceAction[data-action=add]').on('click', function () {
	bootbox.prompt("{{Nom de l'ambiance ?}}", function (result) {
		if (result !== null) {
			currentAmbiance=result;
			$('.eqLogicThumbnailDisplay').hide();	
			$('.ambiance').show();
			$('.SequenceGroup').remove();
		}
	});
});
$('.ambianceAction[data-action=copy]').off().on('click',function(){
	bootbox.prompt("{{Nom de l'ambiance ?}}", function (result) {
		if (result !== null) {
			currentAmbiance=result;
			$('.ambianceAction[data-action=save]').trigger('click');
		}
	});
});
$('.sequenceAttr[data-action=add]').off().on('click',function(){
  if($(this).closest('.tab-pane').attr('id') == 'luminotab'){
	addSequence({lum:{}}, $(this).closest('.tab-pane'));
  }else{
	  if($('.ConfigurationAttr[data-l1key=Couleur][data-l2key=hsl]').is(':checked'))
		addSequence({Hue:{},Saturation:{},Lightness:{}}, $(this).closest('.tab-pane'));
	  else
		addSequence({R:{},G:{},B:{}}, $(this).closest('.tab-pane'));
  }
});
function addSequence(_sequence,_el) {
	var Parameter=$('<tbody>');
	for(var index in _sequence) { 
		if(index != 'enable' && index != 'duree'){
			var tr = $('<tr>')
			tr.append($('<td>').text(index));
			tr.append($('<td>')
				.append($('<div class="input-group">')
					.append($('<select class="expressionAttr form-control input-sm" data-l1key="'+index+'" data-l2key="expression"/>')
						.append($('<option value="constant">')
						      .text('{{Constant}}'))
						.append($('<option value="rampe">')
						      .text('{{Rampe}}'))
						.append($('<option value="sin">')
						      .text('{{Sinusoide}}'))
						.append($('<option value="carre">')
						      .text('{{Carré}}'))
						.append($('<option value="InQuad">')
						      .text('{{InQuad}}'))
						.append($('<option value="InOutQuad">')
						      .text('{{InOutQuad}}'))
						.append($('<option value="InOutExpo">')
						      .text('{{InOutExpo}}'))
						.append($('<option value="OutInExpo">')
						      .text('{{OutInExpo}}'))
						.append($('<option value="InExpo">')
						      .text('{{InExpo}}'))
						.append($('<option value="OutExpo">')
						      .text('{{OutExpo}}')))));
			tr.append(addParameter(_sequence.expression,index));
			Parameter.append(tr);
		}
	}
	var Sequences = $('<tr class="SequenceGroup">')
		.append($('<td>')
			.append($('<input type="checkbox" class="expressionAttr" data-l1key="enable" checked/>'))
			.append($('<a class="btn btn-default sequenceAttr btn-sm" data-action="remove">')
				.append($('<i class="fa fa-minus-circle">'))))
		.append($('<td>')
			.append($('<input type="text" class="expressionAttr form-control" data-l1key="duree" placeholder="Saisissez la duree du segment (en fonction de votre echelle de temps)">')))
		.append($('<td>')
			.append($('<table class="table table-bordered table-condensed">').append(Parameter)));
	_el.find('.SeqList .sequences').append(Sequences);
	_el.find('.SeqList .sequences').find('.SequenceGroup:last').setValues(_sequence, '.expressionAttr');	
	$('.sequenceAttr[data-action=remove]').off().on('click',function(){
		$(this).closest('tr').remove();
	});
	$('.expressionAttr[data-l2key=expression]').off().on('change',function(){
		$(this).closest('tr').find('td:last').html('');
		$(this).closest('tr').find('td:last').append(addParameter($(this).val(),$(this).attr('data-l1key')));
		UpdateSequenceGraph();
	});
	$('.expressionAttr[data-l1key=duree]').off().on('keyup',function(){
		UpdateSequenceGraph();
	});
	$('.expressionAttr[data-l2key=offset]').off().on('keyup',function(){
		UpdateSequenceGraph();
	});
	$('.expressionAttr[data-l2key=pente]').off().on('keyup',function(){
		UpdateSequenceGraph();
	});
	$('.expressionAttr[data-l2key=dutty]').off().on('keyup',function(){
		UpdateSequenceGraph();
	});
	$('.expressionAttr[data-l2key=periode]').off().on('keyup',function(){
		UpdateSequenceGraph();
	});
	$('.expressionAttr[data-l2key=amplitude]').off().on('keyup',function(){
		UpdateSequenceGraph();
	});
	$('.expressionAttr[data-l2key=max]').off().on('keyup',function(){
		UpdateSequenceGraph();
	});
	_el.find('.SeqList .sequences').find('.SequenceGroup:last').setValues(_sequence, '.expressionAttr');	
}
function addParameter(type,index) {
	var td=$('<td>');
	td.append($('<div class="form-group">')
		.append($('<label class="col-sm-2 control-label">')
			.append('{{Offset}}')
			.append($('<sup>')
				.append($('<i class="fa fa-question-circle tooltips" title="Saisissez l\'offset de votre rampe">'))))
		.append($('<div class="col-md-8 input-group">')
			.append($('<input type="text" class="expressionAttr form-control" data-l1key="'+index+'" data-l2key="offset" placeholder="Saisissez l\'offset de votre segment">'))));
	switch (type){
		case "rampe":
			td.append($('<div class="form-group">')
				.append($('<label class="col-sm-2 control-label">')
					.append('{{Pente}}')
					.append($('<sup>')
						.append($('<i class="fa fa-question-circle tooltips" title="Saisissez la pente de votre rampe">'))))
				.append($('<div class="col-md-8 input-group">')
					.append($('<input type="text" class="expressionAttr form-control" data-l1key="'+index+'" data-l2key="pente" placeholder="Saisissez la pente de votre rampe">'))));
		break;
		case"carre":
			td.append($('<div class="form-group">')
				.append($('<label class="col-sm-2 control-label">')
					.append('{{Rapport cyclique}}')
					.append($('<sup>')
						.append($('<i class="fa fa-question-circle tooltips" title="Saisissez le rapport cyclique de votre signal (%)">'))))
				.append($('<div class="col-md-8 input-group">')
					.append($('<input type="text" class="expressionAttr form-control" data-l1key="'+index+'" data-l2key="dutty" placeholder="Saisissez le rapport cyclique de votre signal (%)">'))));
		case "sin":
			td.append($('<div class="form-group">')
				.append($('<label class="col-sm-2 control-label">')
					.append('{{Periode}}')
					.append($('<sup>')
						.append($('<i class="fa fa-question-circle tooltips" title="Saisissez la période de votre sinusoide">'))))
				.append($('<div class="col-md-8 input-group">')
					.append($('<input type="text" class="expressionAttr form-control" data-l1key="'+index+'" data-l2key="periode" placeholder="Saisissez la frequence de votre sinusoide">'))));
			td.append($('<div class="form-group">')
				.append($('<label class="col-sm-2 control-label">')					.append('{{Amplitude}}')
					.append($('<sup>')
						.append($('<i class="fa fa-question-circle tooltips" title="Saisissez l\'amplitude de votre segement">'))))
				.append($('<div class="col-md-8 input-group">')
					.append($('<input type="text" class="expressionAttr form-control" data-l1key="'+index+'" data-l2key="amplitude" placeholder="Saisissez l\'amplitude de votre segement">'))));
			break;
		case 'InQuad':
		case 'InOutQuad':
		case 'InOutExpo':
		case 'OutInExpo':
		case 'InExpo':
		case 'OutExpo':
			td.append($('<div class="form-group">')
				.append($('<label class="col-sm-2 control-label">')
					.append('{{Valeur Maximal}}')
					.append($('<sup>')
						.append($('<i class="fa fa-question-circle tooltips" title="Saisissez la valeur maximal de votre simulation">'))))
				.append($('<div class="col-md-8 input-group">')
					.append($('<input type="text" class="expressionAttr form-control" data-l1key="'+index+'" data-l2key="max" placeholder="Saisissez la valeur maximal de votre simulation">'))));
		break;
	}		
	return td;
}
function getAmbianceValue() {
	if (typeof(AmbianceArray) == "undefined") 
		var AmbianceArray= new Object();
	else
		AmbianceArray=null;
	AmbianceArray.Configuration= new Array();
	AmbianceArray.Luminosite= new Array();
	AmbianceArray.Couleur= new Array();
	AmbianceArray.Configuration=$('body').getValues('.ConfigurationAttr')[0];
	$('#luminotab .SequenceGroup').each(function( index ) {
		AmbianceArray.Luminosite.push($(this).getValues('.expressionAttr')[0]);
	});
	var SequenceArray= new Array();
	$('#colortab .SequenceGroup').each(function( index ) {
		AmbianceArray.Couleur.push($(this).getValues('.expressionAttr')[0]);
	});
	return JSON.stringify(AmbianceArray);
}
function UpdateSequenceGraph() {
	$.ajax({
		type: 'POST',
		async:true,
		url: 'plugins/luminotherapie/core/ajax/ambiance.ajax.php',
		data: {
			action:'getSimulaitonPoint',
			Sequences: getAmbianceValue()
		},
		dataType: 'json',
		error: function (request, status, error) {
		    handleAjaxError(request, status, error);
		},
		success: function (data) {			
			if (data.result == null) 
				return;
			if (typeof(data.result.Luminosite) != 'undefined') {
				var Series = [{
					step: true,
					name: '{{Simulation}}',
					data: data.result.Luminosite,
					type: 'line',
					marker: {
						enabled: false
					},
					tooltip: {
						valueDecimals: 2
					},
				}];
				drawSimpleGraph('SeqLumGraph', Series);
			}
			if (typeof(data.result.Couleur) != 'undefined') 
				drawColorGraph($('#SeqColorGraph'), data.result.Couleur);
		}
	});
}
var timer= null;
function drawColorGraph(_el, _serie) {
  	_el.css('width',"100");
  	_el.css('height',"100");
	var index=0
	if(timer!= null)
		clearInterval(timer);
  	timer = setInterval(function(){
		_el.css('background-color',_serie[index]);
      		_el.text(_serie[index])
		index++;
		if(index >_serie.length)
			index=0;
	},100);
}
