/*jslint browser: true, devel: true, nomen: true */

var AGStorage = (function () {
    'use strict';
    
    /**
     * The data in the [storage]{@link AGStorage#storage} is changed whenever a record is added, edited, or removed. 
     * The [dataChanged]{@link AGStorage#dataChanged} method might be used any time this happens to refresh any component that is using the data.
     * @access public
     * @callback AGStorage~dataChangedCallback
     */
    
    /**
     * Creates a new instance of class AGStorage.
     * @access public
     * @constructs AGStorage
     * @param {Storage} storageObject - Either sessionStorage or localStorage objects.
     * @param {string} storageId - The unique ID used as the key in which all record data are stored in the storageObject.
     * @param {AGStorage~dataChangedCallback=} dataChanged - The callback that handles the data in storage changed.
     */
    function AGStorage(storageObject, storageId, dataChanged) {
        // pre-condition
        console.assert(storageObject instanceof Storage, 'storageObject should be Storage');
        console.assert(typeof storageId === 'string', 'storageId should be string');
        if (dataChanged) {
            console.assert(typeof dataChanged === 'function', 'dataChanged should be function');
        }

        /** 
         * Provides access to a list of key/value pairs, which are sometimes called items. 
         * Keys are strings. Any string (including the empty string) is a valid key. 
         * Values are similarly strings.
         * @access private
         * @member {Storage} 
         */
        this.storage = storageObject;
        
        /** 
         * The unique ID used as the key in which all record data are stored in the [storage]{@link AGStorage#storage}.
         * @access private
         * @member {string} 
         */
        this.id = storageId;
        
        /** 
         * The callback that handles the data in [storage]{@link AGStorage#storage} changed.
         * @access public
         * @member {AGStorage~dataChangedCallback} 
         */
        this.dataChanged = dataChanged;
    }
    
    /**
     * When passed a key name and value, will add that key to the [storage]{@link AGStorage#storage}, or update that key's value if it already exists.
     * @access protected
     * @memberof AGStorage
     * @method
     * @param {string} key - A string containing the name of the key you want to create/update.
     * @param {*} value - The value you want to give the key you are creating/updating.
     * @returns No return value.
     */
    AGStorage.prototype._setItem = function (key, value) {
        // pre-condition
        console.assert(typeof key === 'string', 'key should be string');
        
        this.storage.setItem(key, JSON.stringify(value));
    };

    /**
     * When passed a key name, will return that key's value.
     * @access protected
     * @memberof AGStorage
     * @method
     * @param {string} key - A string containing the name of the key you want to retrieve the value of.
     * @returns {*} The value of the key. If the key does not exist, null is returned.
     */
    AGStorage.prototype._getItem = function (key) {
        // pre-condition
        console.assert(typeof key === 'string', 'key should be string');
        
        var value = this.storage.getItem(key);
        return value ? JSON.parse(value) : null;
    };

    /**
     * When passed a key name, will remove that key from the storage.
     * @access protected
     * @memberof AGStorage
     * @method
     * @param {string} key - A string containing the name of the key you want to remove.
     * @returns No return value.
     */
    AGStorage.prototype._removeItem = function (key) {
        // pre-condition
        console.assert(typeof key === 'string', 'key should be string');
        
        this.storage.removeItem(key);
    };

    /**
     * Name of counter to get.
     * @access protected
     * @memberof AGStorage
     * @method
     */
    AGStorage.prototype._getRecordCounterKey = function () {
        return this.id + "-counter";
    };

    /**
     * Returns the value of a counter.
     * @access protected
     * @memberof AGStorage
     * @method
     * @returns {number} Value of counter.
     */
    AGStorage.prototype._getRecordCounterValue = function () {
        var counter = this._getItem(this._getRecordCounterKey());
        if (counter) {
            return parseInt(counter, 10);
        } else {
            return 0;
        }
    };

    /**
     * Increments the value of the counter. The increment value is 1.
     * @access protected
     * @memberof AGStorage
     * @method
     * @returns {number} Incremented value of counter.
     */
    AGStorage.prototype._incRecordCounterValue = function () {
        var newCounterValue = this._getRecordCounterValue() + 1;
        this._setItem(this._getRecordCounterKey(), newCounterValue);
        return newCounterValue;
    };

    /**
     * Returns the entire array of record IDs managed by this instance of AGStorage.
     * @access public
     * @memberof AGStorage
     * @method
     * @returns {string[]} Array of record IDs.
     */
    AGStorage.prototype.getAllRecordIds = function () {
        var allRecordIds = this._getItem(this.id);
        return allRecordIds || [];
    };

    /**
     * Add a record id to the array of record IDs managed by this instance of AGStorage.
     * @access protected
     * @memberof AGStorage
     * @method
     * @returns No return value.
     */
    AGStorage.prototype._addRecordId = function (recordId) {
        // pre-condition
        console.assert(typeof recordId === 'string', 'recordId should be string');
        
        var allRecordIds = this.getAllRecordIds();
        allRecordIds.push(recordId);
        this._setItem(this.id, allRecordIds);
    };

    /**
     * Remove a record id from the array of record IDs managed by this instance of AGStorage.
     * @access protected
     * @memberof AGStorage
     * @method
     * @param {string} recordId - The ID of the record to remove.
     * @returns No return value.
     */
    AGStorage.prototype._removeRecordId = function (recordId) {
        // pre-condition
        console.assert(typeof recordId === 'string', 'recordId should be string');
        
        var allRecordIds = this.getAllRecordIds(),
            recordIndex = allRecordIds.indexOf(recordId);
        if (recordIndex > -1) {
            allRecordIds.splice(recordIndex, 1);
            this._setItem(this.id, allRecordIds);
        }
    };

    /**
     * The getRecordKeyById method returns a unique record key, which identifier is passed by the recordId input parameter.
     * @access protected
     * @memberof AGStorage
     * @method
     * @param {string} recordId - A record identifier.
     */
    AGStorage.prototype._getRecordKeyById = function (recordId) {
        // pre-condition
        console.assert(typeof recordId === 'string', 'recordId should be string');
        
        return this.id + "-" + recordId;
    };

    /**
     * Create a record in the [storage]{@link AGStorage#storage}.
     * @access public
     * @memberof AGStorage
     * @method
     * @param {Object} record - The content of the created record.
     * @returns {Object} The created record with "id" field initialized.
     */
    AGStorage.prototype.createRecord = function (record) {
        // pre-condition
        console.assert(typeof record === 'object', 'record should be object');
        
        var newRecord = JSON.parse(JSON.stringify(record));
        newRecord.id = this._incRecordCounterValue().toString();
        this._setItem(this._getRecordKeyById(newRecord.id), newRecord);
        this._addRecordId(newRecord.id);
        if (this.dataChanged) { this.dataChanged(); }
        return newRecord;
    };

    /**
     * Update the record data.
     * To update an existing record, make sure you set the "id" field in the record object.
     * @access public
     * @memberof AGStorage
     * @method
     * @param {Object} record - Specifies the new content for the record.
     * @returns No return value.
     */
    AGStorage.prototype.updateRecord = function (record) {
        this._setItem(this._getRecordKeyById(record.id), record);
        if (this.dataChanged) { this.dataChanged(); }
    };

    /**
     * Retrieves a record object from a [storage]{@link AGStorage#storage}.
     * @access public
     * @memberof AGStorage
     * @method
     * @param {string} recordId - The ID of the record to retrieve from the [storage]{@link AGStorage#storage}.
     * @returns {Object|boolean} The record with the passed ID. Returns false if not found.
     */
    AGStorage.prototype.getRecordById = function (recordId) {
        // pre-condition
        console.assert(typeof recordId === 'string', 'recordId should be string');
        
        var record = this._getItem(this._getRecordKeyById(recordId));
        return record || false;
    };

    /**
     * Gets the record by the record index.
     * @access public
     * @memberof AGStorage
     * @method
     * @param {number} recordIndex - A value that specifies the index position of the record in the [storage]{@link AGStorage#storage}.
     * @returns {Object|boolean} A record object that has the specified index value. Returns false if not found.
     */
    AGStorage.prototype.getRecordByIndex = function (recordIndex) {
        // pre-condition
        console.assert(typeof recordIndex === 'number', 'recordIndex should be number');
        
        var allRecordIds = this.getAllRecordIds(),
            recordId = allRecordIds[recordIndex],
            record = this._getItem(this._getRecordKeyById(recordId));
        return record || false;
    };

    /**
     * Function to execute for each record. 
     * @access public
     * @callback AGStorage~forEachRecordCallback
     * @param {Object} record - The current record being processed in the [storage]{@link AGStorage#storage}.
     * @param {number} recordIndex - The index of the current record being processed in the [storage]{@link AGStorage#storage}.
     */
    
    /**
     * The forEachRecord() method calls a provided function once for each record, in order.
     * @access public
     * @memberof AGStorage
     * @method     
     * @param {AGStorage~forEachRecordCallback} callback - A function to be run for each record.
     * @param {number} [startIndex=0] - The index to start iterating at.
     * @returns No return value.
     */
    AGStorage.prototype.forEachRecord = function (callback, startIndex) {
        console.assert(typeof callback === 'function', 'callback should be function');
        
        var allRecordIds = this.getAllRecordIds(),
            recordIndex,
            record;
        
        startIndex = typeof startIndex !== 'undefined' ? startIndex : 0;
        
        for (recordIndex = startIndex; recordIndex < allRecordIds.length; recordIndex += 1) {
            record = this.getRecordById(allRecordIds[recordIndex]);
            if (callback.bind(this)(record, recordIndex)) {
                break;
            }
        }
    };

    /**
     * Gets all records associated with this instance of AGStorage.
     * @access public
     * @memberof AGStorage
     * @method
     * @returns {Object[]} The array of record objects.
     */
    AGStorage.prototype.getAllRecords = function () {
        var allRecords = [];
        this.forEachRecord(function (record) {
            allRecords.push(record);
        });
        return allRecords;
    };

    /**
     * Finds the index of the first matching record in this store by a specific field value.
     * @access public
     * @memberof AGStorage
     * @method
     * @param {string} property - The name of the record field to test.
     * @param {string|RegExp} value - Either a string that the field value should begin with, or a RegExp to test against the field.
     * @param {number} [startIndex=0] - The index to start searching at.
     * @returns {number} The matched index or -1.
     */
    AGStorage.prototype.find = function (property, value, startIndex) {
        var foundRecordIndex = -1;
        this.forEachRecord(function (record, recordIndex) {
            if (record.hasOwnProperty(property)
                    && JSON.stringify(record[property]).match(value)) {
                foundRecordIndex = recordIndex;
                return true;
            }
        }, startIndex);
        return foundRecordIndex;
    };
    
    /**
     * Function to execute on each record in this store.
     * @access public
     * @callback AGStorage~findByCallback
     * @param {Object} record - The record to test for filtering.
     * @param {number} recordIndex - The index of the record passed.
     */
    
    /**
     * Find the index of the first matching record in this store by a function. 
     * If the function returns true it is considered a match.
     * @access public
     * @memberof AGStorage
     * @method
     * @param {AGStorage~findByCallback} fn - The function to be called.
     * @param {number} [startIndex=0] - The index to start searching at.
     * @returns {number} The matched index or -1.
     */
    AGStorage.prototype.findBy = function (fn, startIndex) {
        console.assert(typeof fn === 'function', 'fn should be function');
        
        var foundRecordIndex = -1;
        this.forEachRecord(function (record, recordIndex) {
            if (fn(record, recordIndex)) {
                foundRecordIndex = recordIndex;
                return true;
            }
        }, startIndex);
        return foundRecordIndex;
    };

    /**
     * The deleteRecordById method deletes a record that is stored within a [storage]{@link AGStorage#storage}.
     * @access public
     * @memberof AGStorage
     * @method
     * @param {string} recordId - A string that specifies the ID. The argument should be the value of the "id" property of the record definition that you want to delete.
     * @returns No return value.
     */
    AGStorage.prototype.deleteRecordById = function (recordId) {
        // pre-condition
        console.assert(typeof recordId === 'string', 'recordId should be string');
        
        this._removeItem(this._getRecordKeyById(recordId));
        this._removeRecordId(recordId);
        if (this.dataChanged) { this.dataChanged(); }
    };

    /**
     * @typedef DhtmlxGridJsonDataStructure     
     * @type Object
     * @property {DhtmlxGridRowJsonDataStructure[]} rows - Array which contains an object for each of the record rows.
     * @property {number} total_count - This is optional, but when using large data sets with any type of paging, DHTMLX utilizes this property. Additionally, this can be used to display the number of records in a status bar at the bottom of a grid.
     */
    
    /**
     * The getDhtmlxGrid method will return the formatted object to be loaded into the DHTMLX grid.
     * @access public
     * @memberof AGStorage
     * @method
     * @returns {DhtmlxGridJsonDataStructure} An object containing the values for the dhtmlxGrid.
     */
    AGStorage.prototype.getDhtmlxGrid = function (columnKeys) {
        var row, rows = [];
        this.forEachRecord(function (record) {
            row = this.getDhtmlxGridRowByRecordId(record.id, columnKeys);
            rows.push(row);
        });
        return {
            "rows" : rows,
            "total_count" : rows.length
        };
    };
    
    /**
     * @typedef DhtmlxGridRowJsonDataStructure
     * @type Object
     * @property {string} id - The ID needs to be unique or the grid will not operate correctly.
     * @property {Array} data - This is an array of data for each column. The placement in the array corresponds to the column it will show in.
     */

    /**
     * The getDhtmlxGridRowByRecordId method is exactly that. 
     * This will structure a record object into a formatted row item for use in the grid data.
     * @access public
     * @memberof AGStorage
     * @method
     * @returns {DhtmlxGridRowJsonDataStructure} An object for record row.
     */
    AGStorage.prototype.getDhtmlxGridRowByRecordId = function (recordId, columnKeys) {
        // pre-condition
        console.assert(typeof recordId === 'string', 'recordId should be string');
        
        var record = this.getRecordById(recordId), data = [];
        if (typeof columnKeys === "undefined") {
            columnKeys = Object.keys(record);
        }
        columnKeys.forEach(function (key) {
            if (record.hasOwnProperty(key)) {
                data.push(record[key]);
            }
        });
        return {
            "id" : record.id,
            "data" : data
        };
    };
    
    return AGStorage;
}());


var AGTreeStorage = (function () {
    'use strict';
    
    /**
     * Creates a new instance of class AGTreeStorage.
     * @access public
     * @augments AGStorage
     * @constructs AGTreeStorage
     */
    function AGTreeStorage(storageObject, storageId, dataChanged) {
        this.storage = storageObject;
        this.id = storageId;
        this._setItem(this.id + "-tree", true);
        this.dataChanged = dataChanged;
    }
    
    // Inheritance
    AGTreeStorage.prototype = Object.create(AGStorage.prototype);
    AGTreeStorage.prototype.constructor = AGTreeStorage;
    
    return AGTreeStorage;
}());
