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
    executeSql(sql: string, params?: any[], successCallback?: (transaction: SQLTransaction, resultSet: SQLResultSet) => void, errorCallback?: (transaction: SQLTransaction, error: DOMException) => void): void;
}
interface Database {
    transaction(callback: (transaction: SQLTransaction) => void, errorCallback?: (error: DOMException) => void, successCallback?: () => void): void;
}
declare var openDatabase: (name: string, version: string, displayName: string, estimatedSize: number) => Database;
declare global {
    interface Window {
        openDatabase?: typeof openDatabase;
    }
}
export declare function ActiveWebSQLPolyfill(): void;
export {};
