<?php
	try {
		require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
		include_file('core', 'authentification', 'php');
		if (!isConnect('admin')) {
			throw new Exception(__('401 - Accès non autorisé', __FILE__));
		}
		if (init('action') == 'save') {	
   			exec('sudo rm '.dirname(__FILE__) . '/../../core/config/ambiance/'.init('name').'.json');
		      	$file=fopen(dirname(__FILE__) . '/../../core/config/ambiance/'.init('name').'.json',"a+");
			fwrite($file,init('ambiance'));
		      	fclose($file);
			ajax::success(true);		
		}
		if (init('action') == 'remove') {	
   			exec('sudo rm '.dirname(__FILE__) . '/../../core/config/ambiance/'.init('name').'.json');
			ajax::success(true);
		}
		if (init('action') == 'get') {	
			$ambiance= file_get_contents(dirname(__FILE__) . '/../../core/config/ambiance/'.init('name').'.json');
			ajax::success(json_decode($ambiance));
		}
		if (init('action') == 'getSimulaitonPoint') {	
			ajax::success(luminotherapie::Sequences(json_decode(init('Sequences'),true)));	
		}
		throw new Exception(__('Aucune methode correspondante à : ', __FILE__) . init('action'));
		/*     * *********Catch exeption*************** */
	} catch (Exception $e) {
		ajax::error(displayExeption($e), $e->getCode());
	}
?>
