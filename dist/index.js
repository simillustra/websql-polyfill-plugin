"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveWebSQLPolyfill = void 0;
function ActiveWebSQLPolyfill() {
    if (!window.openDatabase) {
        window.openDatabase = function (name, version, displayName, estimatedSize) {
            return new WebSQLDatabase(name, version, displayName, estimatedSize);
        };
        class WebSQLDatabase {
            constructor(name, version, displayName, estimatedSize) {
                this.name = name;
                this.version = version;
                this.displayName = displayName;
                this.estimatedSize = estimatedSize;
                this.db = null;
                this.dbReady = new Promise((resolve, reject) => {
                    const request = indexedDB.open(name, parseInt(version));
                    request.onupgradeneeded = (event) => {
                        this.db = event.target.result;
                    };
                    request.onsuccess = (event) => {
                        this.db = event.target.result;
                        resolve(this.db);
                    };
                    request.onerror = (event) => {
                        console.error('IndexedDB error:', event.target.error);
                        reject(event.target.error);
                    };
                });
            }
            transaction(callback, errorCallback, successCallback) {
                this.dbReady.then((db) => {
                    const transaction = db.transaction(db.objectStoreNames, 'readwrite');
                    const sqlTransaction = new WebSQLTransaction(transaction);
                    callback(sqlTransaction);
                    transaction.oncomplete = () => {
                        if (successCallback)
                            successCallback();
                    };
                    transaction.onerror = (event) => {
                        if (errorCallback)
                            errorCallback(event.target.error);
                    };
                }).catch(error => {
                    if (errorCallback)
                        errorCallback(error);
                });
            }
        }
        class WebSQLTransaction {
            constructor(transaction) {
                this.transaction = transaction;
            }
            executeSql(sql, params = [], successCallback, errorCallback) {
                const storeName = extractTableName(sql);
                if (!storeName) {
                    if (errorCallback)
                        errorCallback(this, new DOMException('Invalid SQL command'));
                    return;
                }
                const store = this.transaction.objectStore(storeName);
                if (sql.trim().toUpperCase().startsWith('INSERT')) {
                    const data = extractValuesFromInsert(sql, params);
                    const request = store.add(data);
                    request.onsuccess = (event) => {
                        if (successCallback) {
                            const resultSet = {
                                insertId: event.target.result,
                                rows: { length: 0, item: () => null }
                            };
                            successCallback(this, resultSet);
                        }
                    };
                    request.onerror = (event) => {
                        if (errorCallback)
                            errorCallback(this, event.target.error);
                    };
                }
                else if (sql.trim().toUpperCase().startsWith('SELECT')) {
                    const request = store.getAll();
                    request.onsuccess = (event) => {
                        const allData = event.target.result;
                        const resultSet = {
                            rows: {
                                length: allData.length,
                                item: (index) => allData[index]
                            }
                        };
                        if (successCallback)
                            successCallback(this, resultSet);
                    };
                    request.onerror = (event) => {
                        if (errorCallback)
                            errorCallback(this, event.target.error);
                    };
                }
                else if (sql.trim().toUpperCase().startsWith('UPDATE')) {
                    const { id, updates } = extractValuesFromUpdate(sql, params);
                    if (id === null) {
                        if (errorCallback)
                            errorCallback(this, new DOMException("ID for UPDATE cannot be null"));
                        return;
                    }
                    const request = store.get(id);
                    request.onsuccess = (event) => {
                        const data = event.target.result;
                        Object.keys(updates).forEach(key => {
                            data[key] = updates[key];
                        });
                        const updateRequest = store.put(data);
                        updateRequest.onsuccess = () => {
                            if (successCallback) {
                                const resultSet = {
                                    rowsAffected: 1,
                                    rows: { length: 0, item: () => null }
                                };
                                successCallback(this, resultSet);
                            }
                        };
                        updateRequest.onerror = (event) => {
                            if (errorCallback)
                                errorCallback(this, event.target.error);
                        };
                    };
                    request.onerror = (event) => {
                        if (errorCallback)
                            errorCallback(this, event.target.error);
                    };
                }
                else if (sql.trim().toUpperCase().startsWith('DELETE')) {
                    const id = extractIdFromDelete(sql, params);
                    if (id === null) {
                        if (errorCallback)
                            errorCallback(this, new DOMException("ID for DELETE cannot be null"));
                        return;
                    }
                    const request = store.delete(id);
                    request.onsuccess = () => {
                        if (successCallback) {
                            const resultSet = {
                                rowsAffected: 1,
                                rows: { length: 0, item: () => null }
                            };
                            successCallback(this, resultSet);
                        }
                    };
                    request.onerror = (event) => {
                        if (errorCallback)
                            errorCallback(this, event.target.error);
                    };
                }
            }
        }
        function extractTableName(sql) {
            const matches = sql.match(/FROM\s+(\w+)/i) || sql.match(/INTO\s+(\w+)/i);
            return matches ? matches[1] : null;
        }
        function extractValuesFromInsert(sql, params) {
            const values = {};
            const matches = sql.match(/INSERT INTO \w+ \(([^)]+)\) VALUES \(([^)]+)\)/i);
            if (matches) {
                const keys = matches[1].split(',').map(key => key.trim());
                keys.forEach((key, index) => {
                    values[key] = params[index];
                });
            }
            return values;
        }
        function extractValuesFromUpdate(sql, params) {
            const updates = {};
            let id = null;
            const matches = sql.match(/UPDATE \w+ SET ([^ ]+) WHERE id = ?/i);
            if (matches) {
                const assignments = matches[1].split(',').map(assign => assign.trim());
                assignments.forEach((assignment, index) => {
                    const [key, value] = assignment.split('=').map(part => part.trim());
                    updates[key] = params[index];
                });
                id = params[assignments.length];
            }
            return { id, updates };
        }
        function extractIdFromDelete(sql, params) {
            const matches = sql.match(/DELETE FROM \w+ WHERE id = ?/i);
            if (matches) {
                return params[0];
            }
            return null;
        }
    }
}
exports.ActiveWebSQLPolyfill = ActiveWebSQLPolyfill;
