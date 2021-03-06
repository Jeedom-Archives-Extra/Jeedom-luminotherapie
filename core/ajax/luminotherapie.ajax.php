<?php
	try {
		require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
		include_file('core', 'authentification', 'php');
		if (!isConnect('admin')) {
			throw new Exception(__('401 - Accès non autorisé', __FILE__));
		}
		if (init('action') == 'SimulaitonPoint') {		
			$point=null;
			for($time=init('DawnSimulatorEngineStartValue');$time<=init('DawnSimulatorEngineDuration');$time++){
				$point[] = ceil(luminotherapie::dawnSimulatorEngine(
					init('DawnSimulatorEngineType'),
					$time,
					init('DawnSimulatorEngineStartValue'), 
					init('DawnSimulatorEngineEndValue'), 
					init('DawnSimulatorEngineDuration')
				));
			}
			ajax::success($point);		
		}
		if (init('action') == 'getSimulaitonPoint') {	
			$eqLogic = eqLogic::byId(init('id'));
			if(is_object($eqLogic))
				ajax::success($eqLogic->Sequences());	
			ajax::error("Sequence introuvable");
		}
		throw new Exception(__('Aucune methode correspondante à : ', __FILE__) . init('action'));
		/*     * *********Catch exeption*************** */
	} catch (Exception $e) {
		ajax::error(displayExeption($e), $e->getCode());
	}
?>
