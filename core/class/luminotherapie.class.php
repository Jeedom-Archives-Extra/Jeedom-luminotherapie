<?php
require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
class luminotherapie extends eqLogic {
	public static function deamon_info() {
		$return = array();
		$return['log'] = 'luminotherapie';
		$return['launchable'] = 'ok';
		$return['state'] = 'ok';
	/*	foreach(eqLogic::byType('luminotherapie') as $luminotherapie){
			$cron = cron::byClassAndFunction('luminotherapie', 'SimulAubeDemon',array('id' => $luminotherapie->getId()));
			if(is_object($cron) && !$cron->running())
				$return['state'] = 'nok';
		}*/
		return $return;
	}
	public static function deamon_start($_debug = false) {
		$deamon_info = self::deamon_info();
		if ($deamon_info['launchable'] != 'ok') 
			return;
		if ($deamon_info['state'] == 'ok') 
			return;
		/*foreach(eqLogic::byType('luminotherapie') as $luminotherapie){
			$cron = cron::byClassAndFunction('luminotherapie', 'SimulAubeDemon',array('id' => $luminotherapie->getId()));
			if(is_object($cron) && !$cron->running()){
				$cron->start();
				$cron->run();
			}
		}*/
		
	}
	public static function deamon_stop() {	
		/*foreach(eqLogic::byType('luminotherapie') as $luminotherapie){
			$cron = cron::byClassAndFunction('luminotherapie', 'SimulAubeDemon',array('id' => $luminotherapie->getId()));
			if(is_object($cron)){
				$cron->stop();
				$cron->remove();
			}
		}	*/	
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
			$cmdSlide=cmd::byId(str_replace('#','',$luminotherapie->getConfiguration('DawnSimulatorCmd')));
			$cmdRGB=cmd::byId(str_replace('#','',$luminotherapie->getConfiguration('DawnSimulatorColorCmd')));
			if(is_object($cmdSlide))
				log::add('luminotherapie','info',$luminotherapie->getHumanName().' Mise a jours automatique de '.$cmdSlide->getHumanName());
			if(is_object($cmdRGB))
				log::add('luminotherapie','info',$luminotherapie->getHumanName().' Mise a jours automatique de '.$cmdRGB->getHumanName());
			$Ambiance=self::Sequences($luminotherapie->getConfiguration('ambiance'));
			for($time=0;$time<count($Ambiance['Luminosite']);$time++){
				if(is_object($cmdSlide)){
					log::add('luminotherapie','debug',$luminotherapie->getHumanName().' Valeur de l\'intensité lumineuse : ' .$Ambiance['Luminosite'][$time]);
					$cmdSlide->Execute(array('slider'=>$Ambiance['Luminosite'][$time]));
				}
				if(is_object($cmdRGB)){
					log::add('luminotherapie','debug',$luminotherapie->getHumanName().' Valeur de la couleur : ' .$Ambiance['Couleur'][$time]);
					$cmdRGB->Execute(array('color'=>$Ambiance['Couleur'][$time]));
				}
				switch($luminotherapie->getConfiguration('temps')){
					case 'sec':
					break;
					case 'min':
						sleep(60);
					break;
					case 'heure':
						sleep(60*60);
					break;
				}
			}
       			$luminotherapie->removeSimulAubeDemon();
		}
	}
	public static function Sequences($name) {
		$ambiance= file_get_contents(dirname(__FILE__) . '/../../core/config/ambiance/'.$name.'.json');
		$Value=null;	
		foreach(json_decode($ambiance, true) as $key => $Sequences){	
			if(count($Sequences) >0){
				$Step=null;
				foreach($Sequences as $Sequence){
					if(!$Sequence['enable'])
						continue;
					if($key == 'Luminosite'){
						for($time=0; $time <= $Sequence['duree'];$time++)
							$Value[$key][]= ceil(self::equation($Sequence['duree'],$Sequence['lum'], $time, end($Value)));
					}else{
						for($time=0; $time <= $Sequence['duree'];$time++){
							$R= ceil(self::equation($Sequence['duree'],$Sequence['R'], $time, end($Value)));
							$G= ceil(self::equation($Sequence['duree'],$Sequence['G'], $time, end($Value)));
							$B= ceil(self::equation($Sequence['duree'],$Sequence['B'], $time, end($Value)));
							$Value[$key][]=self::rgb2html($R, $G, $B);
						}
					}
				}
			}
		}
		return $Value;
	}
	public static function equation($Duree,$Sequence, $time, $Value) {
		switch ($Sequence['expression']){
			case 'constant':
				return $Sequence['offset'];
			break;
			case 'rampe':
				return $time * $Sequence['pente'] + $Sequence['offset'];
			break;
			case 'sin':
				return $Sequence['amplitude'] * sin($time/(1/$Sequence['frequence']))+$Sequence['offset'];
			break;
			case 'carre':
			break;
			case 'InQuad':
				$time = $time / $Duree;
				return $Sequence['max'] * pow($time, 2) + $Sequence['offset'];
			break;
			case 'InOutQuad':
				$time = $time / $Duree * 2;
				if ($time < 1)
					return $Sequence['max'] / 2 * pow($time, 2) + $Sequence['offset'];
				else
					return -$Sequence['max'] / 2 * (($time - 1) * ($time - 3) - 1) + $Sequence['offset'];
			break;
			case 'InOutExpo':
				if ($time == 0)
					return $Sequence['offset'] ;
				if ($time == $Duree)
					return $Sequence['offset'] + $Sequence['max'];
				$time = $time / $Duree * 2;
				if ($time < 1)
					return $Sequence['max'] / 2 * pow(2, 10 * ($time - 1)) + $Sequence['offset'] - $Sequence['max'] * 0.0005;
				else{
					$time = $time - 1;
					return $Sequence['max'] / 2 * 1.0005 * (-pow(2, -10 * $time) + 2) + $Sequence['offset'];
				}
			break;
			case 'OutInExpo':
				if ($time < $Duree / 2){
					$Sequence['expression']  =  'OutExpo';
					$time = $time * 2;
					$Sequence['max'] = $Sequence['max'] / 2;
					return self::equation($Duree,$Sequence, $time, $Value);
				}else{
					$Sequence['expression']  =  'InExpo';
					$time = ($time * 2) - $Sequence['duree'];
					$Sequence['max'] = $Sequence['max'] / 2;
					$Sequence['offset'] = $Sequence['offset'] + $Sequence['max'] / 2;
					return self::equation($Duree,$Sequence, $time, $Value);
				}
			break;
			case 'InExpo':
				if($time == 0)
					return $Sequence['offset'];
				else
					return $Sequence['max'] * pow(2, 10 * ($time / $Duree- 1)) + $Sequence['offset'] - $Sequence['max'] * 0.001;	
			break;
			case 'OutExpo':
				if($time == $Duree)
					return $Sequence['offset'] + $Sequence['max'];
				else
					return $Sequence['max'] * 1.001 * (-pow(2, -10 * $time / $Duree) + 1) + $Sequence['offset'];
			break;
		}
	}
	private static function html2rgb($color){
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
	private static function rgb2html($r, $g=-1, $b=-1)	{
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
