exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.increments('id').primary();
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.integer('id').unsigned().alter();
      t.dropPrimary('id');
      t.dropColumn('id');
   })
};