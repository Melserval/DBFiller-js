const readline = require('readline');
const fs = require('fs');


/**
 * 
 * @param {string} table table name
 * @param {string} file file name
 * @param {number} start start inder of row csv
 * @param {object} columns field name for cell numbers
 * @param {object} co connect options
 */
function DataFileInfo(pool, table, file, start, columns, co) {
	this.pool = pool;
	this.tableName = table;
	this.fileName = file;
	this.startRow = start;
	this.fieldNames = Object.keys(columns);
	this.columnNumbers = Object.values(columns);
	this.connectionOptions = co;
	this.queryPattern = `INSERT INTO ${this.tableName} (${this.fieldNames.join(",")}) VALUES ?`;
}

DataFileInfo.prototype.insert = function() {
	
	let pool = this.pool;

	new Promise((resolve, reject) => {
		pool.query("SHOW TABLES", (err, results, fields) => {
			if (err) {
				reject(err);
			} else {
				results.some(item => (Object.values(item).indexOf(this.tableName) !== - 1)) 
					? resolve(`Таблица ${this.tableName} в порядке, Sir!`)
					: reject(`Sir! Таблица с именем ${this.tableName} не обнаружена!`);
			}
		});
	})
	.then(result => new Promise((resolve, reject) => {
		console.log(result);
		pool.query(`SHOW COLUMNS FROM ${this.tableName}`, (err, results, fields) => {
			if (err) {
				reject(err);
			} else {
				const tableFields = results.map(item => item["Field"]);
				for (let field of this.fieldNames) {
					if (! tableFields.includes(field)) {
						reject(`Sir! Поле с именем ${field} не обнаружено!`);
						return;
					}
				}
				resolve(`Поля [${this.fieldNames}] в порядке, Sir!`);
			}	
		});
	}))
	.then(result => new Promise((resolve, reject) => {
		console.log(result);
		if (!fs.existsSync(this.fileName)) {
			return reject(new Error(`Ошибка открытия файла - ${this.fileName}\n`));
		}
		console.log(`Приступаю к чтению файла ${this.fileName.match("[a-z0-9_\\-\\.]+$")?.[0]}...`);
		
		const BUFFER_SIZE = 750;
		let rowcount = 0;
		let bufferFill = 0;
		let dataset = [];
		let dataslice;

		const readableStream = fs.createReadStream(this.fileName, "utf-8");


		const rl  = readline.createInterface({
			input: fs.createReadStream(this.fileName, 'utf-8'),
			output: null
		});
		rl.on("line", strline => {
			rowcount++;
			if (rowcount < this.startRow) {
				return;
			}
			dataslice = this.columnNumbers.map(function(e) {return this[e]}, strline.split(","));
			dataset.push(dataslice);
			bufferFill++;
			if (bufferFill == BUFFER_SIZE) {
				pool.query(this.queryPattern, [dataset.slice()], err => (err) ? reject(err) : null);
				dataset.length = 0;
				bufferFill = 0;
			}
		});
		rl.on("close", () => {
			const inserted = rowcount - this.startRow + 1;
			if (bufferFill > 0 && dataset.length > 0) {
				pool.query(this.queryPattern, [dataset.slice()], err => (err) ? reject(err) : resolve(inserted));
			} else {
				resolve(inserted);
			}
		});
	}))
	.then(rowcount => {
		console.log(`считано строк: ${rowcount}.\nЗавершено успешно!`);
	}, err => {
		console.log(`=== Незавершено ===`);
		console.error(err);
	})
	.finally(() => pool.end());
};

module.exports = DataFileInfo;
