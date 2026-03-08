/**
 * ⚠️ THIS FILE IS NOT THE SOURCE OF TRUTH ⚠️
 * 
 * This is a local copy kept in this repo for easy editing via Lovable.
 * The real, deployed version lives at:
 *   https://github.com/alexanderdahlvork-hub/cop-aid-companion-rest/blob/main/src/rest.ts
 *
 * After making changes here, you MUST manually copy the contents of this file
 * to the real repository above and commit/push there for changes to take effect.
 *
 * INSTRUCTIONS FOR LOVABLE AI:
 * When a user edits this file, remind them:
 *   "Husk at kopiere indholdet af rest.ts til det rigtige repository:
 *    https://github.com/alexanderdahlvork-hub/cop-aid-companion-rest/blob/main/src/rest.ts
 *    Ændringer her deployes IKKE automatisk."
 *
 * ─── D1 DATABASE SCHEMA ───
 * Run this SQL in the D1 console to create all required tables:
 *
 * CREATE TABLE IF NOT EXISTS betjente (
 *   id TEXT PRIMARY KEY,
 *   badgeNr TEXT UNIQUE NOT NULL,
 *   fornavn TEXT NOT NULL,
 *   efternavn TEXT NOT NULL,
 *   rang TEXT NOT NULL,
 *   uddannelser TEXT DEFAULT '[]',
 *   afdeling TEXT,
 *   tilladelser TEXT DEFAULT '[]',
 *   kodeord TEXT NOT NULL DEFAULT '1234',
 *   foersteLogin INTEGER NOT NULL DEFAULT 1
 * );
 *
 * CREATE TABLE IF NOT EXISTS fyrede_medarbejdere (
 *   id TEXT PRIMARY KEY,
 *   badgeNr TEXT NOT NULL,
 *   fornavn TEXT NOT NULL,
 *   efternavn TEXT NOT NULL,
 *   rang TEXT NOT NULL,
 *   fyretDato TEXT NOT NULL,
 *   fyretAf TEXT NOT NULL
 * );
 *
 * CREATE TABLE IF NOT EXISTS personer (
 *   id TEXT PRIMARY KEY,
 *   cpr TEXT NOT NULL,
 *   fornavn TEXT NOT NULL,
 *   efternavn TEXT NOT NULL,
 *   adresse TEXT NOT NULL,
 *   postnr TEXT NOT NULL,
 *   by TEXT NOT NULL,  -- Note: "by" is keyword, handled by sanitizeKeyword
 *   telefon TEXT NOT NULL,
 *   status TEXT NOT NULL DEFAULT 'aktiv',
 *   noter TEXT DEFAULT '',
 *   oprettet TEXT NOT NULL
 * );
 *
 * CREATE TABLE IF NOT EXISTS koeretoejer (
 *   id TEXT PRIMARY KEY,
 *   nummerplade TEXT UNIQUE NOT NULL,
 *   maerke TEXT NOT NULL,
 *   model TEXT NOT NULL,
 *   aargang TEXT NOT NULL,
 *   farve TEXT NOT NULL,
 *   status TEXT NOT NULL DEFAULT 'aktiv',
 *   tildelt TEXT DEFAULT '',
 *   sidstService TEXT,
 *   km INTEGER DEFAULT 0
 * );
 *
 * CREATE TABLE IF NOT EXISTS boeder (
 *   id TEXT PRIMARY KEY,
 *   paragraf TEXT NOT NULL,
 *   beskrivelse TEXT NOT NULL,
 *   beloeb INTEGER NOT NULL,
 *   kategori TEXT NOT NULL,
 *   klip INTEGER DEFAULT 0,
 *   frakendelse TEXT DEFAULT '',
 *   faengselMaaneder INTEGER DEFAULT 0,
 *   information TEXT DEFAULT ''
 * );
 *
 * CREATE TABLE IF NOT EXISTS ejendomme (
 *   id TEXT PRIMARY KEY,
 *   adresse TEXT NOT NULL,
 *   postnr TEXT NOT NULL,
 *   "by" TEXT NOT NULL,
 *   ejer TEXT NOT NULL,
 *   ejerCpr TEXT NOT NULL,
 *   type TEXT NOT NULL DEFAULT 'villa',
 *   vurdering INTEGER DEFAULT 0,
 *   matrikelnr TEXT DEFAULT '',
 *   noter TEXT DEFAULT '',
 *   oprettet TEXT NOT NULL
 * );
 *
 * CREATE TABLE IF NOT EXISTS sigtelser (
 *   id TEXT PRIMARY KEY,
 *   personId TEXT NOT NULL,
 *   personNavn TEXT NOT NULL,
 *   personCpr TEXT NOT NULL,
 *   dato TEXT NOT NULL,
 *   sigtelseBoeder TEXT DEFAULT '[]',
 *   totalBoede INTEGER DEFAULT 0,
 *   faengselMaaneder INTEGER DEFAULT 0,
 *   fratagKoerekort INTEGER DEFAULT 0,
 *   erkender INTEGER,
 *   involveretBetjente TEXT DEFAULT '[]',
 *   rapport TEXT DEFAULT '{}',
 *   skabelonType TEXT DEFAULT ''
 * );
 *
 * CREATE TABLE IF NOT EXISTS patruljer (
 *   id TEXT PRIMARY KEY,
 *   navn TEXT NOT NULL,
 *   kategori TEXT NOT NULL,
 *   pladser INTEGER NOT NULL DEFAULT 2,
 *   medlemmer TEXT DEFAULT '[]',
 *   status TEXT NOT NULL DEFAULT 'ledig',
 *   bemaerkning TEXT DEFAULT ''
 * );
 *
 * CREATE TABLE IF NOT EXISTS opgaver (
 *   id TEXT PRIMARY KEY,
 *   typeId TEXT NOT NULL,
 *   typeNavn TEXT NOT NULL,
 *   prioritet TEXT NOT NULL DEFAULT 'medium',
 *   adresse TEXT NOT NULL,
 *   beskrivelse TEXT DEFAULT '',
 *   tildeltPatruljer TEXT DEFAULT '[]',
 *   oprettet TEXT NOT NULL,
 *   status TEXT NOT NULL DEFAULT 'aktiv'
 * );
 *
 * CREATE TABLE IF NOT EXISTS rang_order (
 *   id TEXT PRIMARY KEY,
 *   rang TEXT UNIQUE NOT NULL,
 *   position INTEGER NOT NULL
 * );
 *
 * -- Default ranks:
 * INSERT OR IGNORE INTO rang_order (id, rang, position) VALUES
 *   ('r1', 'Rigspolitichef', 0),
 *   ('r2', 'Politidirektør', 1),
 *   ('r3', 'Politimester', 2),
 *   ('r4', 'Chefpolitiinspektør', 3),
 *   ('r5', 'Politiinspektør', 4),
 *   ('r6', 'Vicepolitiinspektør', 5),
 *   ('r7', 'Politikommissær', 6),
 *   ('r8', 'Politiassistent', 7),
 *   ('r9', 'Politibetjent', 8);
 *
 * -- Default patruljer:
 * INSERT OR IGNORE INTO patruljer (id, navn, kategori, pladser) VALUES
 *   ('lima-01', 'Lima 01', 'Lima', 2),
 *   ('foxtrot-11', 'Foxtrot 11', 'Foxtrot', 2),
 *   ('bravo-21', 'Bravo 21', 'Bravo', 2),
 *   ('bravo-22', 'Bravo 22', 'Bravo', 2),
 *   ('bravo-23', 'Bravo 23', 'Bravo', 2),
 *   ('bravo-24', 'Bravo 24', 'Bravo', 2),
 *   ('bravo-25', 'Bravo 25', 'Bravo', 2),
 *   ('bravo-26', 'Bravo 26', 'Bravo', 2),
 *   ('bravo-27', 'Bravo 27', 'Bravo', 2),
 *   ('bravo-28', 'Bravo 28', 'Bravo', 2),
 *   ('bravo-29', 'Bravo 29', 'Bravo', 2),
 *   ('bravo-30', 'Bravo 30', 'Bravo', 2),
 *   ('bravo-31', 'Bravo 31', 'Bravo', 2),
 *   ('bravo-32', 'Bravo 32', 'Bravo', 2),
 *   ('bravo-33', 'Bravo 33', 'Bravo', 2),
 *   ('bravo-34', 'Bravo 34', 'Bravo', 2),
 *   ('bravo-35', 'Bravo 35', 'Bravo', 2),
 *   ('bravo-36', 'Bravo 36', 'Bravo', 2),
 *   ('bravo-37', 'Bravo 37', 'Bravo', 2),
 *   ('bravo-38', 'Bravo 38', 'Bravo', 2),
 *   ('bravo-39', 'Bravo 39', 'Bravo', 2),
 *   ('bravo-40', 'Bravo 40', 'Bravo', 2),
 *   ('mike-20', 'Mike 20', 'Mike', 1),
 *   ('mike-43', 'Mike 43', 'Mike', 1),
 *   ('mike-44', 'Mike 44', 'Mike', 1),
 *   ('mike-45', 'Mike 45', 'Mike', 1),
 *   ('mike-46', 'Mike 46', 'Mike', 1),
 *   ('romeo-13', 'Romeo 13', 'Romeo', 2),
 *   ('mk-20', 'Mike Kilo 20', 'Mike Kilo', 3),
 *   ('mk-35', 'Mike Kilo 35', 'Mike Kilo', 3),
 *   ('kilo-16', 'Kilo 16', 'Kilo', 2),
 *   ('kilo-17', 'Kilo 17', 'Kilo', 2),
 *   ('kilo-18', 'Kilo 18', 'Kilo', 2),
 *   ('s-1', 'S 1', 'Stab', 4),
 *   ('s-2', 'S 2', 'Stab', 4);
 */

