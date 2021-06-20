exports.up = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.dropForeign('sid');
      t.dropColumn('sid');
   })
};

exports.down = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.specificType('sid', 'int unsigned').references('id').inTable('societies').notNullable();
   })
};