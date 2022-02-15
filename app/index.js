const fs = require('fs');
const credentials = require('./.credentials.json');
const DataFileInfo = require('./DataFileInfo');
const PoolInctance = require('./PoolInctance');

// ---- программа ---
try {
	const jsonText = fs.readFileSync( credentials.configFile, "utf-8");
	const infoSet = JSON.parse(jsonText);
	const fileinfo = [];
	for (let dbinfo of infoSet) {
		
		let pool = PoolInctance.get(dbinfo.host, dbinfo.database, dbinfo.user, dbinfo.pass);
		
		for (let tableset of dbinfo.tables) {
			for (let fileset of tableset.files) {
				fileinfo.push( 
					new DataFileInfo(pool, tableset.tablename, 
						fileset.filename, fileset.startrow, fileset.columns)
				);
			}
		}
	}
	fileinfo.forEach(f => f.insert());
} catch (err) {
	console.error("Ошибка!", err);
}
// --- *** ---