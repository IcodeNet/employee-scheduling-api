/**
 * The settingDAO module that provides an abstract interface to database
 * with CRUD operations.
 *
 * @author    Martin Micunda {@link http://martinmicunda.com}
 * @copyright Copyright (c) 2015, Martin Micunda
 * @license   GPL-3.0
 */
'use strict';

import uuid from 'node-uuid';
import mmLogger from 'mm-node-logger';
import db from '../../../config/couchbase';

const logger = mmLogger(module);
const DOC_TYPE = 'setting';

/**
 * Retrieves a setting by ID from DB.
 *
 * @param {String} id - The setting id
 * @returns {Object} the setting
 * @throws {Error} Will throw an error if it failed to retrieve a setting from DB.
 * @api public
 */
async function findByID(id) {
    //const query = db.N1qlQuery.fromString(`SELECT META().cas, META().id, \`${db.bucketName}\`.* FROM \`${db.bucketName}\` USE KEYS "${id}"`);
    //const data = await db.query(query);
    try {
        const data = await db.get(id);

        return Object.assign({id: id, cas: data.cas}, data.value);
    } catch(error) {
        logger.error(`DB findByID - ${DOC_TYPE} -`, error.message);
        throw db.handleError(error);
    }
}

/**
 * Retrieves list of settings from DB.
 *
 * @returns {Array.<Object>} the array that contains list of settings
 * @throws {Error} Will throw an error if it failed to retrieve a settings from DB.
 * @api public
 */
async function find() {
    const query = db.N1qlQuery.fromString(`SELECT meta().cas, meta().id, \`${db.bucketName}\`.* FROM \`${db.bucketName}\` WHERE type = '${DOC_TYPE}'`);

    try {
        return await db.query(query);
    } catch(error) {
        logger.error(`DB find - ${DOC_TYPE} -`, error.message);

        throw db.handleError(error);
    }
}

/**
 * Creates a setting document in DB.
 *
 * @param {Object} doc - The setting document
 * @param {String} doc.language - The default app language
 * @param {String} doc.avatar - The default app avatar
 * @param {String} doc.currencyCode - The default app currency code
 * @param {String} doc.currencySymbol - The default app currency symbol
 * @param {String} [id=uuid] - The setting id
 * @throws {Error} Will throw an error if it failed to create a setting document in DB.
 * @api public
 */
async function insert(doc, id = uuid.v1()) {
    doc.type = DOC_TYPE;
    //const query = db.N1qlQuery.fromString(`INSERT INTO \`${db.bucketName}\` (KEY, VALUE) VALUES ($1, $2) RETURNING \`${db.bucketName}\`.*`);

    try {
        const data = await db.insert(id, doc, db.durabilityOptions);
        data.id = id;

        return data;
    } catch(error) {
        logger.error(`DB insert - ${DOC_TYPE} -`, error.message);
        throw db.handleError(error);
    }
}

/**
 * Updates a setting document in DB.
 *
 * @param {Object} doc - The setting document
 * @param {String} doc.id - The setting id
 * @param {String} doc.cas - The couchbase cas value
 * @param {String} doc.avatar - The default app avatar
 * @param {String} doc.language - The default app language
 * @param {String} doc.currencyCode - The default app currency code
 * @param {String} doc.currencySymbol - The default app currency symbol
 * @throws {Error} Will throw an error if it failed to update a setting document in DB.
 * @api public
 */
async function update(doc) {
    const {id, cas} = doc;
    // do not store CAS(version) and document ID as Couchbase already keep these values in metadata for each document
    doc = db.removeMetadataFromDoc(doc);
    doc.type = DOC_TYPE; // map-reduces

    try {
        return await db.replace(id, doc, {cas: cas});
    } catch(error) {
        logger.error(`DB update - ${DOC_TYPE} -`, error.message);

        throw db.handleError(error);
    }
}

/**
 * Removes a setting document from DB.
 *
 * @param {String} id - The setting id
 * @throws {Error} Will throw an error if it failed to remove a setting document from DB.
 * @api public
 */
async function remove(id) {
    try {
        await db.remove(id);
    } catch(error) {
        logger.error(`DB remove - ${DOC_TYPE} -`, error.message);
        throw db.handleError(error);
    }
}

export {findByID, find, insert, update, remove};
// http://www.slideshare.net/Couchbase/migrations-rdbms-couchbasefinal-49133236
// http://developer.couchbase.com/documentation/server/4.0/n1ql/n1ql-language-reference/index.html
// https://gist.github.com/martinesmann/6eb50d033436decdfe3c#file-n1ql_samples-sql
// http://blog.couchbase.com/sql-for-documents-n1ql-brief-introduction-to-query-planning