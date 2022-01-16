exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.dropColumn('lugh_height');
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.specificType('lugh_height', 'int unsigned').notNullable();
   })
};