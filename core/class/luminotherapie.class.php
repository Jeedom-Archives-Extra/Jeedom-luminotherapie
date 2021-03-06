<?php
require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
class luminotherapie extends eqLogic {
	public static function deamon_info() {
		$return = array();
		$return['log'] = 'luminotherapie';
		$return['launchable'] = 'ok';
		$return['state'] = 'nok';
		foreach(eqLogic::byType('luminotherapie') as $luminotherapie){
			$cron = cron::byClassAndFunction('luminotherapie', 'SimulDemon',array('id' => $luminotherapie->getId()));
			if(is_object($cron) && $cron->running())
				$return['state'] = 'ok';
		}
		return $return;
	}
	public static function deamon_start($_debug = false) {
		self::deamon_stop();
		$deamon_info = self::deamon_info();
		if ($deamon_info['launchable'] != 'ok') 
			return;
		if ($deamon_info['state'] == 'ok') 
			return;
		foreach(eqLogic::byType('luminotherapie') as $luminotherapie){
			$luminotherapie->CreateDemon();
		}
		
	}
	public static function deamon_stop() {	
		foreach(eqLogic::byType('luminotherapie') as $luminotherapie){
			$cron = cron::byClassAndFunction('luminotherapie', 'SimulDemon',array('id' => $luminotherapie->getId()));
			if(is_object($cron)){
				$cron->stop();
				$cron->remove();
			}
		}
	}
	public function postSave() {
		$this->AddCommande('Démarrage','start',"action", 'other',1);
		$this->AddCommande('Arret','stop',"action", 'other',1);
		$this->AddCommande('Simulation en cours','startSimu',"info", 'binary',1);
		$this->AddCommande('Temps de simulation ecoulé','tpsSimu',"info", 'numeric',1);
		$this->CreateDemon();
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
	public function CreateDemon(){
		$cron = cron::byClassAndFunction('luminotherapie', 'SimulDemon',array('id' => $this->getId()));
		if (!is_object($cron)) {
			$cron = new cron();
			$cron->setClass('luminotherapie');
			$cron->setFunction('SimulDemon');
			$cron->setDeamon(1);
			$cron->setOption(array('id' => $this->getId()));
			$cron->setEnable(1);
			$cron->setSchedule('* * * * * *');
			$cron->save();
		}
		$cron->start();
		$cron->run();
	}
	public static function SimulDemon($_option){
		$luminotherapie=eqLogic::byId($_option['id']);
		if(is_object($luminotherapie)){
			while(true){
				$cache = cache::byKey('luminotherapie::'.$luminotherapie->getId());
				if(is_object($cache) && $cache->getValue(false)){
					$luminotherapie->checkAndUpdateCmd('startSimu',1);
					log::add('luminotherapie','info',$luminotherapie->getHumanName().' Lancement de la simulation');
					$cmdSlide=cmd::byId(str_replace('#','',$luminotherapie->getConfiguration('DawnSimulatorCmd')));
					$cmdRGB=cmd::byId(str_replace('#','',$luminotherapie->getConfiguration('DawnSimulatorColorCmd')));
					if(is_object($cmdSlide))
						log::add('luminotherapie','info',$luminotherapie->getHumanName().' Mise a jours automatique de '.$cmdSlide->getHumanName());
					if(is_object($cmdRGB))
						log::add('luminotherapie','info',$luminotherapie->getHumanName().' Mise a jours automatique de '.$cmdRGB->getHumanName());
					$Ambiance=self::Sequences(json_decode(file_get_contents(dirname(__FILE__) . '/../../core/config/ambiance/'.$luminotherapie->getConfiguration('ambiance').'.json'), true));
					for($time=0;$time<=count($Ambiance['Luminosite']);$time++){
						$luminotherapie->checkAndUpdateCmd('tpsSimu',$time);
						$cache = cache::byKey('luminotherapie::'.$luminotherapie->getId());
						if(!is_object($cache) || !$cache->getValue(false))
							break;
						if($luminotherapie->getConfiguration('repeat') && $time==count($Ambiance['Luminosite']))
							   $time=0;
						if($time==count($Ambiance['Luminosite']))
							continue;
						if(is_object($cmdSlide)){
							log::add('luminotherapie','debug',$luminotherapie->getHumanName().' Valeur de l\'intensité lumineuse : ' .$Ambiance['Luminosite'][$time]);
							$cmdSlide->execCmd(array('slider'=>$Ambiance['Luminosite'][$time]));
						}
						if(is_object($cmdRGB)){
							log::add('luminotherapie','debug',$luminotherapie->getHumanName().' Valeur de la couleur : ' .$Ambiance['Couleur'][$time]);
							$cmdRGB->execCmd(array('color'=>$Ambiance['Couleur'][$time]));
						}
						$cache = cache::byKey('luminotherapie::'.$luminotherapie->getId());
						if(!is_object($cache) || !$cache->getValue(false))
							break;
						switch($luminotherapie->getConfiguration('temps')){
							case 'sec':
								sleep(1);
							break;
							case 'min':
								sleep(60);
							break;
							case 'heure':
								sleep(60*60);
							break;
						}
					}
					log::add('luminotherapie','info',$luminotherapie->getHumanName().' Fin de la simulation');
					cache::set('luminotherapie::'.$luminotherapie->getId(), false, 0);
				}
				$luminotherapie->checkAndUpdateCmd('tpsSimu',0);
				$luminotherapie->checkAndUpdateCmd('startSimu',0);
				sleep(config::byKey('waitDemon','luminotherapie'));
			}
		}
	}
	public static function Sequences($ambiance) {
		$Value=null;	
		foreach($ambiance as $key => $Sequences){	
			if(count($Sequences) >0){
				$Step=null;
				foreach($Sequences as $Sequence){
					if(!$Sequence['enable'])
						continue;
					if($key == 'Luminosite'){
						for($time=1; $time <= $Sequence['duree'];$time++){
							if(count($Value[$key])==0)
								$time=0;
							$Value[$key][]= ceil(self::equation($Sequence['duree'],$Sequence['lum'], $time, end($Value)));
						}
					}elseif($key == 'Couleur'){
						for($time=1; $time <= $Sequence['duree'];$time++){
							if(count($Value[$key])==0)
								$time=0;
							if($ambiance['Configuration']['Couleur']['hsl']){
								$Hue= ceil(self::equation($Sequence['duree'],$Sequence['Hue'], $time, end($Value)));
								$Lightness= ceil(self::equation($Sequence['duree'],$Sequence['Lightness'], $time, end($Value)));
								$Saturation= ceil(self::equation($Sequence['duree'],$Sequence['Saturation'], $time, end($Value)));
								$Value[$key][]=self::hsl2html(array($Hue,$Saturation,$Lightness));
							}else{
								$R= ceil(self::equation($Sequence['duree'],$Sequence['R'], $time, end($Value)));
								$G= ceil(self::equation($Sequence['duree'],$Sequence['G'], $time, end($Value)));
								$B= ceil(self::equation($Sequence['duree'],$Sequence['B'], $time, end($Value)));
								$Value[$key][]=self::rgb2html($R, $G, $B);
							}
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
			case 'rampe':
				return $time * $Sequence['pente'] + $Sequence['offset'];
			case 'sin':
				if($Sequence['periode'] == '')
					$Sequence['periode']=1;
				return $Sequence['amplitude'] * sin(2*pi()*$time/$Sequence['periode'])+$Sequence['offset'];
			case 'carre':
				$time=$time-$Sequence['periode']*floor($time/$Sequence['periode']);
				if($time-$Sequence['periode'] * ($Sequence['dutty'] / 100) >= 0)
					return $Sequence['offset']+$Sequence['amplitude'];
			    	else
				  	return $Sequence['offset'];
			case 'InQuad':
				$time = $time / $Duree;
				return $Sequence['max'] * pow($time, 2) + $Sequence['offset'];
			case 'InOutQuad':
				$time = $time / $Duree * 2;
				if ($time < 1)
					return $Sequence['max'] / 2 * pow($time, 2) + $Sequence['offset'];
				else
					return -$Sequence['max'] / 2 * (($time - 1) * ($time - 3) - 1) + $Sequence['offset'];
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
			case 'InExpo':
				if($time == 0)
					return $Sequence['offset'];
				else
					return $Sequence['max'] * pow(2, 10 * ($time / $Duree- 1)) + $Sequence['offset'] - $Sequence['max'] * 0.001;	
			case 'OutExpo':
				if($time == $Duree)
					return $Sequence['offset'] + $Sequence['max'];
				else
					return $Sequence['max'] * 1.001 * (-pow(2, -10 * $time / $Duree) + 1) + $Sequence['offset'];
		}
	}
	private static function hsl2rgb($hsl) {
      	log::add('luminotherapie','info',json_encode($hsl));
		list($h, $s, $l) = $hsl;
		$h /= 360;
		$s /=100;
		$l /=100;

		$r = $l;
		$g = $l;
		$b = $l;
		$v = ($l <= 0.5) ? ($l * (1.0 + $s)) : ($l + $s - $l * $s);
		if ($v > 0){
			$m;
			$sv;
			$sextant;
			$fract;
			$vsf;
			$mid1;
			$mid2;

			$m = $l + $l - $v;
			$sv = ($v - $m ) / $v;
			$h *= 6.0;
			$sextant = floor($h);
			$fract = $h - $sextant;
			$vsf = $v * $sv * $fract;
			$mid1 = $m + $vsf;
			$mid2 = $v - $vsf;

			switch ($sextant){
				case 0:
					$r = $v;
					$g = $mid1;
					$b = $m;
				break;
				case 1:
					$r = $mid2;
					$g = $v;
					$b = $m;
				break;
				case 2:
					$r = $m;
					$g = $v;
					$b = $mid1;
				break;
				case 3:
					$r = $m;
					$g = $mid2;
					$b = $v;
				break;
				case 4:
					$r = $mid1;
					$g = $m;
					$b = $v;
				break;
				case 5:
					$r = $v;
					$g = $m;
					$b = $mid2;
				break;
			}
		}
		$r = round($r * 255, 0);
		$g = round($g * 255, 0);
		$b = round($b * 255, 0);
		return array($r,$g,$b);
	}
	private static function hsl2html($hsl) {
		$rgb = self::hsl2rgb($hsl);
		return self::rgb2html($rgb);
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
				cache::set('luminotherapie::'.$this->getEqLogic()->getId(), true, 0);
			break;
			case 'stop':
				cache::set('luminotherapie::'.$this->getEqLogic()->getId(), false, 0);
			break;
				
		}	
	}
}
?>
