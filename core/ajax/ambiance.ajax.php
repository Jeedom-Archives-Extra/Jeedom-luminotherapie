<?php
	try {
		require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
		include_file('core', 'authentification', 'php');
		if (!isConnect('admin')) {
			throw new Exception(__('401 - Accès non autorisé', __FILE__));
		}
		if (init('action') == 'add') {	
		      	exec('sudo mkdir -p '.dirname(__FILE__) . '/../../core/config/ambiance');
		      	exec('sudo chmod 777 -R '.dirname(__FILE__) . '/../../core/config/ambiance');
		      	$file=fopen(dirname(__FILE__) . '/../../core/config/ambiance/'.init('name').'.json',"a+");
		      	fclose($file);
			ajax::success(true);		
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
		      	$file=fopen(dirname(__FILE__) . '/../../core/config/ambiance/'.init('name').'.json',"r");
			$ambiance='';
			while (($buffer = fgets($file, 4096)) !== false) {
				$ambiance.= $buffer;
			}
		      	fclose($file);
			ajax::success(utils::o2a($ambiance));
		}
		throw new Exception(__('Aucune methode correspondante à : ', __FILE__) . init('action'));
		/*     * *********Catch exeption*************** */
	} catch (Exception $e) {
		ajax::error(displayExeption($e), $e->getCode());
	}
?>
