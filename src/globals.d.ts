// src/globals.d.ts
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

interface Window {
    openDatabase?: (
        name: string,
        version: string,
        displayName: string,
        estimatedSize: number
    ) => Database;
}

declare var openDatabase: (
    name: string,
    version: string,
    displayName: string,
    estimatedSize: number
) => Database;
