exports.up = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.integer('id').unsigned().alter();
      t.dropPrimary('id');
      t.dropColumn('id');
   })
};

exports.down = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.increments('id').primary();
   })
};