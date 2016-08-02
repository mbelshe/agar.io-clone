"use strict";

import Config from '../config.json';
import Util from './lib/util';
import GameObject from './gameObject';

class HomeBase extends GameObject {
	static addHomeBase() {
			const mass = (Util.randomInRange(Config.virus.defaultMass.from, Config.virus.defaultMass.to, true)) * 2;
    		const radius = Util.massToRadius(mass);
    		const position = Util.uniformPosition(Config.gameBoard.objects, radius);
    		new HomeBase(position.x, position.y, radius);
	};

	constructor(x, y, radius) {
		super('H1');
		this.type = "homeBase";
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.fill = Config.homeBase.fill;
	//	this.stroke = ;
	//	this.strokeWidth = ;
		Config.gameBoard.insert(this);
	}




};
export default HomeBase;