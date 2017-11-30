<?php
	try {
		require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
		include_file('core', 'authentification', 'php');
		if (!isConnect('admin')) {
			throw new Exception(__('401 - Accès non autorisé', __FILE__));
		}
		if (init('action') == 'add') {	
      exec('sudo mkdir -R '.dirname(__FILE__) . '/../../core/config/ambiance');
      exec('sudo chmod 777 -R '.dirname(__FILE__) . '/../../core/config/ambiance');
      $ambiance=fopen(dirname(__FILE__) . '/../../core/config/ambiance/'.init('action').'.json',"a+");
      fclose($ambiance);
			ajax::success(true);		
		}
		if (init('action') == 'remove') {	
      exec('sudo rm '.dirname(__FILE__) . '/../../core/config/ambiance/'.init('action').'.json');
			ajax::error(true);
		}
		throw new Exception(__('Aucune methode correspondante à : ', __FILE__) . init('action'));
		/*     * *********Catch exeption*************** */
	} catch (Exception $e) {
		ajax::error(displayExeption($e), $e->getCode());
	}
?>
