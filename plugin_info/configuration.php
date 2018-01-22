Skip to content
This repository
Search
Pull requests
Issues
Marketplace
Explore
 @mika-nt28
 Sign out
 Unwatch 5
  Star 5  Fork 5 mika-nt28/Jeedom-Eibd
 Code  Issues 1  Pull requests 0  Projects 0  Wiki  Insights  Settings
Branch: beta Find file Copy pathJeedom-Eibd/plugin_info/configuration.php
6a008c9  on 4 Oct 2017
@mika-nt28 mika-nt28 Update configuration.php
2 contributors @mika-nt28 @bbreton09
RawBlameHistory     
134 lines (132 sloc)  4.06 KB
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
