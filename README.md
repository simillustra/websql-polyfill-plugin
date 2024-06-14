# WebSQL Polyfill

`active-websql-polyfill` is a JavaScript/TypeScript library that provides a polyfill for WebSQL using IndexedDB. This allows you to use WebSQL-like syntax in modern browsers and mobile devices that no longer support WebSQL natively.

## Installation

You can install the `active-websql-polyfill` package via npm:

```bash
npm install active-websql-polyfill
```
## Usage
First, you need to import and initialize the polyfill in your project:

## Javascript

```
import { ActiveWebSQLPolyfill } from 'active-websql-polyfill';

ActiveWebSQLPolyfill();

const db = openDatabase('MyDatabase', '1.0', 'Test Database', 2 * 1024 * 1024);

db.transaction(function(tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS LOGS (id unique, log)', [], 
        () => console.log('Table created successfully'), 
        (tx, error) => console.error('Error creating table:', error)
    );
});

// Example INSERT
db.transaction(function(tx) {
    tx.executeSql('INSERT INTO LOGS (id, log) VALUES (?, ?)', [1, 'log message'], 
        (tx, result) => console.log('Insert successful, insertId:', result.insertId), 
        (tx, error) => console.error('Error inserting:', error)
    );
});

// Example SELECT
db.transaction(function(tx) {
    tx.executeSql('SELECT * FROM LOGS', [], 
        (tx, result) => {
            for (let i = 0; i < result.rows.length; i++) {
                console.log('Row:', result.rows.item(i));
            }
        }, 
        (tx, error) => console.error('Error selecting:', error)
    );
});

// Example UPDATE
db.transaction(function(tx) {
    tx.executeSql('UPDATE LOGS SET log = ? WHERE id = ?', ['updated log message', 1], 
        (tx, result) => console.log('Update successful, rowsAffected:', result.rowsAffected), 
        (tx, error) => console.error('Error updating:', error)
    );
});

// Example DELETE
db.transaction(function(tx) {
    tx.executeSql('DELETE FROM LOGS WHERE id = ?', [1], 
        (tx, result) => console.log('Delete successful, rowsAffected:', result.rowsAffected), 
        (tx, error) => console.error('Error deleting:', error)
    );
});
```
## TypeScript
```
import { ActiveWebSQLPolyfill } from 'active-websql-polyfill';

ActiveWebSQLPolyfill();

const db = openDatabase('MyDatabase', '1.0', 'Test Database', 2 * 1024 * 1024);

db.transaction(function(tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS LOGS (id unique, log)', [], 
        () => console.log('Table created successfully'), 
        (tx, error) => console.error('Error creating table:', error)
    );
});

// Example INSERT
db.transaction(function(tx) {
    tx.executeSql('INSERT INTO LOGS (id, log) VALUES (?, ?)', [1, 'log message'], 
        (tx, result) => console.log('Insert successful, insertId:', result.insertId), 
        (tx, error) => console.error('Error inserting:', error)
    );
});

// Example SELECT
db.transaction(function(tx) {
    tx.executeSql('SELECT * FROM LOGS', [], 
        (tx, result) => {
            for (let i = 0; i < result.rows.length; i++) {
                console.log('Row:', result.rows.item(i));
            }
        }, 
        (tx, error) => console.error('Error selecting:', error)
    );
});

// Example UPDATE
db.transaction(function(tx) {
    tx.executeSql('UPDATE LOGS SET log = ? WHERE id = ?', ['updated log message', 1], 
        (tx, result) => console.log('Update successful, rowsAffected:', result.rowsAffected), 
        (tx, error) => console.error('Error updating:', error)
    );
});

// Example DELETE
db.transaction(function(tx) {
    tx.executeSql('DELETE FROM LOGS WHERE id = ?', [1], 
        (tx, result) => console.log('Delete successful, rowsAffected:', result.rowsAffected), 
        (tx, error) => console.error('Error deleting:', error)
    );
});
```

## API
openDatabase
The openDatabase function creates a new database or opens an existing one.

Parameters:

name: The name of the database.
version: The version of the database.
displayName: The display name of the database.
estimatedSize: The estimated size of the database.
transaction
The transaction method creates a new transaction.

Parameters:

callback: The callback function to execute SQL commands.
errorCallback (optional): The callback function to handle errors.
successCallback (optional): The callback function to handle the successful completion of the transaction.
executeSql
The executeSql method executes an SQL command.

Parameters:

sql: The SQL command to execute.
args (optional): The arguments for the SQL command.
callback (optional): The callback function to handle the result set.
errorCallback (optional): The callback function to handle errors.
Contributing
Contributions are welcome! Please open an issue or submit a pull request if you have any improvements or bug fixes.

License
This project is licensed under the MIT License.# websql-polyfill-plugin
