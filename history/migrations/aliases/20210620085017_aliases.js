exports.up = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.string('username', 16).nullable().alter();
   })
};

exports.down = function(knex) {
   return knex.schema.table('aliases', function(t) {
      t.string('username', 16).notNullable().alter();
   })
};