// MODULE
const mysql = require('mysql2');

class PoolInctance {

	static instances = {};

	static get(host, db, user, pass) {
		
		const props =  [host, db, user];
		const lastIndex = props.length - 1;
		let instances = this.instances;
		
		for (let i = 0; i < props.length; i++) {
			let p = props[i];
			// погружение на уровень.
			if (p in instances) {
				if (i == lastIndex) {
					return instances[p];
				} 
				instances = instances[p];
			// иначе создание нового уровня.
			} else {
				if (i == lastIndex) {
					
					const connectionOptions = {
						database: db,
						user: user,
						password: pass,
						host: host,
						waitForConnections: true,
						connectionLimit: 20,
						queueLimit: 0
					};
					
					return instances[p] = mysql.createPool(connectionOptions);
				}
				instances = instances[p] = {};
			}
		}
	}
}

module.exports = PoolInctance;