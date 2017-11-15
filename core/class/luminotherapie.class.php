<?php
require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
class luminotherapie extends eqLogic {
	public static function deamon_info() {
		$return = array();
		$return['log'] = 'luminotherapie';
		$return['launchable'] = 'ok';
		$return['state'] = 'ok';
		foreach(eqLogic::byType('luminotherapie') as $luminotherapie){
			$cron = cron::byClassAndFunction('luminotherapie', 'SimulAubeDemon',array('id' => $luminotherapie->getId()));
			if(is_object($cron) && !$cron->running())
				$return['state'] = 'nok';
		}
		return $return;
	}
	public static function deamon_start($_debug = false) {
		$deamon_info = self::deamon_info();
		if ($deamon_info['launchable'] != 'ok') 
			return;
		if ($deamon_info['state'] == 'ok') 
			return;
		foreach(eqLogic::byType('luminotherapie') as $luminotherapie){
			$cron = cron::byClassAndFunction('luminotherapie', 'SimulAubeDemon',array('id' => $luminotherapie->getId()));
			if(is_object($cron) && !$cron->running()){
				$cron->start();
				$cron->run();
			}
		}
		
	}
	public static function deamon_stop() {	
		foreach(eqLogic::byType('luminotherapie') as $luminotherapie){
			$cron = cron::byClassAndFunction('luminotherapie', 'SimulAubeDemon',array('id' => $luminotherapie->getId()));
			if(is_object($cron)){
				$cron->stop();
				$cron->remove();
			}
		}		
	}
	public function postSave() {
		$this->AddCommande('Démarrage','start',"action", 'other',1);
		$this->AddCommande('Arret','stop',"action", 'other',1);
		
	}
	public function AddCommande($Name,$_logicalId,$Type="info", $SubType='binary',$visible,$Template='') {
		$Commande = $this->getCmd(null,$_logicalId);
		if (!is_object($Commande))
		{
			$Commande = new luminotherapieCmd();
			$Commande->setId(null);
			$Commande->setName($Name);
			$Commande->setIsVisible($visible);
			$Commande->setLogicalId($_logicalId);
			$Commande->setEqLogic_id($this->getId());
			$Commande->setType($Type);
			$Commande->setSubType($SubType);
		}
     		$Commande->setTemplate('dashboard',$Template );
		$Commande->setTemplate('mobile', $Template);
		$Commande->save();
		return $Commande;
	}
	public function startSimulAubeDemon(){
		$cron = cron::byClassAndFunction('luminotherapie', 'SimulAubeDemon',array('id' => $this->getId()));
		if (!is_object($cron)) {
			$cron = new cron();
			$cron->setClass('luminotherapie');
			$cron->setFunction('SimulAubeDemon');
			$cron->setDeamon(1);
			$cron->setOption(array('id' => $this->getId()));
			$cron->setEnable(1);
			$cron->setSchedule('* * * * * *');
			$cron->save();
		}
		$cron->start();
		$cron->run();
	}
	public function removeSimulAubeDemon(){
		$cron = cron::byClassAndFunction('luminotherapie', 'SimulAubeDemon',array('id' => $this->getId()));
		if(is_object($cron)) {
			log::add('luminotherapie','info',$this->getHumanName().' Fin de la simulation d\'aube');	
			$cron->stop();
			$cron->remove();
		}
	}
	public static function SimulAubeDemon($_option){
		$luminotherapie=eqLogic::byId($_option['id']);
		if(is_object($luminotherapie)){
			log::add('luminotherapie','info',$luminotherapie->getHumanName().' Lancement de la simulation d\'aube');
			$time = 0;
			$cmdSlide=cmd::byId(str_replace('#','',$luminotherapie->getConfiguration('DawnSimulatorCmd')));
			$cmdRGB=cmd::byId(str_replace('#','',$luminotherapie->getConfiguration('DawnSimulatorColorCmd')));
			if(is_object($cmdSlide))
				log::add('luminotherapie','info',$luminotherapie->getHumanName().' Mise a jours automatique de '.$cmdSlide->getHumanName());
			if(is_object($cmdRGB))
				log::add('luminotherapie','info',$luminotherapie->getHumanName().' Mise a jours automatique de '.$cmdRGB->getHumanName());
			while(true){
				$slider = ceil(self::dawnSimulatorEngine(
					$luminotherapie->getConfiguration('DawnSimulatorEngineType'),
					$time,
					$luminotherapie->getConfiguration('DawnSimulatorEngineStartValue'), 
					$luminotherapie->getConfiguration('DawnSimulatorEngineEndValue'), 
					$luminotherapie->getConfiguration('DawnSimulatorEngineDuration')
				));
				$Value=$slider/$luminotherapie->getConfiguration('DawnSimulatorEngineEndValue');
				$color=$luminotherapie->changeColor($Value);
				$time++;
				if(is_object($cmdSlide)){
					log::add('luminotherapie','debug',$luminotherapie->getHumanName().' Valeur de l\'intensité lumineuse : ' .$slider.'/'.$luminotherapie->getConfiguration('DawnSimulatorEngineEndValue')." - durée : ".$time."/".$luminotherapie->getConfiguration('DawnSimulatorEngineDuration'));
					$cmdSlide->Execute(array('slider'=>$slider));
				}
				if(is_object($cmdRGB)){
					log::add('luminotherapie','debug',$luminotherapie->getHumanName().' Valeur de la couleur : ' .$color);
					$cmdRGB->Execute(array('color'=>$color));
				}
				if($slider == $luminotherapie->getConfiguration('DawnSimulatorEngineEndValue') || ($time - 1) == $luminotherapie->getConfiguration('DawnSimulatorEngineDuration')){
					$luminotherapie->removeSimulAubeDemon($_option);
					return;
				}else
					sleep(60);
			}
		}
		
	}
	public static function dawnSimulatorEngine($type, $time, $startValue, $endValue, $duration) {
		if($startValue=='')
			$startValue=0;
		if($endValue=='')
			$endValue=100;
		if($duration=='')
			$duration=30;
		switch ($type){
			case 'Linear':
				return $endValue * $time / $duration + $startValue;
			break;
			case 'InQuad':
				$time = $time / $duration;
				return $endValue * pow($time, 2) + $startValue;
			break;
			case 'InOutQuad':
				$time = $time / $duration * 2;
				if ($time < 1)
					return $endValue / 2 * pow($time, 2) + $startValue;
				else
					return -$endValue / 2 * (($time - 1) * ($time - 3) - 1) + $startValue;
			break;
			case 'InOutExpo':
				if ($time == 0)
					return $startValue ;
				if ($time == $duration)
					return $startValue + $endValue;
				$time = $time / $duration * 2;
				if ($time < 1)
					return $endValue / 2 * pow(2, 10 * ($time - 1)) + $startValue - $endValue * 0.0005;
				else{
					$time = $time - 1;
					return $endValue / 2 * 1.0005 * (-pow(2, -10 * $time) + 2) + $startValue;
				}
			break;
			case 'OutInExpo':
				if ($time < $duration / 2)
					return self::equations('OutExpo', $time * 2, $startValue, $endValue / 2, $duration);
				else
					return self::equations('InExpo', ($time * 2) - $duration, $startValue + $endValue / 2, $endValue / 2, $duration);
			break;
			case 'InExpo':
				if($time == 0)
					return $startValue;
				else
					return $endValue * pow(2, 10 * ($time / $duration - 1)) + $startValue - $endValue * 0.001;	
			break;
			case 'OutExpo':
				if($time == $duration)
					return $startValue + $endValue;
				else
					return $endValue * 1.001 * (-pow(2, -10 * $time / $duration) + 1) + $startValue;
			break;
		}
	}
	private function changeColor($Value){
		//$r 0% = 255; 50% = 0 ;100% = 0
		//$g 0% = 0; 50% = 255 ;100% = 0
		//$b 0% = 0; 50% = 0 ;100% = 255
		if($Value > 0.5){
			$r=255*$Value;
			$g=255*(1-$Value);
			$b=0;
		}else{
			$r=0;
			$g=255*$Value;
			$b=255*(1-$Value);
		}
		return $this->rgb2html($r, $g, $b);
	}
	private function html2rgb($color){
		if ($color[0] == '#')
			$color = substr($color, 1);
		if (strlen($color) == 6)
			list($r, $g, $b) = array($color[0].$color[1],
		$color[2].$color[3],
		$color[4].$color[5]);
		elseif (strlen($color) == 3)
			list($r, $g, $b) = array($color[0].$color[0], $color[1].$color[1], $color[2].$color[2]);
		else
			return false;
		$r = hexdec($r); 
		$g = hexdec($g);
		$b = hexdec($b);
		return array($r, $g, $b);
	}
	private function rgb2html($r, $g=-1, $b=-1)	{
		if (is_array($r) && sizeof($r) == 3)
			list($r, $g, $b) = $r;
		$r = intval($r); 
		$g = intval($g);
		$b = intval($b);
		
		$r = dechex($r<0?0:($r>255?255:$r));
		$g = dechex($g<0?0:($g>255?255:$g));
		$b = dechex($b<0?0:($b>255?255:$b));
		
		$color = (strlen($r) < 2?'0':'').$r;
		$color .= (strlen($g) < 2?'0':'').$g;
		$color .= (strlen($b) < 2?'0':'').$b;
		return '#'.$color;
	}
}
class luminotherapieCmd extends cmd {
    public function execute($_options = null) {	
		switch($this->getLogicalId()){
			case 'start':
				$this->getEqLogic()->startSimulAubeDemon();
			break;
			case 'stop':
				$this->getEqLogic()->removeSimulAubeDemon();
			break;
				
		}	
	}
}
?>
