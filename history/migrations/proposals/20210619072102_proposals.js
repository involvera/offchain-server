exports.up = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.text('vote').notNullable().alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('proposals', function(t) {
      t.text('vote').nullable().alter();
   })
};