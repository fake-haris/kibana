/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

export {
  MIGRATION_CLIENT_OPTIONS,
  REMOVED_TYPES,
  SavedObjectsService,
  CoreSavedObjectsRouteHandlerContext,
  SAVED_OBJECT_TYPES_COUNT,
} from './src';
export type {
  InternalSavedObjectsServiceStart,
  InternalSavedObjectsServiceSetup,
  InternalSavedObjectsRequestHandlerContext,
  InternalSavedObjectRouter,
} from './src';

// only used by integration tests
export { registerDeleteUnknownTypesRoute } from './src/routes/deprecations';
export { registerBulkCreateRoute } from './src/routes/bulk_create';
export { registerBulkGetRoute } from './src/routes/bulk_get';
export { registerBulkResolveRoute } from './src/routes/bulk_resolve';
export { registerBulkUpdateRoute } from './src/routes/bulk_update';
export { registerBulkDeleteRoute } from './src/routes/bulk_delete';
export { registerCreateRoute } from './src/routes/create';
export { registerDeleteRoute } from './src/routes/delete';
export { registerExportRoute } from './src/routes/export';
export { registerFindRoute } from './src/routes/find';
export { registerGetRoute } from './src/routes/get';
export { registerImportRoute } from './src/routes/import';
export { registerMigrateRoute } from './src/routes/migrate';
export { registerResolveRoute } from './src/routes/resolve';
export { registerResolveImportErrorsRoute } from './src/routes/resolve_import_errors';
export { registerUpdateRoute } from './src/routes/update';
