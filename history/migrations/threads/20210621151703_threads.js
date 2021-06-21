exports.up = function(knex) {
   return knex.schema.table('threads', function(t) {
      t.string('title', 140).nullable().alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('threads', function(t) {
      t.string('title', 140).notNullable().alter();
   })
};