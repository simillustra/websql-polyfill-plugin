// src/index.ts
interface SQLResultSetRowList {
    length: number;
    item(index: number): any;
}

interface SQLResultSet {
    rows: SQLResultSetRowList;
    insertId?: number;
    rowsAffected?: number;
}

interface SQLTransaction {
    executeSql(
        sql: string,
        args?: any[],
        callback?: (transaction: SQLTransaction, resultSet: SQLResultSet) => void,
        errorCallback?: (transaction: SQLTransaction, error: DOMException) => void
    ): void;
}

interface Database {
    transaction(
        callback: (transaction: SQLTransaction) => void,
        errorCallback?: (error: DOMException) => void,
        successCallback?: () => void
    ): void;
}

declare global {
    interface Window {
        openDatabase?: (
            name: string,
            version: string,
            displayName: string,
            estimatedSize: number
        ) => Database;
    }
}

export function ActiveWebSQLPolyfill() {
    if (!window.openDatabase) {
        window.openDatabase = function(name, version, displayName, estimatedSize) {
            return new WebSQLDatabase(name, version, displayName, estimatedSize);
        };

        class WebSQLDatabase implements Database {
            name: string;
            version: string;
            displayName: string;
            estimatedSize: number;
            db: IDBDatabase | null;
            dbReady: Promise<IDBDatabase>;

            constructor(name: string, version: string, displayName: string, estimatedSize: number) {
                this.name = name;
                this.version = version;
                this.displayName = displayName;
                this.estimatedSize = estimatedSize;
                this.db = null;

                this.dbReady = new Promise((resolve, reject) => {
                    const request = indexedDB.open(name, parseInt(version));
                    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                        this.db = (event.target as IDBOpenDBRequest).result;
                        if (!this.db.objectStoreNames.contains('store')) {
                            this.db.createObjectStore('store', { keyPath: 'id', autoIncrement: true });
                        }
                    };
                    request.onsuccess = (event: Event) => {
                        this.db = (event.target as IDBOpenDBRequest).result;
                        resolve(this.db);
                    };
                    request.onerror = (event: Event) => {
                        console.error('IndexedDB error:', (event.target as IDBRequest).error);
                        reject((event.target as IDBRequest).error);
                    };
                });
            }

            transaction(callback: (transaction: SQLTransaction) => void, errorCallback?: (error: DOMException) => void, successCallback?: () => void): void {
                this.dbReady.then((db) => {
                    const transaction = db.transaction(['store'], 'readwrite');
                    const sqlTransaction = new WebSQLTransaction(transaction);
                    callback(sqlTransaction);
                    transaction.oncomplete = () => {
                        if (successCallback) successCallback();
                    };
                    transaction.onerror = (event) => {
                        if (errorCallback) errorCallback((event.target as IDBRequest).error as DOMException);
                    };
                }).catch(error => {
                    if (errorCallback) errorCallback(error as DOMException);
                });
            }
        }

        class WebSQLTransaction implements SQLTransaction {
            transaction: IDBTransaction;

            constructor(transaction: IDBTransaction) {
                this.transaction = transaction;
            }

            executeSql(
                sql: string,
                params: any[] = [],
                successCallback?: (transaction: SQLTransaction, resultSet: SQLResultSet) => void,
                errorCallback?: (transaction: SQLTransaction, error: DOMException) => void
            ): void {
                const store = this.transaction.objectStore('store');

                if (sql.trim().toUpperCase().startsWith('INSERT')) {
                    const data = extractValuesFromInsert(sql, params);
                    const request = store.add(data);
                    request.onsuccess = (event: Event) => {
                        if (successCallback) {
                            const resultSet: SQLResultSet = {
                                insertId: (event.target as IDBRequest).result as number,
                                rows: { length: 0, item: () => null }
                            };
                            successCallback(this, resultSet);
                        }
                    };
                    request.onerror = (event: Event) => {
                        if (errorCallback) errorCallback(this, (event.target as IDBRequest).error as DOMException);
                    };
                } else if (sql.trim().toUpperCase().startsWith('SELECT')) {
                    const request = store.getAll();
                    request.onsuccess = (event: Event) => {
                        const allData = (event.target as IDBRequest).result;
                        const resultSet: SQLResultSet = {
                            rows: {
                                length: allData.length,
                                item: (index: number) => allData[index]
                            }
                        };
                        if (successCallback) successCallback(this, resultSet);
                    };
                    request.onerror = (event: Event) => {
                        if (errorCallback) errorCallback(this, (event.target as IDBRequest).error as DOMException);
                    };
                } else if (sql.trim().toUpperCase().startsWith('UPDATE')) {
                    const { id, updates } = extractValuesFromUpdate(sql, params);
                    if (id === null) {
                        if (errorCallback) errorCallback(this, new DOMException("ID for UPDATE cannot be null"));
                        return;
                    }
                    const request = store.get(id);
                    request.onsuccess = (event: Event) => {
                        const data = (event.target as IDBRequest).result;
                        Object.keys(updates).forEach(key => {
                            data[key] = updates[key];
                        });
                        const updateRequest = store.put(data);
                        updateRequest.onsuccess = () => {
                            if (successCallback) {
                                const resultSet: SQLResultSet = {
                                    rowsAffected: 1,
                                    rows: { length: 0, item: () => null }
                                };
                                successCallback(this, resultSet);
                            }
                        };
                        updateRequest.onerror = (event: Event) => {
                            if (errorCallback) errorCallback(this, (event.target as IDBRequest).error as DOMException);
                        };
                    };
                    request.onerror = (event: Event) => {
                        if (errorCallback) errorCallback(this, (event.target as IDBRequest).error as DOMException);
                    };
                } else if (sql.trim().toUpperCase().startsWith('DELETE')) {
                    const id = extractIdFromDelete(sql, params);
                    if (id === null) {
                        if (errorCallback) errorCallback(this, new DOMException("ID for DELETE cannot be null"));
                        return;
                    }
                    const request = store.delete(id);
                    request.onsuccess = () => {
                        if (successCallback) {
                            const resultSet: SQLResultSet = {
                                rowsAffected: 1,
                                rows: { length: 0, item: () => null }
                            };
                            successCallback(this, resultSet);
                        }
                    };
                    request.onerror = (event: Event) => {
                        if (errorCallback) errorCallback(this, (event.target as IDBRequest).error as DOMException);
                    };
                }
            }
        }

        function extractValuesFromInsert(sql: string, params: any[]): Record<string, any> {
            const values: Record<string, any> = {};
            const matches = sql.match(/INSERT INTO \w+ \(([^)]+)\) VALUES \(([^)]+)\)/i);
            if (matches) {
                const keys = matches[1].split(',').map(key => key.trim());
                keys.forEach((key, index) => {
                    values[key] = params[index];
                });
            }
            return values;
        }

        function extractValuesFromUpdate(sql: string, params: any[]): { id: number | null; updates: Record<string, any> } {
            const matches = sql.match(/UPDATE \w+ SET (.+) WHERE id = ?/i);
            const updates: Record<string, any> = {};
            if (matches) {
                const keyValuePairs = matches[1].split(',').map(pair => pair.trim().split('='));
                keyValuePairs.forEach((pair, index) => {
                    updates[pair[0].trim()] = params[index];
                });
            }
            const id = params[params.length - 1] ?? null;
            return { id, updates };
        }

        function extractIdFromDelete(sql: string, params: any[]): number | null {
            const matches = sql.match(/DELETE FROM \w+ WHERE id = ?/i);
            if (matches) {
                return params[0] ?? null;
            }
            return null;
        }
    }
}
