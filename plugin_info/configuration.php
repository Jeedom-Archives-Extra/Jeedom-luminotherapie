<?php
require_once dirname(__FILE__) . '/../../../core/php/core.inc.php';
include_file('core', 'authentification', 'php');
if (!isConnect()) {
    include_file('desktop', '404', 'php');
    die();
}
?>
 <div class="col-sm-6">
	<form class="form-horizontal">
		<legend>Gestion du démon</legend>
		<fieldset>
			<div class="form-group">
				<label class="col-lg-4 control-label" >{{Temps d'attente}}</label>
				<div class="col-lg-4">
			  		<input class="configKey form-control" data-l1key="waitDemon" />
				</div>
			</div>
		</fieldset>
	</form>
</div>
