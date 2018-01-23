<?php
require_once dirname(__FILE__) . '/../../../core/php/core.inc.php';
function luminotherapie_install(){
}
function luminotherapie_update(){
	log::add('luminotherapie','debug','Lancement du script de mise a jours'); 
	foreach(eqLogic::byType('luminotherapie') as $eqLogic){
		$eqLogic->save();
	}
	log::add('luminotherapie','debug','Fin du script de mise a jours');
}
function luminotherapie_remove(){
}
?>