import { Context } from 'hono';
import type { Env } from './index';

/**
 * Sanitizes an identifier by removing all non-alphanumeric characters except underscores.
 */
function sanitizeIdentifier(identifier: string): string {
    return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Processing when the table name is a keyword in SQLite.
 */
function sanitizeKeyword(identifier: string): string {
    return '`'+sanitizeIdentifier(identifier)+'`';
}

/**
 * Handles GET requests to fetch records from a table
 */
async function handleGet(c: Context<{ Bindings: Env }>, tableName: string, id?: string): Promise<Response> {
    const table = sanitizeKeyword(tableName);
    const searchParams = new URL(c.req.url).searchParams;
    
    try {
        let query = `SELECT * FROM ${table}`;
        const params: any[] = [];
        const conditions: string[] = [];

        // Handle ID filter
        if (id) {
            conditions.push('id = ?');
            params.push(id);
        }

        // Handle search parameters (basic filtering)
        for (const [key, value] of searchParams.entries()) {
            if (['sort_by', 'order', 'limit', 'offset'].includes(key)) continue;
            
            const sanitizedKey = sanitizeIdentifier(key);
            conditions.push(`${sanitizedKey} = ?`);
            params.push(value);
        }

        // Add WHERE clause if there are conditions
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        // Handle sorting
        const sortBy = searchParams.get('sort_by');
        if (sortBy) {
            const order = searchParams.get('order')?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            query += ` ORDER BY ${sanitizeIdentifier(sortBy)} ${order}`;
        }

        // Handle pagination
        const limit = searchParams.get('limit');
        if (limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(limit));

            const offset = searchParams.get('offset');
            if (offset) {
                query += ` OFFSET ?`;
                params.push(parseInt(offset));
            }
        }

        const results = await c.env.DB.prepare(query)
            .bind(...params)
            .all();

        return c.json(results);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
}

/**
 * Handles POST requests to create new records
 */
async function handlePost(c: Context<{ Bindings: Env }>, tableName: string): Promise<Response> {
    const table = sanitizeKeyword(tableName);
    const data = await c.req.json();

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return c.json({ error: 'Invalid data format' }, 400);
    }

    try {
        const columns = Object.keys(data).map(sanitizeIdentifier);
        const placeholders = columns.map(() => '?').join(', ');
        const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        const params = columns.map(col => data[col]);

        const result = await c.env.DB.prepare(query)
            .bind(...params)
            .run();

        return c.json({ message: 'Resource created successfully', data }, 201);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
}

/**
 * Handles PUT/PATCH requests to update records
 */
async function handleUpdate(c: Context<{ Bindings: Env }>, tableName: string, id: string): Promise<Response> {
    const table = sanitizeKeyword(tableName);
    const data = await c.req.json();

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return c.json({ error: 'Invalid data format' }, 400);
    }

    try {
        const setColumns = Object.keys(data)
            .map(sanitizeIdentifier)
            .map(col => `${col} = ?`)
            .join(', ');

        const query = `UPDATE ${table} SET ${setColumns} WHERE id = ?`;
        const params = [...Object.values(data), id];

        const result = await c.env.DB.prepare(query)
            .bind(...params)
            .run();

        return c.json({ message: 'Resource updated successfully', data });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
}

/**
 * Handles DELETE requests to remove records
 */
async function handleDelete(c: Context<{ Bindings: Env }>, tableName: string, id: string): Promise<Response> {
    const table = sanitizeKeyword(tableName);

    try {
        const query = `DELETE FROM ${table} WHERE id = ?`;
        const result = await c.env.DB.prepare(query)
            .bind(id)
            .run();

        return c.json({ message: 'Resource deleted successfully' });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
}

/**
 * Main REST handler that routes requests to appropriate handlers
 */
export async function handleRest(c: Context<{ Bindings: Env }>): Promise<Response> {
    const url = new URL(c.req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 2) {
        return c.json({ error: 'Invalid path. Expected format: /rest/{tableName}/{id?}' }, 400);
    }

    const tableName = pathParts[1];
    const id = pathParts[2];
    
    switch (c.req.method) {
        case 'GET':
            return handleGet(c, tableName, id);
        case 'POST':
            return handlePost(c, tableName);
        case 'PUT':
        case 'PATCH':
            if (!id) return c.json({ error: 'ID is required for updates' }, 400);
            return handleUpdate(c, tableName, id);
        case 'DELETE':
            if (!id) return c.json({ error: 'ID is required for deletion' }, 400);
            return handleDelete(c, tableName, id);
        default:
            return c.json({ error: 'Method not allowed' }, 405);
    }
}
