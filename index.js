const fs = require('fs');
const convert = require('xml-js');
const protobuf = require('protobufjs');

// 1. Charger la définition Protobuf
const root = protobuf.loadSync('employee.proto');
const EmployeeList = root.lookupType('Employees');

// 2. Création des données (3 employés)
const employees = [];
employees.push({ id: 1, name: 'Ali', salary: 9000 });
employees.push({ id: 2, name: 'Kamal', salary: 22000 });
employees.push({ id: 3, name: 'Amal', salary: 23000 });

// Objet racine
let jsonObject = {
  employee: employees
};

console.log("--- DÉBUT DES TESTS DE PERFORMANCE ---\n");

// ==========================================
// 1. TEST JSON
// ==========================================
// ---------- JSON : encodage ----------
console.time('JSON encode');
let jsonData = JSON.stringify(jsonObject);
console.timeEnd('JSON encode');

// ---------- JSON : décodage ----------
console.time('JSON decode');
let jsonDecoded = JSON.parse(jsonData);
console.timeEnd('JSON decode');

console.log(""); // Saut de ligne pour la lisibilité

// ==========================================
// 2. TEST XML
// ==========================================
const options = { compact: true, ignoreComment: true, spaces: 0 };

// ---------- XML : encodage ----------
console.time('XML encode');
let xmlData = "<root>\n" + convert.json2xml(jsonObject, options) + "\n</root>";
console.timeEnd('XML encode');

// ---------- XML : décodage ----------
console.time('XML decode');
let xmlJson = convert.xml2json(xmlData, { compact: true });
let xmlDecoded = JSON.parse(xmlJson);
console.timeEnd('XML decode');

console.log("");

// ==========================================
// 3. TEST PROTOBUF
// ==========================================
// Vérification préalable (hors chrono)
let errMsg = EmployeeList.verify(jsonObject);
if (errMsg) throw Error(errMsg);

// ---------- Protobuf : encodage ----------
console.time('Protobuf encode');
let message = EmployeeList.create(jsonObject);
let buffer = EmployeeList.encode(message).finish();
console.timeEnd('Protobuf encode');

// ---------- Protobuf : décodage ----------
console.time('Protobuf decode');
let decodedMessage = EmployeeList.decode(buffer);
// Conversion optionnelle pour manipuler l'objet comme du JS classique
let protoDecoded = EmployeeList.toObject(decodedMessage);
console.timeEnd('Protobuf decode');

console.log("\n--- ÉCRITURE DES FICHIERS ---");

// 4. Écriture des fichiers sur le disque
fs.writeFileSync('data.json', jsonData);
fs.writeFileSync('data.xml', xmlData);
fs.writeFileSync('data.bin', buffer); // On utilise .bin pour le binaire

// 5. Comparaison des tailles
const jsonSize = fs.statSync('data.json').size;
const xmlSize = fs.statSync('data.xml').size;
const binSize = fs.statSync('data.bin').size;

console.log(`Taille JSON     : ${jsonSize} octets`);
console.log(`Taille XML      : ${xmlSize} octets`);
console.log(`Taille Protobuf : ${binSize} octets`);