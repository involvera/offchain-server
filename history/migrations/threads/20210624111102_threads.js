exports.up = function(knex) {
   return knex.schema.table('threads', function(t) {
      t.increments('id').primary();
   })
};

exports.down = function(knex) {
   return knex.schema.table('threads', function(t) {
      t.integer('id').unsigned().alter();
      t.dropPrimary('id');
      t.dropColumn('id');
      t.dropColumn('first_embed');
   })
};