"use strict";

import Config from '../config.json';
import Util from './lib/util';
import GameObject from './gameObject';

var virusCount = 0; 

class Virus extends GameObject {
	static get count() {
    return virusCount;
    };

    static addVirus(virusToAdd) {
    	while(virusToAdd--) {
        const mass = Util.randomInRange(Config.virus.defaultMass.from, Config.virus.defaultMass.to, true);
    		const radius = Util.massToRadius(mass);
    		const position = Util.uniformPosition(Config.gameBoard.objects, radius);
    		new Virus(position.x, position.y, mass, radius);
    	}
    };

	constructor(x, y, mass, radius) {
		super('V' + virusCount++);
		this.type = 'virus';
		this.x = x;
		this.y = y;
		this.mass = mass;
		this.radius = radius;
		this.fill = Config.virus.fill;
		this.stroke = Config.virus.stroke;
		this.strokeWidth = Config.virus.strokeWidth;
		Config.gameBoard.insert(this);
	}

  	toJSON() {
    return {
      type: this.type,
      radius: this.radius,
      mass: this.mass,
      x: this.x,
      y: this.y,
      fill: this.fill,
      stroke: this.stroke,
      strokeWidth: this.strokeWidth,
    };
  }
};
export default Virus;